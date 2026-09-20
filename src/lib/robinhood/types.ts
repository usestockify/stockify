export type StockTokenTradingWindow = {
  whole: string;
  fractional: string;
};

export type StockTokenTradingCapabilities = {
  market: StockTokenTradingWindow;
  extended: StockTokenTradingWindow;
  overnight: StockTokenTradingWindow;
};

export type StockTokenDeployment = {
  contractAddress: `0x${string}`;
  chainId: number;
  networkName: string;
};

export type RobinhoodStockAsset = {
  id?: string;
  tokenSymbol: string;
  tokenName: string;
  status: string;
  currentMultiplier: string;
  pendingMultiplier?: string;
  logoUrl?: string;
  tradingCapabilities?: StockTokenTradingCapabilities;
  tokenDecimals?: number;
  isin?: string;
  deployments: StockTokenDeployment[];
  /** Robinhood Chain (4663) deployment, if one exists. Never invented. */
  chain4663: StockTokenDeployment | null;
};

export type StockPriceQuote = {
  bid: string | null;
  ask: string | null;
  currency?: string;
  dailyTradingVolume?: string | null;
  dailyHigh?: string | null;
  dailyLow?: string | null;
  isTradingHalt: boolean | null;
  generatedAt: string | null;
};

export type StockPrice = {
  symbol: string;
  /** Underlying-equity quote from the REST endpoint. Not an onchain oracle. */
  equity: StockPriceQuote;
  currentMultiplier: string | null;
  fetchedAt: string;
};

export const ROBINHOOD_ASSETS_URL = "https://api.robinhood.com/rhj/assets";
export const robinhoodPriceUrl = (symbol: string) =>
  `https://api.robinhood.com/rhj/prices/${encodeURIComponent(symbol)}`;
