"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import PixelBlastBackground from "@/components/PixelBlastBackground";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}


