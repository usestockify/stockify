// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IAggregatorV3, IUniswapV3Factory, IUniswapV3Pool, ISwapRouter02, INonfungiblePositionManager} from "../Interfaces.sol";

contract MockERC20 is ERC20 {
    uint8 private immutable _dec;
    constructor(string memory n, string memory s, uint8 d) ERC20(n, s) {
        _dec = d;
    }
    function decimals() public view override returns (uint8) {
        return _dec;
    }
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockAggregator is IAggregatorV3 {
    uint8 public decimals;
    int256 public answer;
    uint256 public updatedAt;
    constructor(uint8 d, int256 a) {
        decimals = d;
        answer = a;
        updatedAt = block.timestamp;
    }
    function set(int256 a, uint256 ts) external {
        answer = a;
        updatedAt = ts == 0 ? block.timestamp : ts;
    }
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (1, answer, updatedAt, updatedAt, 1);
    }
}

contract MockStock is MockERC20 {
    bool public oraclePaused;
    constructor() MockERC20("NVIDIA", "NVDA", 18) {}
    function setPaused(bool v) external {
        oraclePaused = v;
    }
}

/// @notice Minimal Uniswap-shaped DEX so strategy tests do not talk to mainnet.
contract MockDex is IUniswapV3Factory, IUniswapV3Pool, ISwapRouter02, INonfungiblePositionManager {
    address public token0;
    address public token1;
    uint24 public fee = 3000;
    int24 public tickSpacing = 60;
    uint160 public sqrtPriceX96 = 1 << 96;
    int24 public tick;
    uint128 public liquidity;
    address public poolAddress;
    uint256 public nextId = 1;
    mapping(uint256 => uint128) public liqOf;
    mapping(uint256 => uint256) public amt0Of;
    mapping(uint256 => uint256) public amt1Of;
    mapping(address => address) public pools;

    constructor(address t0, address t1) {
        token0 = t0 < t1 ? t0 : t1;
        token1 = t0 < t1 ? t1 : t0;
        poolAddress = address(this);
        pools[t0] = address(this);
        pools[t1] = address(this);
    }

    function factory() external view returns (address) {
        return address(this);
    }

    function getPool(address, address, uint24) external view returns (address) {
        return address(this);
    }

    function feeAmountTickSpacing(uint24) external view returns (int24) {
        return 60;
    }

    function createPool(address, address, uint24) external returns (address) {
        return address(this);
    }

    function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool) {
        return (sqrtPriceX96, tick, 0, 0, 0, 0, true);
    }

    function initialize(uint160 sqrtP) external {
        sqrtPriceX96 = sqrtP;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut) {
        IERC20Lite(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn);
        uint8 din = IERC20Lite(params.tokenIn).decimals();
        uint8 dout = IERC20Lite(params.tokenOut).decimals();
        if (din == 6 && dout == 18) {
            amountOut = (params.amountIn * (10 ** 18)) / (100 * (10 ** 6));
        } else if (din == 18 && dout == 6) {
            amountOut = (params.amountIn * 100 * (10 ** 6)) / (10 ** 18);
        } else {
            amountOut = params.amountIn;
        }
        if (amountOut == 0) amountOut = 1;
        IERC20Lite(params.tokenOut).mint(params.recipient, amountOut);
    }

    function mint(MintParams calldata params)
        external
        payable
        returns (uint256 tokenId, uint128 liq, uint256 amount0, uint256 amount1)
    {
        tokenId = nextId++;
        amount0 = params.amount0Desired;
        amount1 = params.amount1Desired;
        if (amount0 > 0) IERC20Lite(params.token0).transferFrom(msg.sender, address(this), amount0);
        if (amount1 > 0) IERC20Lite(params.token1).transferFrom(msg.sender, address(this), amount1);
        liq = uint128(amount0 + amount1);
        if (liq == 0) liq = 1;
        liqOf[tokenId] = liq;
        amt0Of[tokenId] = amount0;
        amt1Of[tokenId] = amount1;
        liquidity += liq;
    }

    function increaseLiquidity(IncreaseLiquidityParams calldata params)
        external
        payable
        returns (uint128 liq, uint256 amount0, uint256 amount1)
    {
        amount0 = params.amount0Desired;
        amount1 = params.amount1Desired;
        address t0 = token0;
        address t1 = token1;
        if (amount0 > 0) IERC20Lite(t0).transferFrom(msg.sender, address(this), amount0);
        if (amount1 > 0) IERC20Lite(t1).transferFrom(msg.sender, address(this), amount1);
        liq = uint128(amount0 + amount1);
        liqOf[params.tokenId] += liq;
        liquidity += liq;
    }

    function decreaseLiquidity(DecreaseLiquidityParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1)
    {
        uint128 have = liqOf[params.tokenId];
        uint128 liq = params.liquidity;
        if (liq > have) liq = have;
        uint256 amount0 = have == 0 ? 0 : (amt0Of[params.tokenId] * uint256(liq)) / uint256(have);
        uint256 amount1 = have == 0 ? 0 : (amt1Of[params.tokenId] * uint256(liq)) / uint256(have);
        liqOf[params.tokenId] -= liq;
        amt0Of[params.tokenId] -= amount0;
        amt1Of[params.tokenId] -= amount1;
        liquidity -= liq;
        if (amount0 > 0) IERC20Lite(token0).mint(msg.sender, amount0);
        if (amount1 > 0) IERC20Lite(token1).mint(msg.sender, amount1);
        return (amount0, amount1);
    }

    function collect(CollectParams calldata) external payable returns (uint256 amount0, uint256 amount1) {
        amount0 = 0;
        amount1 = 0;
    }

    function positions(uint256 tokenId)
        external
        view
        returns (uint96, address, address, address, uint24, int24, int24, uint128, uint256, uint256, uint128, uint128)
    {
        uint128 liq = liqOf[tokenId];
        return (0, address(0), token0, token1, fee, -120, 120, liq, 0, 0, 0, 0);
    }

    function setTick(int24 t) external {
        tick = t;
    }
}

interface IERC20Lite {
    function transferFrom(address, address, uint256) external returns (bool);
    function mint(address, uint256) external;
    function decimals() external view returns (uint8);
}
