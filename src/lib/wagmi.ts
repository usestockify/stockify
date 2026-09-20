import { createConfig, http } from "wagmi";
import { publicRpcUrl, robinhoodChain } from "@/lib/chain";

/**
 * Single wagmi config over the shared Robinhood Chain definition.
 * Swap NEXT_PUBLIC_RPC_URL (or later Alchemy) without rewriting wallet code.
 * Injected wallets stay on the existing EIP-1193 WalletProvider so we do not
 * pull optional connector SDKs into the bundle.
 */
export const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [],
  transports: {
    [robinhoodChain.id]: http(publicRpcUrl(), { batch: true, retryCount: 1, timeout: 12_000 }),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
