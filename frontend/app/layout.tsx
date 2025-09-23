import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "../components/ThemeProvider";
import { QueryClient } from "@tanstack/react-query";
import { request } from "graphql-request";
import { headers, url } from "@/context/queryProvider";
import { eventsCreatedQuery } from "@/context/queryProvider";
import 'ethereum-identity-kit/css'
import { Plus_Jakarta_Sans } from 'next/font/google'
import DataPrefetcher from "../components/DataPrefetcher"
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { baseSepolia } from "wagmi/chains";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic']
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://revents.io';
  const siteName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Revent';
  const description = "Discover, create, and attend onchain events. Earn tokens by participating in blockchain events, streaming, and contributing to the decentralized ecosystem.";
  const heroImage = process.env.NEXT_PUBLIC_APP_HERO_IMAGE || 'https://revents.io/hero.png';
  const splashImage = process.env.NEXT_PUBLIC_SPLASH_IMAGE || 'https://revents.io/splash.png';

  return {
    metadataBase: new URL('https://revents.io'),
    title: {
      default: `${siteName} - Onchain Events Platform`,
      template: `%s | ${siteName}`
    },
    description,
    keywords: [
      'onchain events',
      'blockchain events',
      'web3 events',
      'decentralized events',
      'crypto events',
      'NFT events',
      'token rewards',
      'event streaming',
      'blockchain community'
    ],
    authors: [{ name: 'Revent Team' }],
    creator: 'Revent',
    publisher: 'Revent',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://revents.io',
      siteName,
      title: `${siteName} - Onchain Events Platform`,
      description,
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: `${siteName} - Discover and attend onchain events`,
        },
        {
          url: splashImage,
          width: 800,
          height: 600,
          alt: `${siteName} splash screen`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} - Onchain Events Platform`,
      description,
      images: [heroImage],
      creator: '@reventprotocol',
      site: '@reventprotocol',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },
    alternates: {
      canonical: 'https://revents.io',
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: heroImage,
        button: {
          title: `Launch ${siteName}`,
          action: {
            type: "launch_frame",
            name: siteName,
            url: baseUrl,
            splashImageUrl: splashImage,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#000000',
          },
        },
      }),
      'application-name': siteName,
      'apple-mobile-web-app-title': siteName,
      'msapplication-TileColor': '#000000',
      'theme-color': '#000000',
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
    <html lang="en" className={`${plusJakarta.variable} light`}>
      <head>
        <meta name="fc:miniapp" content="<stringified MiniAppEmbed JSON>" />
        <meta name="fc:frame" content="<stringified MiniAppEmbed JSON>" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const resolvedTheme = theme === 'system' 
                  ? (systemPrefersDark ? 'dark' : 'light')
                  : theme || 'light';
                document.documentElement.classList.add(resolvedTheme);
              } catch (e) {
                document.documentElement.classList.add('light');
              }
            `,
          }}
        />
      </head>
      <body className="bg-background">
        {/* <OnchainKitProvider
          apiKey="YOUR_API_KEY"
          chain={baseSepolia}
          // miniKit={{
          //   enabled: true, // Add this
          // }}
          config={{
            appearance: {
              mode: 'auto', // 'light' | 'dark' | 'auto'
            },
            wallet: {
              display: 'modal', // 'modal' | 'drawer'
              preference: 'all', // 'all' | 'smartWalletOnly' | 'eoaOnly'
            },

          }
          }
        > */}
        <ThemeProvider>
          <Providers>
            <DataPrefetcher>
              {children}
            </DataPrefetcher>
          </Providers>
        </ThemeProvider>

        {/* </OnchainKitProvider> */}
      </body>
    </html >
  );
}
