import { OnchainKitProvider } from '@coinbase/onchainkit'
import React from 'react'
import { baseSepolia } from 'wagmi/chains'

const walletProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <OnchainKitProvider
      apiKey={process.env.ONCHAINKIT_API_KEY}
      chain={baseSepolia}
      config={{
        appearance: {
          name: 're:event',        // Displayed in modal header
          logo: 'https://your-logo.com',// Displayed in modal header
          mode: 'dark',                 // 'light' | 'dark' | '400'
          theme: 'default',             // 'default' or custom theme
        },
        wallet: {
          display: 'modal',
          termsUrl: 'https://...',
          privacyUrl: 'https://...',
        },
      }}
    >
      {children}
    </OnchainKitProvider>
  )
}

export default walletProvider