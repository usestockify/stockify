import { parseAbi, isAddress, type Address, type PublicClient } from "viem";
import { publicClient, ZERO_ADDRESS } from "@/lib/chain";

export type FeatureStatus = "NOT_DEPLOYED" | "CONFIGURED_UNVERIFIED" | "LIVE" | "LOCAL_DEVELOPMENT";

export type ReadinessSlot = {
  id: "VaultFactory" | "Router" | "StockRegistry" | "OracleAdapter";
  env: string;
  address: Address | null;
  bytecode: boolean;
  interfaceOk: boolean;
  status: FeatureStatus;
  detail: string;
};

const SLOTS: { id: ReadinessSlot["id"]; env: string; probe: string }[] = [
  { id: "VaultFactory", env: "STOCKIFY_VAULT_FACTORY", probe: "vaultCount()" },
  { id: "Router", env: "STOCKIFY_ROUTER", probe: "factory()" },
  { id: "StockRegistry", env: "STOCKIFY_STOCK_REGISTRY", probe: "owner()" },
  { id: "OracleAdapter", env: "STOCKIFY_ORACLE_ADAPTER", probe: "latestAnswer()" },
];

function configuredAddress(env: string): Address | null {
  const value = process.env[env]?.trim() || process.env[`NEXT_PUBLIC_${env}`]?.trim() || "";
  if (!value || !isAddress(value) || value.toLowerCase() === ZERO_ADDRESS) return null;
  return value as Address;
}

const PROBE_ABI = parseAbi([
  "function vaultCount() view returns (uint256)",
  "function factory() view returns (address)",
  "function owner() view returns (address)",
  "function latestAnswer() view returns (int256)",
]);

export async function readContractReadiness(client: PublicClient = publicClient()): Promise<ReadinessSlot[]> {
  const local = process.env.STOCKIFY_LOCAL_VAULTS === "1";
  const rows: ReadinessSlot[] = [];
  for (const slot of SLOTS) {
    const address = configuredAddress(slot.env);
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
      bytecode = Boolean(code && code !== "0x");
      if (bytecode) {
        const fn = slot.probe.replace("()", "") as "vaultCount" | "factory" | "owner" | "latestAnswer";
        await client.readContract({ address, abi: PROBE_ABI, functionName: fn });
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
