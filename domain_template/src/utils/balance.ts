import { getBalance } from '@wagmi/core';
import { createConfig, http } from '@wagmi/core';
import { mainnet, sepolia, base, baseSepolia, arbitrum, arbitrumSepolia } from '@wagmi/core/chains';

// Network configuration
export const networks = {
  mainnet: {
    id: mainnet.id,
    name: 'Ethereum Mainnet',
    nativeCurrency: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
  },
  sepolia: {
    id: sepolia.id,
    name: 'Sepolia Testnet',
    nativeCurrency: 'ETH',
    rpcUrl: 'https://sepolia.gateway.tenderly.co',
  },
  base: {
    id: base.id,
    name: 'Base Mainnet',
    nativeCurrency: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
  },
  baseSepolia: {
    id: baseSepolia.id,
    name: 'Base Sepolia',
    nativeCurrency: 'ETH',
    rpcUrl: 'https://sepolia.base.org',
  },
  arbitrum: {
    id: arbitrum.id,
    name: 'Arbitrum One',
    nativeCurrency: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  },
  arbitrumSepolia: {
    id: arbitrumSepolia.id,
    name: 'Arbitrum Sepolia',
    nativeCurrency: 'ETH',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  },
} as const;

// Token addresses by network
export const tokenAddresses = {
  [mainnet.id]: {
    USDC: '0xA0b86a33E6441b8c4C8C0C4B8c8C0C4B8c8C0C4B',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  [sepolia.id]: {
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    USDT: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
    DAI: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
    WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  },
  [base.id]: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  [baseSepolia.id]: {
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    USDT: '0x225EdAFc33B053953d8057a6E644e982D7e73b8',
    DAI: '0x4c65A70fC1e40A5e21c0088A3007d848E3655736',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  [arbitrum.id]: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
  [arbitrumSepolia.id]: {
    USDC: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    USDT: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
    DAI: '0x08Cb71192985E936C7Cd166A8bE03599C024d9f3',
    WETH: '0xc556bAe1e86B2aE12883eE3C4B0B0e3e5a6e5E8e',
  },
} as const;

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, base, baseSepolia, arbitrum, arbitrumSepolia],
  transports: {
    [mainnet.id]: http(networks.mainnet.rpcUrl),
    [sepolia.id]: http(networks.sepolia.rpcUrl),
    [base.id]: http(networks.base.rpcUrl),
    [baseSepolia.id]: http(networks.baseSepolia.rpcUrl),
    [arbitrum.id]: http(networks.arbitrum.rpcUrl),
    [arbitrumSepolia.id]: http(networks.arbitrumSepolia.rpcUrl),
  },
});

export type NetworkKey = keyof typeof networks;
export type TokenSymbol = 'ETH' | 'USDC' | 'USDT' | 'DAI' | 'WETH';

export interface BalanceResult {
  value: bigint;
  formatted: string;
  decimals: number;
  symbol: string;
  tokenAddress?: string;
  networkId: number;
  networkName: string;
}

export interface BalanceOptions {
  address: string;
  chainId?: number;
  token?: TokenSymbol;
  unit?: 'ether' | 'gwei' | 'wei' | number;
}

/**
 * Get balance for a given address on a specific network
 * @param options - Balance options including address, chainId, token, and unit
 * @returns Promise<BalanceResult>
 */
export async function getWalletBalance(options: BalanceOptions): Promise<BalanceResult> {
  const { address, chainId, token = 'ETH', unit = 'ether' } = options;

  try {
    // Get the current chain ID or use the provided one
    const currentChainId = chainId || await getCurrentChainId();
    
    // Get token address if not ETH
    let tokenAddress: string | undefined;
    if (token !== 'ETH') {
      tokenAddress = tokenAddresses[currentChainId]?.[token];
      if (!tokenAddress) {
        throw new Error(`Token ${token} not supported on chain ${currentChainId}`);
      }
    }

    // Fetch balance using wagmi
    const balance = await getBalance(wagmiConfig, {
      address: address as `0x${string}`,
      chainId: currentChainId,
      token: tokenAddress as `0x${string}` | undefined,
      unit: unit,
    });

    // Get network info
    const networkInfo = Object.values(networks).find(net => net.id === currentChainId);
    
    return {
      value: balance.value,
      formatted: balance.formatted,
      decimals: balance.decimals,
      symbol: balance.symbol,
      tokenAddress: tokenAddress,
      networkId: currentChainId,
      networkName: networkInfo?.name || 'Unknown Network',
    };
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw new Error(`Failed to fetch ${token} balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get multiple token balances for an address
 * @param address - Wallet address
 * @param chainId - Chain ID
 * @param tokens - Array of token symbols to fetch
 * @returns Promise<BalanceResult[]>
 */
export async function getMultipleBalances(
  address: string,
  chainId?: number,
  tokens: TokenSymbol[] = ['ETH', 'USDC', 'USDT']
): Promise<BalanceResult[]> {
  const promises = tokens.map(token => 
    getWalletBalance({ address, chainId, token })
  );
  
  return Promise.allSettled(promises).then(results =>
    results
      .filter((result): result is PromiseFulfilledResult<BalanceResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)
  );
}

/**
 * Get current chain ID from window.ethereum
 * @returns Promise<number>
 */
async function getCurrentChainId(): Promise<number> {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      return parseInt(chainId, 16);
    } catch (error) {
      console.error('Error getting chain ID:', error);
    }
  }
  
  // Default to mainnet if no chain ID found
  return mainnet.id;
}

/**
 * Format balance for display
 * @param balance - Balance result
 * @param showSymbol - Whether to show token symbol
 * @returns Formatted balance string
 */
export function formatBalance(balance: BalanceResult, showSymbol: boolean = true): string {
  const formatted = parseFloat(balance.formatted).toFixed(4);
  return showSymbol ? `${formatted} ${balance.symbol}` : formatted;
}

/**
 * Get supported tokens for a specific network
 * @param chainId - Chain ID
 * @returns Array of supported token symbols
 */
export function getSupportedTokens(chainId: number): TokenSymbol[] {
  const tokens = tokenAddresses[chainId];
  return tokens ? ['ETH', ...Object.keys(tokens) as TokenSymbol[]] : ['ETH'];
}

/**
 * Check if a token is supported on a network
 * @param token - Token symbol
 * @param chainId - Chain ID
 * @returns boolean
 */
export function isTokenSupported(token: TokenSymbol, chainId: number): boolean {
  return getSupportedTokens(chainId).includes(token);
}
