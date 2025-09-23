import { createConfig, http, injected } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { createStorage, noopStorage } from 'wagmi'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

// Create storage with localStorage for persistence
const storage = createStorage({
  storage: typeof window !== 'undefined' ? window.localStorage : noopStorage,
  key: 'revent-wagmi', // Custom key for localStorage to avoid conflicts
})

const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    miniAppConnector(),
    // injected(),
  ],
  ssr: true,
  storage,
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
})

export default config;