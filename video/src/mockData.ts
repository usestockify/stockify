/**
 * VIDEO-ONLY simulated figures. Never imported by the Vaultly application.
 */
export const MOCK = {
  disclaimer: "simulated demonstration",
  quoteIn: "1,000",
  quoteOut: "4.518",
  rate: "1 USDG → 0.004518 NVDA",
  markets: [
    { symbol: "NVDA", name: "NVIDIA", pair: "NVDA / USDG", price: "222.91" },
    { symbol: "AAPL", name: "Apple", pair: "AAPL / USDG", price: "335.04" },
    { symbol: "TSLA", name: "Tesla", pair: "TSLA / USDG", price: "366.33" },
    { symbol: "META", name: "Meta", pair: "META / USDG", price: "673.18" },
    { symbol: "MSFT", name: "Microsoft", pair: "MSFT / USDG", price: "493.70" },
  ],
  nvda: { lower: "214.20", current: "222.91", upper: "231.80" },
  portfolio: [
    { symbol: "USDG", name: "Global Dollar", amount: "48,250" },
    { symbol: "NVDA", name: "NVIDIA", amount: "86.40" },
    { symbol: "AAPL", name: "Apple", amount: "22.10" },
  ],
} as const;
