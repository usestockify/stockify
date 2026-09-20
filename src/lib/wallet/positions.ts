import type { Address } from "viem";
import { publicClient } from "@/lib/chain";
import { STOCKIFY_WATCHLIST } from "@/lib/markets";
import { getRobinhoodAssets } from "@/lib/robinhood/assets";
import { readStockTokenBalance } from "@/lib/tokens/stock";
import { readUsdgs, readUsdgsBalance, USDG_ADDRESS } from "@/lib/tokens/usdg";
import type { WalletPosition } from "./types";

export async function readWalletPositions(owner: Address): Promise<WalletPosition[]> {
  const client = publicClient();
  const positions: WalletPosition[] = [];

  try {
    const native = await client.getBalance({ address: owner });
    positions.push({
      key: "ETH",
      symbol: "ETH",
      name: "Ether",
      address: null,
      native: true,
      decimals: 18,
      raw: native.toString(),
      ui: null,
      uiMultiplier: null,
      status: "ready",
    });
  } catch (error) {
    positions.push({
      key: "ETH",
      symbol: "ETH",
      name: "Ether",
      address: null,
      native: true,
      decimals: 18,
      raw: null,
      ui: null,
      uiMultiplier: null,
      status: "error",
      error: error instanceof Error ? error.message : "ETH balance unavailable",
    });
  }

  const usdgMeta = await readUsdgs(client);
  const usdg = await readUsdgsBalance(owner, client);
  positions.push({
    key: "USDG",
    symbol: usdgMeta.data?.symbol ?? "USDG",
    name: usdgMeta.data?.name ?? "Global Dollar",
    address: USDG_ADDRESS,
    native: false,
    decimals: usdg.data?.decimals ?? usdgMeta.data?.decimals ?? null,
    raw: usdg.data?.raw ?? null,
    ui: null,
    uiMultiplier: null,
    status: usdg.data ? "ready" : "error",
    error: usdg.error,
  });

  const assets = await getRobinhoodAssets();
  for (const symbol of STOCKIFY_WATCHLIST) {
    const asset = assets.data?.find((a) => a.tokenSymbol === symbol);
    const deployed = asset?.chain4663;
    if (!deployed) {
      positions.push({
        key: symbol,
        symbol,
        name: asset?.tokenName ?? symbol,
        address: null,
        native: false,
        decimals: null,
        raw: null,
        ui: null,
        uiMultiplier: null,
        status: "unavailable",
        error: asset ? `${symbol} has no chain-4663 deployment` : `${symbol} is not in the Robinhood registry`,
      });
      continue;
    }
    const bal = await readStockTokenBalance(deployed.contractAddress, owner, client);
    positions.push({
      key: symbol,
      symbol,
      name: asset?.tokenName ?? symbol,
      address: deployed.contractAddress,
      native: false,
      decimals: bal.data?.decimals ?? null,
      raw: bal.data?.raw ?? null,
      ui: bal.data?.ui ?? null,
      uiMultiplier: bal.data?.uiMultiplier ?? asset?.currentMultiplier ?? null,
      status: bal.data ? "ready" : "error",
      error: bal.error,
    });
  }

  return positions;
}
