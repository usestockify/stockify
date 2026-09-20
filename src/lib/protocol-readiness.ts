import { parseAbi, isAddress, type Address, type PublicClient } from "viem";
import { publicClient, ZERO_ADDRESS } from "@/lib/chain";
import { isConfigured, loadManifest } from "@/lib/stockify/deployments";

export type FeatureStatus = "NOT_DEPLOYED" | "CONFIGURED_UNVERIFIED" | "LIVE" | "LOCAL_DEVELOPMENT";

export type ReadinessSlot = {
  id: "VaultFactory" | "Router" | "StockRegistry" | "OracleAdapter" | "StrategyFactory";
  env: string;
  address: Address | null;
  bytecode: boolean;
  interfaceOk: boolean;
  status: FeatureStatus;
  detail: string;
};

const PROBE_ABI = parseAbi([
  "function vaultCount() view returns (uint256)",
  "function usdg() view returns (address)",
  "function registry() view returns (address)",
]);

export async function readContractReadiness(client: PublicClient = publicClient()): Promise<ReadinessSlot[]> {
  const local = process.env.STOCKIFY_LOCAL_VAULTS === "1";
  const m = loadManifest();
  const slots: { id: ReadinessSlot["id"]; env: string; address: string; probe: "vaultCount" | "usdg" | "registry" }[] = [
    { id: "VaultFactory", env: "STOCKIFY_VAULT_FACTORY", address: m.vaultFactory, probe: "vaultCount" },
    { id: "StrategyFactory", env: "STOCKIFY_STRATEGY_FACTORY", address: m.strategyFactory, probe: "usdg" },
    { id: "Router", env: "STOCKIFY_ROUTER", address: m.router, probe: "registry" },
    { id: "StockRegistry", env: "STOCKIFY_STOCK_REGISTRY", address: m.registry, probe: "usdg" },
    { id: "OracleAdapter", env: "STOCKIFY_ORACLE_ADAPTER", address: m.oracle, probe: "usdg" },
  ];
  const rows: ReadinessSlot[] = [];
  for (const slot of slots) {
    const address = isConfigured(slot.address) && isAddress(slot.address) ? (slot.address as Address) : null;
    if (!address) {
      rows.push({
        id: slot.id,
        env: slot.env,
        address: null,
        bytecode: false,
        interfaceOk: false,
        status: "NOT_DEPLOYED",
        detail: "Address not configured. Stockify vault contracts are not deployed.",
      });
      continue;
    }
    let bytecode = false;
    let interfaceOk = false;
    let detail = "Address configured but bytecode is empty";
    try {
      const code = await client.getCode({ address });
      bytecode = Boolean(code && code !== "0x" && code !== ZERO_ADDRESS);
      if (bytecode) {
        await client.readContract({ address, abi: PROBE_ABI, functionName: slot.probe });
        interfaceOk = true;
        detail = local ? "LOCAL DEVELOPMENT — test contracts only" : "Bytecode and interface verified";
      }
    } catch (error) {
      detail = error instanceof Error ? error.message : "Interface probe failed";
    }
    const status: FeatureStatus = !bytecode ? "CONFIGURED_UNVERIFIED" : local ? "LOCAL_DEVELOPMENT" : interfaceOk ? "LIVE" : "CONFIGURED_UNVERIFIED";
    rows.push({ id: slot.id, env: slot.env, address, bytecode, interfaceOk, status, detail });
  }
  return rows;
}

export function vaultsEnabled(slots: ReadinessSlot[]) {
  const factory = slots.find((s) => s.id === "VaultFactory");
  return Boolean(factory && factory.bytecode && factory.interfaceOk);
}
