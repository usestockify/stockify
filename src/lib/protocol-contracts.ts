import { USDG_ADDRESS } from "@/lib/chain";
import { PONS_V2 } from "@/lib/pons/config";

export type ContractStatus = "configured" | "not-configured";

export type ProtocolContract = {
  id: string;
  label: string;
  address: string | null;
  status: ContractStatus;
  layer: "stockify" | "pons" | "robinhood";
};

/**
 * Stockify contract surface. Only addresses that are actually configured
 * appear; everything else stays unpublished. Never invent a 0x value.
 * PONS is not the Stockify vault system.
 */
export const PROTOCOL_CONTRACTS: ProtocolContract[] = [
  { id: "usdg", label: "USDG", address: USDG_ADDRESS, status: "configured", layer: "robinhood" },
  { id: "factory", label: "Vault Factory", address: null, status: "not-configured", layer: "stockify" },
  { id: "router", label: "Router", address: null, status: "not-configured", layer: "stockify" },
  { id: "registry", label: "Stock Token Registry", address: null, status: "not-configured", layer: "stockify" },
  { id: "oracle", label: "Oracle Adapter", address: null, status: "not-configured", layer: "stockify" },
  { id: "markets", label: "Market Contracts", address: null, status: "not-configured", layer: "stockify" },
];

export const PONS_CONTRACTS: ProtocolContract[] = [
  { id: "pons-factory", label: "PONS v2 Factory", address: PONS_V2.factory, status: "configured", layer: "pons" },
  { id: "pons-meme-hook", label: "PONS Meme Hook", address: PONS_V2.memeHook, status: "configured", layer: "pons" },
  { id: "pons-fee-escrow", label: "PONS Fee Escrow", address: PONS_V2.feeEscrow, status: "configured", layer: "pons" },
  { id: "pons-buyback", label: "PONS Buyback Vault", address: PONS_V2.buybackVault, status: "configured", layer: "pons" },
  { id: "pons-locker", label: "PONS Launch Locker", address: PONS_V2.launchLocker, status: "configured", layer: "pons" },
  { id: "pons-launch-and-buy", label: "PONS Launch and Buy", address: PONS_V2.launchAndBuy, status: "configured", layer: "pons" },
  { id: "pons-deployer", label: "PONS Launch Deployer", address: PONS_V2.launchDeployer, status: "configured", layer: "pons" },
  { id: "pons-grad-exec", label: "PONS Graduation Executor", address: PONS_V2.graduationExecutor, status: "configured", layer: "pons" },
  { id: "pons-grad-guard", label: "PONS Graduation Guard", address: PONS_V2.graduationGuard, status: "configured", layer: "pons" },
];
