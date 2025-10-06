"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@/components/WalletProvider';
import { 
  getWalletBalance, 
  getMultipleBalances, 
  formatBalance,
  getSupportedTokens,
  type BalanceResult,
  type TokenSymbol,
  type BalanceOptions 
} from '@/utils/balance';

export interface UseBalanceReturn {
  balances: BalanceResult[];
  loading: boolean;
  error: string | null;
  refreshBalances: () => Promise<void>;
  getBalance: (token?: TokenSymbol) => BalanceResult | null;
  formatBalance: (token?: TokenSymbol, showSymbol?: boolean) => string;
  supportedTokens: TokenSymbol[];
}

export interface UseBalanceOptions {
  tokens?: TokenSymbol[];
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

/**
 * Hook for managing wallet balances
 * @param options - Configuration options
 * @returns Balance management functions and state
 */
export function useBalance(options: UseBalanceOptions = {}): UseBalanceReturn {
  const tokensList = useMemo<TokenSymbol[]>(
    () => options.tokens ?? ['ETH', 'USDC', 'USDT'],
    [options.tokens]
  );
  const autoRefresh = options.autoRefresh ?? true;
  const refreshInterval = options.refreshInterval ?? 30000;
  const { isConnected, address } = useWallet();
  
  const [balances, setBalances] = useState<BalanceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!isConnected || !address) {
      setBalances([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balanceResults = await getMultipleBalances(address, undefined, tokensList);
      setBalances(balanceResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balances';
      setError(errorMessage);
      console.error('Balance fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, tokensList]);

  // Auto-refresh balances
  useEffect(() => {
    if (autoRefresh && isConnected) {
      fetchBalances();
      
      const interval = setInterval(fetchBalances, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBalances, autoRefresh, refreshInterval, isConnected]);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
    } else {
      setBalances([]);
      setError(null);
    }
  }, [isConnected, address, fetchBalances]);

  const refreshBalances = useCallback(async () => {
    await fetchBalances();
  }, [fetchBalances]);

  const getBalance = useCallback((token: TokenSymbol = 'ETH'): BalanceResult | null => {
    return balances.find(balance => balance.symbol === token) || null;
  }, [balances]);

  const formatBalanceForDisplay = useCallback((token: TokenSymbol = 'ETH', showSymbol: boolean = true): string => {
    const balance = getBalance(token);
    if (!balance) return '0.0000';
    return formatBalance(balance, showSymbol);
  }, [getBalance]);

  // Get supported tokens for current network (would need chainId from wallet)
  const supportedTokens: TokenSymbol[] = tokensList;

  return {
    balances,
    loading,
    error,
    refreshBalances,
    getBalance,
    formatBalance: formatBalanceForDisplay,
    supportedTokens,
  };
}

/**
 * Hook for getting a single token balance
 * @param token - Token symbol
 * @param options - Additional options
 * @returns Single balance state and functions
 */
export function useTokenBalance(token: TokenSymbol = 'ETH', options: Partial<UseBalanceOptions> = {}) {
  const { balances, loading, error, refreshBalances, getBalance, formatBalance } = useBalance({
    tokens: [token],
    ...options,
  });

  const balance = getBalance(token);

  return {
    balance,
    loading,
    error,
    refreshBalance: refreshBalances,
    formattedBalance: formatBalance(token),
    hasBalance: balance ? balance.value > 0n : false,
  };
}
