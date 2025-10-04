"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { DynamicThemeProvider } from "@/context/DynamicThemeProvider";
import { UserProvider } from "@/context/UserContext";
import { WalletProvider } from "@/components/WalletProvider";
import { NotificationProvider } from "@/components/NotificationSystem";
import PixelBlastBackground from "@/components/PixelBlastBackground";
import CustomWagmiProvider from "@/context/CustomProvider";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    // <CustomWagmiProvider>
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <WalletProvider>
          <UserProvider>
            <DynamicThemeProvider>
              <div className="relative min-h-screen">
                {/* PixelBlast Background */}
                <PixelBlastBackground
                  className="fixed inset-0 w-full h-full -mb-[520px]"
                  style={{ height: '100vh' }}
                />

                {/* Content on top */}
                <div className="relative z-10">
                  {children}
                </div>
              </div>
            </DynamicThemeProvider>
          </UserProvider>
        </WalletProvider>
      </NotificationProvider>
    </QueryClientProvider>
    // </CustomWagmiProvider >
  );
}


