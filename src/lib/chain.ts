import { createPublicClient, defineChain, fallback, http, type PublicClient } from "viem";

export const ROBINHOOD_CHAIN_ID = 4663;
export const ROBINHOOD_CHAIN_NAME = "Robinhood Chain";
export const DEFAULT_RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
export const EXPLORER_URL = "https://robinhoodchain.blockscout.com";
export const NATIVE_CURRENCY = { name: "Ether", symbol: "ETH", decimals: 18 } as const;
export const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD" as const;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/**
 * Unpublished Stockify protocol token. No ticker is shown until one exists.
 * This is not USDG and not a Robinhood Stock Token.
 */
export const TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_ADDRESS ?? ZERO_ADDRESS) as `0x${string}`;
export const PROTOCOL_TOKEN_LIVE = TOKEN_ADDRESS !== ZERO_ADDRESS;

/**
 * JSON-RPC endpoints, in order of preference.
 *
 * Browser: NEXT_PUBLIC_RPC_URL (Alchemy/private later without app rewrites).
 * Server:  RPC_URL first (private), then RPC_URLS, then the public list.
 */
const PUBLIC_RPC_FALLBACKS = [
  "https://robinhood-rpc.publicnode.com",
  "https://robinhood.rpc.blxrbdn.com",
  "https://rpc.ordofi.network",
  "https://rpc.nodeflare.app/robinhood/public",
] as const;

function splitUrls(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

export function publicRpcUrl() {
  return process.env.NEXT_PUBLIC_RPC_URL?.trim() || DEFAULT_RPC_URL;
}

export function serverRpcUrls(): string[] {
  const preferred = [
    ...splitUrls(process.env.RH_ARCHIVE_RPC_URL),
    ...splitUrls(process.env.RH_RPC_URL),
    ...splitUrls(process.env.RPC_URL),
  ];
  const listed = splitUrls(process.env.RPC_URLS);
  const publicDefault = [publicRpcUrl(), ...PUBLIC_RPC_FALLBACKS];
  const merged = [...preferred, ...(listed.length ? listed : publicDefault)];
  return [...new Set(merged)];
}

/** @deprecated Use serverRpcUrls() / publicRpcUrl(). Kept for the RPC relay. */
export const RPC_URLS = serverRpcUrls();

export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: ROBINHOOD_CHAIN_NAME,
  network: "robinhood-chain",
  nativeCurrency: NATIVE_CURRENCY,
  rpcUrls: {
    default: { http: [publicRpcUrl()] },
  },
  blockExplorers: {
    default: { name: "Robinhood Chain Explorer", url: EXPLORER_URL },
  },
  contracts: {
    multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" },
  },
});

let client: PublicClient | undefined;
let indexer: PublicClient | undefined;

/**
 * Shared read-only client. The server talks to the RPC directly; the browser
 * does too, but falls back to the same-origin relay at /api/rpc when the
 * public endpoint answers without CORS headers.
 */
export function publicClient(): PublicClient {
  if (!client) {
    const direct = http(undefined, { batch: true, timeout: 4_000, retryCount: 0 });
    const transport =
      typeof window === "undefined"
        ? fallback(
            serverRpcUrls().map((url) => http(url, { batch: true, timeout: 4_000, retryCount: 0 })),
            { rank: false },
          )
        : fallback([direct, http("/api/rpc", { batch: true, timeout: 15_000 })], { rank: false });
    client = createPublicClient({
      chain: robinhoodChain,
      transport,
      batch: { multicall: { wait: 16 } },
    }) as PublicClient;
  }
  return client;
}

/** Server-only indexer client. Uses serverRpcUrls(); longer timeout for log scans. */
export function indexerClient(): PublicClient {
  if (typeof window !== "undefined") return publicClient();
  if (!indexer) {
    indexer = createPublicClient({
      chain: robinhoodChain,
      transport: fallback(
        serverRpcUrls().map((url) => http(url, { batch: true, timeout: 25_000, retryCount: 0 })),
        { rank: false },
      ),
      batch: { multicall: { wait: 16 } },
    }) as PublicClient;
  }
  return indexer;
}

export function indexerProviderLabel() {
  const url = serverRpcUrls()[0] ?? publicRpcUrl();
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export const explorerAddress = (address: string) => `${EXPLORER_URL}/address/${address}`;
export const explorerTx = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const explorerToken = (address: string) => `${EXPLORER_URL}/token/${address}`;
export const explorerBlock = (block: string | number | bigint) => `${EXPLORER_URL}/block/${block}`;

/** Canonical Global Dollar (USDG) on Robinhood Chain. */
export const USDG_ADDRESS = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as const;
