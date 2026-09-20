export type TxLifecycle =
  | "idle"
  | "wallet-required"
  | "wrong-network"
  | "awaiting-approval"
  | "awaiting-signature"
  | "submitted"
  | "confirming"
  | "confirmed"
  | "failed";

export type WalletPosition = {
  key: string;
  symbol: string;
  name: string;
  address: `0x${string}` | null;
  native: boolean;
  decimals: number | null;
  raw: string | null;
  /** Multiplier-adjusted UI units when the token exposes them. */
  ui: string | null;
  uiMultiplier: string | null;
  status: "ready" | "error" | "unavailable";
  error?: string;
};
