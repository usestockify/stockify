"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { WalletProvider } from "./wallet/WalletProvider";
import { ProtocolVaultProvider } from "./data/ProtocolVaultProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <ProtocolVaultProvider>{children}</ProtocolVaultProvider>
        </WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
