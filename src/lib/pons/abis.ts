import { parseAbi } from "viem";

/**
 * ABIs taken from the official PONS v2 contracts
 * (ponsdotdev/ponsfamily, contracts/v2): ILaunchFactory, LaunchFactory,
 * BondingCurve, LaunchToken. Signatures are not guessed.
 */
export const ponsLaunchFactoryAbi = parseAbi([
  "function getLaunchedToken(address token) view returns ((address token, address curve, address deployer, address creatorFeeRecipient, address pairToken, uint256 graduationThreshold, uint24 poolFee, int24 tickSpacing, uint16 creatorTaxBps, bool buybackEnabled, uint8 phase, uint256 sweptQuote, uint256 sweptTokens, uint256 sweptAt, bool exists))",
  "function getLaunchFeePolicy(address token) view returns ((address protocolFeeRecipient, uint16 protocolFeeShareBps, uint16 buybackBurnBps, uint16 hookFeeBps, uint16 maxInternalPriceImpactBps))",
  "function feeEscrow() view returns (address)",
  "function buybackVault() view returns (address)",
  "function approvedPairTokens(address pairToken) view returns (bool)",
  "function pairTokenEconomics(address pairToken) view returns (uint256 phantomQuote, uint256 graduationThreshold, uint8 decimals)",
  "function launchConfigCount() view returns (uint256)",
  "function getLaunchConfig(uint256 id) view returns ((uint256 supply, uint256 curveFeeBps, uint256 phantomQuote, uint256 graduationThreshold, uint24 poolFee, int24 tickSpacing, bool enabled))",
  "event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)",
  "event LaunchSwept(address indexed token, uint256 sweptQuote, uint256 sweptTokens)",
  "event PoolGraduated(address indexed token, bytes32 indexed poolId, address indexed pool)",
  "event LaunchRescued(address indexed token, uint256 quoteReturned)",
  "event PairTokenApproved(address indexed pairToken, bool approved, uint256 phantomQuote, uint256 graduationThreshold)",
]);

export const ponsBondingCurveAbi = parseAbi([
  "function factory() view returns (address)",
  "function token() view returns (address)",
  "function pairToken() view returns (address)",
  "function pairDecimals() view returns (uint8)",
  "function phantomQuote() view returns (uint256)",
  "function graduationThreshold() view returns (uint256)",
  "function k() view returns (uint256)",
  "function reservedTokensAmount() view returns (uint256)",
  "function feeBps() view returns (uint256)",
  "function creatorTaxBps() view returns (uint256)",
  "function buybackEnabled() view returns (bool)",
  "function realQuoteReserve() view returns (uint256)",
  "function tokenReserve() view returns (uint256)",
  "function graduated() view returns (bool)",
  "function isNativeQuote() view returns (bool)",
  "function quoteReserve() view returns (uint256)",
  "function sellableTokens() view returns (uint256)",
  "function reservedTokens() view returns (uint256)",
  "function readyToGraduate() view returns (bool)",
  "function getReserves() view returns (uint256 quoteReserve_, uint256 tokenReserve_)",
]);

export const ponsLaunchTokenAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function tokenDeployer() view returns (address)",
  "function tokenLogo() view returns (string)",
  "function tokenDescription() view returns (string)",
  "function getTokenInfo() view returns (address deployer, string logo, string description, (string twitter, string telegram, string discord, string website, string farcaster) socials)",
]);

export const uniswapV4PoolManagerAbi = parseAbi([
  "function getSlot0(bytes32 id) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)",
]);
