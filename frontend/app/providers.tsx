"use client";

import { type ReactNode } from "react";
import { baseSepolia } from "wagmi/chains";
// import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { ThemeProvider } from "next-themes";
import QueryProvider from "@/context/queryProvider";
import { TransactionProvider } from 'ethereum-identity-kit'
// import config from '@/lib/wagmi';

// Create a client for wagmi
const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    // disableTransitionOnChange
    >
      {/* <WagmiProvider config={config}> */}
      <QueryClientProvider client={queryClient}>
        <QueryProvider>
          <MiniKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={baseSepolia} // change to baseSepolia later
            config={{
              appearance: {
                mode: "dark",
                theme: "mini-app-theme",
                name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
                logo: process.env.NEXT_PUBLIC_ICON_URL,
              },
            }}
          >
            {/* <WalletProvider> */}
            <TransactionProvider>
              {props.children}
            </TransactionProvider>
            {/* </WalletProvider> */}
          </MiniKitProvider>
        </QueryProvider>
      </QueryClientProvider>
      {/* </WagmiProvider> */}
    </ThemeProvider>
  );
}
