// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAggregatorV3 {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

interface IOracleAdapter {
    function usdg() external view returns (address);
    function latestStockUsd(address stock) external view returns (uint256 price, uint8 decimals, uint256 updatedAt);
    function latestUsdgUsd() external view returns (uint256 price, uint8 decimals, uint256 updatedAt);
    function stockPriceInUsdg(address stock) external view returns (uint256 priceWad, uint256 updatedAt);
    function requireFresh(address stock) external view;
    function isFresh(address stock) external view returns (bool);
    function oraclePaused(address stock) external view returns (bool);
}

interface IStockMarketStrategy {
    function vault() external view returns (address);
    function stock() external view returns (address);
    function usdg() external view returns (address);
    function pool() external view returns (address);
    function totalAssets() external view returns (uint256);
    function exposures() external view returns (uint256 usdgAmount, uint256 stockAmount);
    function range() external view returns (int24 lower, int24 current, int24 upper, bool inRange);
    function fees() external view returns (uint256 lifetimeUsdg, uint256 collected0, uint256 collected1);
    function deposit(uint256 usdgAmount) external;
    function withdraw(uint256 usdgAmount, address receiver) external returns (uint256 returned);
    function rebalance(uint256 minUsdgOut, uint256 deadline) external;
}

interface IStockifyVault {
    function asset() external view returns (address);
    function stock() external view returns (address);
    function strategy() external view returns (address);
    function ticker() external view returns (string memory);
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function mint(uint256 shares, address receiver) external returns (uint256 assets);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    function totalAssets() external view returns (uint256);
    function principal() external view returns (uint256);
}

interface IUniswapV3Factory {
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool);
    function feeAmountTickSpacing(uint24 fee) external view returns (int24);
    function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool);
}

interface IUniswapV3Pool {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function fee() external view returns (uint24);
    function tickSpacing() external view returns (int24);
    function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool);
    function liquidity() external view returns (uint128);
    function initialize(uint160 sqrtPriceX96) external;
}

interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

interface INonfungiblePositionManager {
    function factory() external view returns (address);
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }
    struct IncreaseLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }
    struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }
    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }
    function mint(MintParams calldata params)
        external
        payable
        returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
    function increaseLiquidity(IncreaseLiquidityParams calldata params)
        external
        payable
        returns (uint128 liquidity, uint256 amount0, uint256 amount1);
    function decreaseLiquidity(DecreaseLiquidityParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1);
    function collect(CollectParams calldata params) external payable returns (uint256 amount0, uint256 amount1);
    function positions(uint256 tokenId)
        external
        view
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        );
}
