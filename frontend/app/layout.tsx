import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "next-themes";
import { QueryClient } from "@tanstack/react-query";
import { request } from "graphql-request";
import { headers, url } from "@/context/queryProvider";
import { eventsCreatedQuery } from "@/context/queryProvider";
import 'ethereum-identity-kit/css'
import { Plus_Jakarta_Sans } from 'next/font/google'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap'
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  return {
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
    description:
      "Earn tokens by showing up, contributing, streaming events that promote adoption",
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
        button: {
          title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
          action: {
            type: "launch_frame",
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
            url: URL,
            splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE,
            splashBackgroundColor:
              process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
          },
        },
      }),
    },
  };
}



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // useEffect(() => {
  //   const url = new URL(window.location.href)
  //   const isMini =
  //     url.pathname.startsWith('/mini') ||
  //     url.searchParams.get('miniApp') === 'true'

  //   if (isMini) {
  //     import('@farcaster/miniapp-sdk').then(({ sdk }) => {
  //       sdk.actions.ready()
  //       console.log('sdk', sdk)
  //     })
  //   }
  // }, [])

  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['data'],
    async queryFn() {
      return await request(url, eventsCreatedQuery, {}, headers)
    }
  })
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="bg-background">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
