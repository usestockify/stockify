/**
 * Single source of truth for product naming. Everything that used to say
 * "TickerSpring" / "SPRING" is derived from this object so the brand can be
 * changed in one place.
 */

/** Treat blank / whitespace env values as unset so `new URL("")` cannot run at build. */
function envText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return vercel.startsWith("http://") || vercel.startsWith("https://") ? vercel : `https://${vercel}`;
  return "http://localhost:3000";
}

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
  xHandle: envText(process.env.NEXT_PUBLIC_X_HANDLE, "stockify"),
  xUrl: envText(process.env.NEXT_PUBLIC_X_URL, "https://x.com/stockify"),
  /** Telegram discussion group. Override with NEXT_PUBLIC_TELEGRAM_URL if the invite is rotated. */
  telegramUrl: envText(process.env.NEXT_PUBLIC_TELEGRAM_URL, "https://t.me/+qUeVjZqryk4yOThk"),
  repoUrl: envText(process.env.NEXT_PUBLIC_REPO_URL, "https://github.com/pablooalonnso-web/claudemaxing5"),
  /** Branch the deployed site is built from; file links in the docs point at it. */
  repoBranch: envText(process.env.NEXT_PUBLIC_REPO_BRANCH, "main"),
  siteUrl: siteUrl(),
  /** Custom DOM event name fired after a wallet transaction changes a vault. */
  vaultUpdatedEvent: "stockify:vault-updated",
} as const;

export const CHAIN_NAME = "Robinhood Chain";
