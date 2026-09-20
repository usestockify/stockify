import { USDG_ADDRESS } from "./chain";
import { STOCKIFY_WATCHLIST } from "./markets";
import { getRobinhoodAssets } from "./robinhood/assets";
import { readUsdgs } from "./tokens/usdg";

export const NATIVE_ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" as const;

export type TradeToken = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  category: "core" | "stock" | "imported";
  logoUrl?: string;
  native?: boolean;
  unavailable?: boolean;
  /** Message key in the `trade` namespace for the translated display name. */
  nameKey?: "token.ether" | "token.globalDollar" | "token.brand" | "token.stock";
  /** `{name}` placeholder for `nameKey` (the company name for a Stock Token). */
  baseName?: string;
};

export const ETH_TRADE_TOKEN: TradeToken = {
  address: NATIVE_ETH,
  symbol: "ETH",
  name: "Ether",
  nameKey: "token.ether",
  decimals: 18,
  category: "core",
  logoUrl: "/brands/eth.svg",
  native: true,
};

/** USDG stub. `decimals` is filled from a live chain read in `getTradeTokens`. */
export const USDG_TRADE_TOKEN: TradeToken = {
  address: USDG_ADDRESS,
  symbol: "USDG",
  name: "Global Dollar",
  nameKey: "token.globalDollar",
  decimals: 0,
  category: "core",
  logoUrl: "/brands/usdg.png",
};

/** Core tokens only. Stock tokens are appended from the Robinhood registry. */
export const TRADE_TOKENS: TradeToken[] = [ETH_TRADE_TOKEN, USDG_TRADE_TOKEN];

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
    if (!deployed) {
      tokens.push({
        address: `unavailable:${symbol}`,
        symbol,
        name: asset?.tokenName ?? symbol,
        decimals: 0,
        category: "stock",
        logoUrl: asset?.logoUrl,
        nameKey: "token.stock",
        baseName: asset?.tokenName ?? symbol,
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
    });
  }
  return tokens;
}

export type TradeQuote = {
  providerId: string;
  providerName: string;
  amountOutRaw: string;
  netAmountOutRaw: string;
  gasEstimate: string;
  executable: boolean;
  routeSummary?: unknown;
  routerAddress?: string;
  note?: string;
};

export type QuotesResponse = { tokenIn: string; tokenOut: string; amountIn: string; quotes: TradeQuote[]; quotedAt: number };
