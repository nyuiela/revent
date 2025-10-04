import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { headers } from 'next/headers';
import { getTenantConfig } from '@/lib/config';
import { ContextProvider } from "@/context/ContextProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const tenant = headersList.get('x-tenant');

  try {
    const config = await getTenantConfig(null, tenant || undefined);
    return {
      title: config.name || "Revent Event",
      description: config.description || "Event management platform",
      themeColor: config.theme?.accent || '#7c3aed',
      icons: {
        icon: [
          { url: '/favicon.ico', sizes: 'any' },
          { url: '/favicon.svg', type: 'image/svg+xml' },
          { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
          { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        ],
        apple: [
          { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      manifest: '/manifest.json',
    };
  } catch {
    return {
      title: "Revent Events",
      description: "Event management platform",
      icons: {
        icon: [
          { url: '/favicon.ico', sizes: 'any' },
          { url: '/favicon.svg', type: 'image/svg+xml' },
        ],
        apple: [
          { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      manifest: '/manifest.json',
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const initialTheme = theme || (systemPrefersDark ? 'dark' : 'light');
                document.documentElement.classList.add(initialTheme);
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ContextProvider cookies={null}>
          <Providers>
            {children}
          </Providers>
        </ContextProvider>
      </body>
    </html>
  );
}
