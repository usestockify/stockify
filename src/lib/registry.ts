import managedVaults from "@/data/managed-vaults.json";

export type ManagedVaultRegistryEntry = {
  id: string;
  name: string;
  chainId: number;
  version: number;
  vault: string;
  pool: string;
  token0: string;
  token1: string;
  asset: string;
  fee: number;
  oracle: string;
  position: string;
  router: string;
  keeper: string;
  admin: string;
  guardian: string;
  treasury: string;
  buyback: string;
  factory: string;
  manager: string;
  guard: string;
  recoveryFactory: string;
  runtimeHashes: Record<string, string>;
  minLiquidity: string;
  liquidityFloor: string;
  maxSwapLossBps: number;
  maxDeviationBps: number;
  [key: string]: unknown;
};

/** Every reviewed managed-vault deployment (all versions), as published by the protocol. */
export const MANAGED_VAULTS = managedVaults as ManagedVaultRegistryEntry[];

/**
 * User-facing vault pins. Vaultly does not publish unpublished deployments;
 * the public catalog lives in `src/lib/markets.ts` and shows dashes until
 * a reviewed Vaultly deployment is added here.
 */
export const VAULT_PINS: { id: string; vault: string; symbol: string }[] = [];

export type VaultPin = {
  id: string;
  name: string;
  symbol: string;
  vault: string;
  href: string;
  preview: ManagedVaultRegistryEntry;
};

export function vaultSymbol(entry: { name: string }) {
  return entry.name.replace(/\s+managed\s+vault$/i, "").replace(/\s+vault$/i, "");
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Registry entries for the public V7 vaults, in directory order. */
export function directoryVaults(): VaultPin[] {
  return VAULT_PINS.flatMap((pin) => {
    const entry = MANAGED_VAULTS.find((m) => m.id === pin.id && same(m.vault, pin.vault));
    if (!entry) return [];
    return [{ id: entry.id, name: entry.name, symbol: pin.symbol, vault: entry.vault, href: `/vaults/${encodeURIComponent(entry.id)}`, preview: entry }];
  });
}

export function findVaultById(id: string): VaultPin | undefined {
  const pin = VAULT_PINS.find((p) => p.id === id);
  if (!pin) return undefined;
  const entry = MANAGED_VAULTS.find((m) => m.id === pin.id && same(m.vault, pin.vault));
  if (!entry) return undefined;
  return { id: entry.id, name: entry.name, symbol: pin.symbol, vault: entry.vault, href: `/vaults/${encodeURIComponent(entry.id)}`, preview: entry };
}

export function findVaultByAddress(address: string): VaultPin | undefined {
  const entry = MANAGED_VAULTS.find((m) => same(m.vault, address));
  return entry ? findVaultById(entry.id) : undefined;
}

export type LendingMarketPin = {
  id: string;
  slug: string;
  name: string;
  symbol: string;
  chainId: number;
  market: string;
  vault: string;
  vaultId: string;
  adapter: string;
  limits: string;
  valuation: string;
  guard: string;
  stock: string;
  usdg: string;
  deploymentBlock: string;
  deploymentTransaction: string;
  sourceCommit: string;
  compiler: string;
  guardian: string;
  treasury: string;
};

/** Lending markets reviewed for this deployment. None published yet. */
export const LENDING_MARKETS: LendingMarketPin[] = [];

export function findLendingMarket(slugOrId: string): LendingMarketPin | undefined {
  const key = slugOrId.toLowerCase();
  return LENDING_MARKETS.find((m) => m.slug === key || m.id === key || m.symbol.toLowerCase() === key);
}
