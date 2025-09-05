import { createConfig, http, injected } from 'wagmi'
import { baseSepolia, mainnet, sepolia } from 'wagmi/chains'

const config = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
})

export default config;