import { createConfig, http, injected } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { createStorage, noopStorage } from 'wagmi'

// Create storage with localStorage for persistence
const storage = createStorage({
  storage: typeof window !== 'undefined' ? window.localStorage : noopStorage,
  key: 'revent-wagmi', // Custom key for localStorage to avoid conflicts
})

const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
  ],
  ssr: true,
  storage,
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
})

export default config;