"use client";

import { type ReactNode } from "react";
import { baseSepolia } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { ThemeProvider } from "next-themes";

export function Providers(props: { children: ReactNode }) {
   return (
      <ThemeProvider
         attribute="class"
         defaultTheme="system"
         enableSystem
      // disableTransitionOnChange
      >
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
            {props.children}
         </MiniKitProvider>
      </ThemeProvider>
   );
}
