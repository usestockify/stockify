/**
 * Official PONS v2 curve quote math.
 * Source: https://docs.ponsfamily.com/v2 — “Getting a quote”.
 * Integer order matches the curve. Fees sit outside amountOut.
 * Spot (quoteReserve / tokenReserve) is display-only and is never returned as an executable quote.
 */

export const BPS = 10_000n;

export const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;

export function amountOut(inAmount: bigint, reserveIn: bigint, reserveOut: bigint) {
  if (inAmount <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  return (inAmount * reserveOut) / (reserveIn + inAmount);
}

export function amountIn(outAmount: bigint, reserveIn: bigint, reserveOut: bigint) {
  if (outAmount <= 0n || reserveIn <= 0n || outAmount >= reserveOut) return 0n;
  return (outAmount * reserveIn) / (reserveOut - outAmount) + 1n;
}

export type CurveQuoteInputs = {
  quoteReserve: bigint;
  tokenReserve: bigint;
  sellableTokens: bigint;
  feeBps: bigint;
  creatorTaxBps: bigint;
  snipeBps: bigint;
  readyToGraduate: boolean;
  graduated: boolean;
};

export type BuyQuote = {
  tokensOut: bigint;
  spent: bigint;
  refund: bigint;
  fee: bigint;
  tax: bigint;
  snipeTax: bigint;
  snipeBps: bigint;
  partialFill: boolean;
  closed: boolean;
  reason: string | null;
};

export type SellQuote = {
  quoteOut: bigint;
  fee: bigint;
  tax: bigint;
  closed: boolean;
  reason: string | null;
};

export function capSnipeBps(rawSnipeBps: bigint, feeBps: bigint, creatorTaxBps: bigint) {
  let snipeBps = rawSnipeBps;
  if (snipeBps > 0n) {
    const maxSnipeBps = BPS - feeBps - creatorTaxBps - 100n;
    if (snipeBps > maxSnipeBps) snipeBps = maxSnipeBps < 0n ? 0n : maxSnipeBps;
  }
  return snipeBps;
}

/** Quote asset in, launch token out. */
export function quoteBuy(inputs: CurveQuoteInputs, quoteIn: bigint): BuyQuote {
  if (inputs.graduated) {
    return { tokensOut: 0n, spent: 0n, refund: quoteIn, fee: 0n, tax: 0n, snipeTax: 0n, snipeBps: 0n, partialFill: false, closed: true, reason: "Launch has graduated; curve buys are closed" };
  }
  if (quoteIn <= 0n) {
    return { tokensOut: 0n, spent: 0n, refund: 0n, fee: 0n, tax: 0n, snipeTax: 0n, snipeBps: 0n, partialFill: false, closed: false, reason: "Amount required" };
  }
  if (inputs.sellableTokens <= 0n) {
    return { tokensOut: 0n, spent: 0n, refund: quoteIn, fee: 0n, tax: 0n, snipeTax: 0n, snipeBps: 0n, partialFill: false, closed: true, reason: "Curve has no sellable tokens" };
  }
  const snipeBps = capSnipeBps(inputs.snipeBps, inputs.feeBps, inputs.creatorTaxBps);
  let spent = quoteIn;
  const fee = (spent * inputs.feeBps) / BPS;
  const tax = (spent * inputs.creatorTaxBps) / BPS;
  const snipeTax = (spent * snipeBps) / BPS;
  const net = spent - fee - tax - snipeTax;
  if (net <= 0n) {
    return { tokensOut: 0n, spent: 0n, refund: quoteIn, fee, tax, snipeTax, snipeBps, partialFill: false, closed: false, reason: "Fees consume the entire input" };
  }
  let tokensOut = amountOut(net, inputs.quoteReserve, inputs.tokenReserve);
  let partialFill = false;
  if (tokensOut > inputs.sellableTokens) {
    tokensOut = inputs.sellableTokens;
    const netNeeded = amountIn(inputs.sellableTokens, inputs.quoteReserve, inputs.tokenReserve);
    const denom = BPS - inputs.feeBps - inputs.creatorTaxBps - snipeBps;
    const grossed = denom <= 0n ? quoteIn : ceilDiv(netNeeded * BPS, denom);
    spent = grossed < quoteIn ? grossed : quoteIn;
    partialFill = true;
  }
  return {
    tokensOut,
    spent,
    refund: quoteIn - spent,
    fee: (spent * inputs.feeBps) / BPS,
    tax: (spent * inputs.creatorTaxBps) / BPS,
    snipeTax: (spent * snipeBps) / BPS,
    snipeBps,
    partialFill,
    closed: false,
    reason: null,
  };
}

/** Launch token in, quote asset out. Sells close when readyToGraduate is true. */
export function quoteSell(inputs: CurveQuoteInputs, tokensIn: bigint): SellQuote {
  if (inputs.graduated || inputs.readyToGraduate) {
    return { quoteOut: 0n, fee: 0n, tax: 0n, closed: true, reason: "Sells close once the curve is ready to graduate" };
  }
  if (tokensIn <= 0n) return { quoteOut: 0n, fee: 0n, tax: 0n, closed: false, reason: "Amount required" };
  const gross = amountOut(tokensIn, inputs.tokenReserve, inputs.quoteReserve);
  const fee = (gross * inputs.feeBps) / BPS;
  const tax = (gross * inputs.creatorTaxBps) / BPS;
  return { quoteOut: gross - fee - tax, fee, tax, closed: false, reason: null };
}

/** Display-only spot. Never use as an executable quote. */
export function spotPrice(quoteReserve: bigint, tokenReserve: bigint, pairDecimals: number, tokenDecimals: number): number | null {
  if (quoteReserve <= 0n || tokenReserve <= 0n) return null;
  const q = Number(quoteReserve) / 10 ** pairDecimals;
  const t = Number(tokenReserve) / 10 ** tokenDecimals;
  if (!Number.isFinite(q) || !Number.isFinite(t) || t === 0) return null;
  return q / t;
}
