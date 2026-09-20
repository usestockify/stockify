import { parseAbi } from "viem";

export const stockifyVaultAbi = parseAbi([
  "function asset() view returns (address)",
  "function stock() view returns (address)",
  "function ticker() view returns (string)",
  "function strategy() view returns (address)",
  "function principal() view returns (uint256)",
  "function totalAssets() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function paused() view returns (bool)",
  "function previewDeposit(uint256) view returns (uint256)",
  "function previewRedeem(uint256) view returns (uint256)",
  "function convertToAssets(uint256) view returns (uint256)",
  "function deposit(uint256 assets, address receiver) returns (uint256)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)",
  "event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)",
  "event StrategyBound(address indexed strategy)",
]);

export const stockifyStrategyAbi = parseAbi([
  "function totalAssets() view returns (uint256)",
  "function exposures() view returns (uint256 usdgAmount, uint256 stockAmount)",
  "function range() view returns (int24 lower, int24 current, int24 upper, bool inRange)",
  "function fees() view returns (uint256 lifetimeUsdg, uint256 collected0, uint256 collected1)",
  "function paused() view returns (bool)",
  "function pool() view returns (address)",
  "event LiquidityAdded(uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "event LiquidityRemoved(uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "event FeesCollected(uint256 amount0, uint256 amount1, uint256 usdgValue)",
  "event Rebalanced(int24 lower, int24 current, int24 upper)",
]);

export const stockifyRouterAbi = parseAbi([
  "function usdg() view returns (address)",
  "function registry() view returns (address)",
  "function deposit(address vault, uint256 assets, address receiver, uint256 minShares) returns (uint256)",
  "function redeem(address vault, uint256 shares, address receiver, uint256 minAssets) returns (uint256)",
  "event Deposited(address indexed vault, address indexed owner, uint256 assets, uint256 shares)",
  "event Redeemed(address indexed vault, address indexed owner, uint256 shares, uint256 assets)",
]);

export const stockifyRegistryAbi = parseAbi([
  "function usdg() view returns (address)",
  "function marketCount() view returns (uint256)",
  "function allTickers() view returns (string[])",
  "function market(string ticker) view returns ((address stock, address usdg, address vault, address strategy, string ticker, bool listed))",
]);

export const stockifyFactoryAbi = parseAbi([
  "function usdg() view returns (address)",
  "function vaultCount() view returns (uint256)",
  "function vaultOf(address stock) view returns (address)",
  "event VaultCreated(address indexed stock, address indexed vault, string ticker)",
]);

export const stockifyStrategyFactoryAbi = parseAbi([
  "function strategyCount() view returns (uint256)",
  "event StrategyDeployed(address indexed vault, address indexed stock, address indexed strategy, address pool)",
]);

export const stockifyOracleAbi = parseAbi([
  "function usdg() view returns (address)",
  "function isFresh(address stock) view returns (bool)",
  "function stockPriceInUsdg(address stock) view returns (uint256, uint256)",
]);
