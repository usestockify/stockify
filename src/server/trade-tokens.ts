import { STOCKIFY_WATCHLIST } from "@/lib/markets";
import { stockifyRelevantLaunches } from "@/lib/pons/launches";
import { getRobinhoodAssets, isActiveChain4663Asset } from "@/lib/robinhood/assets";
import { readUsdgs } from "@/lib/tokens/usdg";
import { ETH_TRADE_TOKEN, USDG_TRADE_TOKEN, type TradeToken } from "@/lib/trade-tokens";
import { getIndexedLaunches } from "@/server/indexer/pons";

export async function getTradeTokens(): Promise<TradeToken[]> {
  const tokens: TradeToken[] = [{ ...ETH_TRADE_TOKEN }];
  const usdg = await readUsdgs();
  tokens.push({
    ...USDG_TRADE_TOKEN,
    name: usdg.data?.name ?? USDG_TRADE_TOKEN.name,
    symbol: usdg.data?.symbol ?? "USDG",
    decimals: usdg.data?.decimals ?? 0,
    unavailable: !usdg.data,
  });
  const assets = await getRobinhoodAssets();
  for (const symbol of STOCKIFY_WATCHLIST) {
    const asset = assets.data?.find((a) => a.tokenSymbol === symbol);
    const deployed = asset?.chain4663;
    if (!deployed || !asset || !isActiveChain4663Asset(asset)) {
      tokens.push({
        address: `unavailable:${symbol}`,
        symbol,
        name: asset?.tokenName ?? symbol,
        decimals: 0,
        category: "stock",
        logoUrl: asset?.logoUrl,
        nameKey: "token.stock",
        baseName: asset?.tokenName ?? symbol,
        subtitle: "Robinhood Token",
        unavailable: true,
      });
      continue;
    }
    tokens.push({
      address: deployed.contractAddress,
      symbol,
      name: asset?.tokenName ?? symbol,
      decimals: asset?.tokenDecimals ?? 18,
      category: "stock",
      logoUrl: asset?.logoUrl,
      nameKey: "token.stock",
      baseName: asset?.tokenName ?? symbol,
      subtitle: "Robinhood Token",
      contractLabel: deployed.contractAddress,
    });
  }
  const launches = await getIndexedLaunches().catch(() => null);
  for (const launch of launches?.data ? stockifyRelevantLaunches(launches.data).slice(0, 40) : []) {
    if (!launch.metadata.symbol || launch.metadata.decimals == null) continue;
    tokens.push({
      address: launch.token,
      symbol: launch.metadata.symbol,
      name: launch.metadata.name ?? launch.metadata.symbol,
      decimals: launch.metadata.decimals,
      category: "pons",
      logoUrl: launch.metadata.logo || launch.pair.logoUrl || undefined,
      subtitle: `PONS · ${launch.pair.ticker ?? launch.pair.symbol ?? "pair"}`,
      contractLabel: launch.token,
    });
  }
  return tokens;
}
