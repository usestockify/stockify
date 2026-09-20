import type { Address } from "viem";

/**
 * Official Uniswap deployments on Robinhood Chain (4663).
 * Source: https://developers.uniswap.org/docs/protocols/v3/deployments/v3-robinhood-chain-deployments
 * V4 PoolManager / PositionManager from Uniswap sdk-core ROBINHOOD_ADDRESSES.
 * Launch preflight re-checks bytecode before any broadcast.
 */
export const UNISWAP_ROBINHOOD = {
  v3Factory: "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA" as Address,
  swapRouter02: "0xCaf681a66D020601342297493863E78C959E5cb2" as Address,
  quoterV2: "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7" as Address,
  positionManager: "0x73991a25c818bf1f1128deaab1492d45638de0d3" as Address,
  universalRouter: "0x8876789976dEcBfCbBbe364623C63652db8C0904" as Address,
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3" as Address,
  v4PoolManager: "0x8366a39CC670B4001A1121B8F6A443A643e40951" as Address,
  v4PositionManager: "0x58daec3116aae6d93017baaea7749052e8a04fa7" as Address,
  v4Quoter: "0x8dc178efb8111bb0973dd9d722ebeff267c98f94" as Address,
  v4StateView: "0xf3334192d15450cdd385c8b70e03f9a6bd9e673b" as Address,
} as const;

export const UNISWAP_V3_FEE_TIERS = [100, 500, 3000, 10000] as const;

export const CHAINLINK_FEEDS_URL = "https://reference-data-directory.vercel.app/feeds-robinhood-mainnet.json";
