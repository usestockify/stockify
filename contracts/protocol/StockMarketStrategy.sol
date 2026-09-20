// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {TickMath} from "./TickMath.sol";
import {
    IOracleAdapter,
    IStockMarketStrategy,
    IUniswapV3Factory,
    IUniswapV3Pool,
    ISwapRouter02,
    INonfungiblePositionManager
} from "./Interfaces.sol";

/// @notice Deploys USDG + stock-token concentrated liquidity on a verified Uniswap V3 pool.
contract StockMarketStrategy is IStockMarketStrategy, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable vault;
    address public immutable stock;
    address public immutable usdg;
    address public immutable oracle;
    IUniswapV3Factory public immutable v3Factory;
    INonfungiblePositionManager public immutable npm;
    ISwapRouter02 public immutable swapRouter;
    uint8 public immutable stockDecimals;
    uint8 public immutable usdgDecimals;

    uint24 public poolFee;
    int24 public tickSpacing;
    uint16 public rangeWidthBps;
    address public keeper;
    address public pool;
    uint256 public positionId;
    uint256 public lifetimeFeesUsdg;
    uint256 public collected0;
    uint256 public collected1;
    uint256 public lpUsdg;
    uint256 public lpStock;

    event LiquidityAdded(uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
    event LiquidityRemoved(uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
    event FeesCollected(uint256 amount0, uint256 amount1, uint256 usdgValue);
    event Rebalanced(int24 lower, int24 current, int24 upper);
    event RangeWidthSet(uint16 bps);
    event KeeperSet(address keeper);

    error OnlyVault();
    error OnlyKeeper();
    error Slippage();
    error Deadline();
    error NoPool();
    error Zero();

    constructor(
        address vault_,
        address stock_,
        address usdg_,
        address oracle_,
        address factory_,
        address npm_,
        address router_,
        uint24 poolFee_,
        uint16 rangeWidthBps_,
        address owner_
    ) Ownable(owner_) {
        if (vault_ == address(0) || stock_ == address(0) || usdg_ == address(0)) revert Zero();
        vault = vault_;
        stock = stock_;
        usdg = usdg_;
        oracle = oracle_;
        v3Factory = IUniswapV3Factory(factory_);
        npm = INonfungiblePositionManager(npm_);
        swapRouter = ISwapRouter02(router_);
        poolFee = poolFee_;
        rangeWidthBps = rangeWidthBps_ == 0 ? 2000 : rangeWidthBps_;
        tickSpacing = IUniswapV3Factory(factory_).feeAmountTickSpacing(poolFee_);
        if (tickSpacing == 0) revert NoPool();
        pool = IUniswapV3Factory(factory_).getPool(stock_, usdg_, poolFee_);
        stockDecimals = IERC20Metadata(stock_).decimals();
        usdgDecimals = IERC20Metadata(usdg_).decimals();
        keeper = owner_;
        IERC20(usdg_).approve(npm_, type(uint256).max);
        IERC20(stock_).approve(npm_, type(uint256).max);
        IERC20(usdg_).approve(router_, type(uint256).max);
        IERC20(stock_).approve(router_, type(uint256).max);
    }

    function setKeeper(address keeper_) external onlyOwner {
        keeper = keeper_;
        emit KeeperSet(keeper_);
    }

    function setRangeWidth(uint16 bps) external onlyOwner {
        require(bps >= 100 && bps <= 8000, "WIDTH");
        rangeWidthBps = bps;
        emit RangeWidthSet(bps);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function exposures() public view returns (uint256 usdgAmount, uint256 stockAmount) {
        usdgAmount = IERC20(usdg).balanceOf(address(this)) + lpUsdg;
        stockAmount = IERC20(stock).balanceOf(address(this)) + lpStock;
    }

    function totalAssets() public view returns (uint256) {
        (uint256 usdgAmount, uint256 stockAmount) = exposures();
        (uint256 priceWad,) = IOracleAdapter(oracle).stockPriceInUsdg(stock);
        uint256 stockAsUsdg = (stockAmount * priceWad) / (10 ** (18 + stockDecimals - usdgDecimals));
        return usdgAmount + stockAsUsdg;
    }

    function range() public view returns (int24 lower, int24 current, int24 upper, bool inRange) {
        address p = pool;
        if (p == address(0)) return (0, 0, 0, false);
        (, int24 tick,,,,,) = IUniswapV3Pool(p).slot0();
        current = tick;
        if (positionId != 0) {
            (,,,,, int24 lo, int24 hi,,,,,) = npm.positions(positionId);
            lower = lo;
            upper = hi;
        } else {
            (lower, upper) = ticksAround(tick);
        }
        inRange = current >= lower && current < upper;
    }

    function fees() external view returns (uint256 lifetimeUsdg, uint256 c0, uint256 c1) {
        return (lifetimeFeesUsdg, collected0, collected1);
    }

    function deposit(uint256 usdgAmount) external nonReentrant whenNotPaused {
        if (msg.sender != vault) revert OnlyVault();
        if (usdgAmount == 0) revert Zero();
        IOracleAdapter(oracle).requireFresh(stock);
        ensurePool();
        deployLiquidity();
    }

    function withdraw(uint256 usdgAmount, address receiver) external nonReentrant returns (uint256 returned) {
        if (msg.sender != vault) revert OnlyVault();
        if (usdgAmount == 0) revert Zero();
        uint256 idle = IERC20(usdg).balanceOf(address(this));
        if (idle < usdgAmount) {
            IOracleAdapter(oracle).requireFresh(stock);
            unwind(usdgAmount - idle);
        }
        returned = IERC20(usdg).balanceOf(address(this));
        if (returned > usdgAmount) returned = usdgAmount;
        if (returned == 0) {
            if (IERC20(usdg).balanceOf(address(this)) == 0 && lpUsdg == 0) revert Zero();
            returned = IERC20(usdg).balanceOf(address(this));
            if (returned == 0) revert Zero();
        }
        IERC20(usdg).safeTransfer(receiver, returned);
    }

    function rebalance(uint256 minUsdgOut, uint256 deadline) external nonReentrant whenNotPaused {
        if (msg.sender != keeper && msg.sender != owner()) revert OnlyKeeper();
        if (block.timestamp > deadline) revert Deadline();
        IOracleAdapter(oracle).requireFresh(stock);
        collectFees();
        exitPosition();
        swapAllStockToUsdg();
        uint256 usdgBal = IERC20(usdg).balanceOf(address(this));
        if (usdgBal < minUsdgOut) revert Slippage();
        deployLiquidity();
        (int24 lower, int24 current, int24 upper,) = range();
        emit Rebalanced(lower, current, upper);
    }

    function ensurePool() internal {
        if (pool != address(0) && pool.code.length > 0) return;
        address existing = v3Factory.getPool(stock, usdg, poolFee);
        if (existing == address(0)) {
            existing = v3Factory.createPool(stock, usdg, poolFee);
            IUniswapV3Pool(existing).initialize(oracleSqrtPrice());
        } else {
            (uint160 sqrtP,,,,,,) = IUniswapV3Pool(existing).slot0();
            if (sqrtP == 0) IUniswapV3Pool(existing).initialize(oracleSqrtPrice());
        }
        pool = existing;
    }

    function deployLiquidity() internal {
        uint256 usdgBal = IERC20(usdg).balanceOf(address(this));
        if (usdgBal == 0) return;
        uint256 half = usdgBal / 2;
        if (half > 0) {
            swapRouter.exactInputSingle(
                ISwapRouter02.ExactInputSingleParams({
                    tokenIn: usdg,
                    tokenOut: stock,
                    fee: poolFee,
                    recipient: address(this),
                    amountIn: half,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );
        }
        mintOrIncrease();
    }

    function unwind(uint256) internal {
        collectFees();
        exitPosition();
        swapAllStockToUsdg();
    }

    function exitPosition() internal {
        if (positionId == 0) return;
        (,,,,,,, uint128 liq,,,,) = npm.positions(positionId);
        if (liq > 0) {
            npm.decreaseLiquidity(
                INonfungiblePositionManager.DecreaseLiquidityParams({
                    tokenId: positionId,
                    liquidity: liq,
                    amount0Min: 0,
                    amount1Min: 0,
                    deadline: block.timestamp
                })
            );
            emit LiquidityRemoved(positionId, liq, 0, 0);
        }
        collectFees();
        lpUsdg = 0;
        lpStock = 0;
    }

    function mintOrIncrease() internal {
        uint256 a0 = IERC20(token0()).balanceOf(address(this));
        uint256 a1 = IERC20(token1()).balanceOf(address(this));
        if (a0 == 0 && a1 == 0) return;
        (, int24 tick,,,,,) = IUniswapV3Pool(pool).slot0();
        (int24 lower, int24 upper) = ticksAround(tick);
        if (positionId == 0) {
            (uint256 tokenId, uint128 liq, uint256 used0, uint256 used1) = npm.mint(
                INonfungiblePositionManager.MintParams({
                    token0: token0(),
                    token1: token1(),
                    fee: poolFee,
                    tickLower: lower,
                    tickUpper: upper,
                    amount0Desired: a0,
                    amount1Desired: a1,
                    amount0Min: 0,
                    amount1Min: 0,
                    recipient: address(this),
                    deadline: block.timestamp
                })
            );
            positionId = tokenId;
            _creditLp(used0, used1);
            emit LiquidityAdded(tokenId, liq, used0, used1);
        } else {
            (uint128 liq, uint256 used0, uint256 used1) = npm.increaseLiquidity(
                INonfungiblePositionManager.IncreaseLiquidityParams({
                    tokenId: positionId,
                    amount0Desired: a0,
                    amount1Desired: a1,
                    amount0Min: 0,
                    amount1Min: 0,
                    deadline: block.timestamp
                })
            );
            _creditLp(used0, used1);
            emit LiquidityAdded(positionId, liq, used0, used1);
        }
    }

    function collectFees() internal {
        if (positionId == 0) return;
        (uint256 a0, uint256 a1) = npm.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: positionId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );
        if (a0 == 0 && a1 == 0) return;
        collected0 += a0;
        collected1 += a1;
        uint256 usdgValue = tokenValueUsdg(token0(), a0) + tokenValueUsdg(token1(), a1);
        lifetimeFeesUsdg += usdgValue;
        emit FeesCollected(a0, a1, usdgValue);
    }

    function _creditLp(uint256 used0, uint256 used1) internal {
        if (token0() == usdg) {
            lpUsdg += used0;
            lpStock += used1;
        } else {
            lpStock += used0;
            lpUsdg += used1;
        }
    }

    function swapAllStockToUsdg() internal {
        uint256 bal = IERC20(stock).balanceOf(address(this));
        if (bal == 0) return;
        swapRouter.exactInputSingle(
            ISwapRouter02.ExactInputSingleParams({
                tokenIn: stock,
                tokenOut: usdg,
                fee: poolFee,
                recipient: address(this),
                amountIn: bal,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            })
        );
    }

    function token0() internal view returns (address) {
        return stock < usdg ? stock : usdg;
    }

    function token1() internal view returns (address) {
        return stock < usdg ? usdg : stock;
    }

    function tokenValueUsdg(address token, uint256 amount) internal view returns (uint256) {
        if (amount == 0) return 0;
        if (token == usdg) return amount;
        (uint256 priceWad,) = IOracleAdapter(oracle).stockPriceInUsdg(stock);
        return (amount * priceWad) / (10 ** (18 + stockDecimals - usdgDecimals));
    }

    function ticksAround(int24 current) internal view returns (int24 lower, int24 upper) {
        int24 spacing = tickSpacing;
        int24 width = int24(uint24(rangeWidthBps));
        // ~1 tick ≈ 1 bps; width on each side.
        int24 delta = (width * 1) / 1;
        if (delta < spacing) delta = spacing;
        lower = TickMath.nearestUsableTick(current - delta, spacing);
        upper = TickMath.nearestUsableTick(current + delta, spacing);
        if (upper <= lower) upper = lower + spacing;
    }

    function oracleSqrtPrice() internal view returns (uint160) {
        (uint256 priceWad,) = IOracleAdapter(oracle).stockPriceInUsdg(stock);
        // token1/token0 raw = if token0 is stock: (priceWad * 10^usdgDec) / 10^(18+stockDec)
        uint256 num;
        uint256 den;
        if (token0() == stock) {
            num = priceWad * (10 ** usdgDecimals);
            den = 10 ** (18 + stockDecimals);
        } else {
            num = 10 ** (18 + stockDecimals);
            den = priceWad * (10 ** usdgDecimals);
        }
        uint256 priceX192 = (num << 192) / den;
        return uint160(sqrt(priceX192));
    }

    function amountsForLiquidity(uint128 liq, int24 tickLower, int24 tickUpper, uint160 sqrtP)
        internal
        pure
        returns (uint256 amount0, uint256 amount1)
    {
        uint160 sa = TickMath.getSqrtRatioAtTick(tickLower);
        uint160 sb = TickMath.getSqrtRatioAtTick(tickUpper);
        if (sqrtP <= sa) {
            amount0 = (uint256(liq) << 96) / uint256(sa) - (uint256(liq) << 96) / uint256(sb);
        } else if (sqrtP < sb) {
            amount0 = (uint256(liq) << 96) / uint256(sqrtP) - (uint256(liq) << 96) / uint256(sb);
            amount1 = (uint256(liq) * (uint256(sqrtP) - uint256(sa))) >> 96;
        } else {
            amount1 = (uint256(liq) * (uint256(sb) - uint256(sa))) >> 96;
        }
    }

    function mulDiv(uint256 a, uint256 b, uint256 c) internal pure returns (uint256) {
        if (c == 0) return 0;
        return (a * b) / c;
    }

    function sqrt(uint256 x) internal pure returns (uint256 z) {
        if (x == 0) return 0;
        z = x;
        uint256 y = (x + 1) / 2;
        while (y < z) {
            z = y;
            y = (x / y + y) / 2;
        }
    }
}
