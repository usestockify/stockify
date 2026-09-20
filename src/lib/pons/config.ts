import type { Address } from "viem";

/**
 * PONS v2 contracts on Robinhood Chain.
 * Factory identity is verified on Robinhood Chain Explorer (PonsV2LaunchFactory).
 * Companion addresses are the current PONS v2 stack; feeEscrow and buybackVault
 * are also readable from the factory.
 */
export const PONS_V2 = {
  factory: "0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e",
  memeHook: "0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044",
  feeEscrow: "0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e",
  buybackVault: "0x42df2a798f82289E177311362e8f5ccC45c1219c",
  launchLocker: "0x267444D099b10fB5Ed7c3Cc7B7c767AdcA574952",
  launchAndBuy: "0xe33E9E479dF8802cb0866d5d05258bEc4cF62948",
  launchDeployer: "0x3711ceA4feaDE896C913C68F01Eda97Cb06D1A42",
  graduationExecutor: "0xC7819B64A1dAECD7eC19856d026cb14EfBd89046",
  graduationGuard: "0xf5695117b99B6f6401e67d4195BD653628176C6C",
} as const satisfies Record<string, Address>;

/**
 * Factory creation transaction on Robinhood Chain Explorer:
 * 0x3817f297aa7c2ef78789bffac57491ceedc218fef962d47ed36c272699deddeb
 */
export const PONS_FACTORY_START_BLOCK = 26841846n;

export const UNISWAP_V4_POOL_MANAGER_DOCUMENTED = "0x8366a39CC670B4001A1121B8F6A443A643e40951" as Address;

export type PonsLaunchState = "not-graduated" | "swept" | "pool-created" | "rescued" | "unknown";

export const PONS_PHASE: Record<number, PonsLaunchState> = {
  0: "not-graduated",
  1: "swept",
  2: "pool-created",
  3: "rescued",
};

export type PonsPairKind = "eth" | "usdg" | "stock-token" | "other";

export type PonsPairAsset = {
  address: Address;
  kind: PonsPairKind;
  native: boolean;
  symbol: string | null;
  name: string | null;
  decimals: number | null;
};

export type PonsLaunch = {
  token: Address;
  curve: Address;
  deployer: Address;
  creatorFeeRecipient: Address;
  pair: PonsPairAsset;
  graduationThreshold: string;
  poolFee: number;
  tickSpacing: number;
  creatorTaxBps: number;
  buybackEnabled: boolean;
  state: PonsLaunchState;
  phase: number;
  sweptQuote: string;
  sweptTokens: string;
  sweptAt: string;
  exists: boolean;
  launchConfigId: string | null;
  metadata: {
    name: string | null;
    symbol: string | null;
    decimals: number | null;
    logo: string | null;
    description: string | null;
  };
  curveLive: {
    graduated: boolean | null;
    quoteReserve: string | null;
    tokenReserve: string | null;
    sellableTokens: string | null;
    readyToGraduate: boolean | null;
    feeBps: string | null;
    creatorTaxBps: string | null;
  } | null;
};
