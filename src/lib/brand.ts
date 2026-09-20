/**
 * Single source of truth for product naming. Everything that used to say
 * "TickerSpring" / "SPRING" is derived from this object so the brand can be
 * changed in one place.
 */
export const BRAND = {
  name: "stockify",
  /** Title-case name for SEO, metadata and page titles. */
  titleName: "Stockify",
  nameUpper: "STOCKIFY",
  tagline: "USDG for stock markets.",
  ogDescription: "USDG liquidity infrastructure for tokenized stock markets on Robinhood Chain.",
  description: "USDG liquidity infrastructure for tokenized stock markets on Robinhood Chain.",
  /** Short label in asset lists. No protocol ticker is published. */
  token: "stockify",
  /** Drop the mark file here; BrandMark reads this path and nothing else. */
  logoSrc: "/brand/logo.png",
  /** X / Twitter handle without the @. */
  xHandle: process.env.NEXT_PUBLIC_X_HANDLE ?? "stockify",
  xUrl: process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/stockify",
  /** Telegram discussion group. Override with NEXT_PUBLIC_TELEGRAM_URL if the invite is rotated. */
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "https://t.me/+qUeVjZqryk4yOThk",
  repoUrl: process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/pablooalonnso-web/claudemaxing5",
  /** Branch the deployed site is built from; file links in the docs point at it. */
  repoBranch: process.env.NEXT_PUBLIC_REPO_BRANCH ?? "main",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Custom DOM event name fired after a wallet transaction changes a vault. */
  vaultUpdatedEvent: "stockify:vault-updated",
} as const;

export const CHAIN_NAME = "Robinhood Chain";
