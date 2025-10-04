"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/components/WalletProvider';
import MultiContractButton from './buttons/MultiContractButton';
import { eventId, reventTradingAbi, reventTradingAddress } from '@/contract/abi/contract';
import { parseEther } from 'viem';

export default function CreateInvestorShareSellOrderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isConnected, address } = useWallet();

  // State for order parameters
  const [shareAmount, setShareAmount] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [currency, setCurrency] = useState('0x0000000000000000000000000000000000000001'); // ETH address
  const [expirationTime, setExpirationTime] = useState('');

  // Helper to check if currency is ETH
  const isEthCurrency = currency === '0x0000000000000000000000000000000000000001';

  // User wallet balance
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Real-time ETH price from multiple sources
  const [ethPrice, setEthPrice] = useState(1632); // Default fallback
  const [priceLoading, setPriceLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [priceSource, setPriceSource] = useState<string>('CoinGecko');
  const [priceUpdated, setPriceUpdated] = useState(false);

  // User's share balance (this would come from the smart contract)
  const [userShareBalance, setUserShareBalance] = useState<string>('0');
  const [shareBalanceLoading, setShareBalanceLoading] = useState(false);

  // Fetch user's ETH balance from wallet
  const fetchUserBalance = useCallback(async () => {
    if (!isConnected || !address) {
      return;
    }

    try {
      setBalanceLoading(true);

      // Check if ethereum provider is available
      if (!window.ethereum) {
        console.warn('No ethereum provider found');
        return;
      }

      // Get ETH balance from wallet
      const balance = await (window.ethereum as any).request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      if (balance) {
        // Convert from wei to ETH
        const ethBalanceWei = BigInt(balance);
        const ethBalanceEth = Number(ethBalanceWei) / 1e18;
        const ethBalanceFormatted = ethBalanceEth.toFixed(6);
        console.log('ETH Balance:', ethBalanceFormatted);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  }, [isConnected, address]);

  // Fetch user's share balance from smart contract
  const fetchUserShareBalance = useCallback(async () => {
    if (!isConnected || !address) {
      setUserShareBalance('0');
      return;
    }

    try {
      setShareBalanceLoading(true);

      // This would typically be a smart contract call to getInvestorShareBalance
      // For now, we'll simulate it with a placeholder
      // In a real implementation, you'd use wagmi's useReadContract here
      console.log('Fetching user share balance for event:', eventId);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Placeholder - replace with actual contract call
      setUserShareBalance('100.0'); // Example balance

    } catch (error) {
      console.error('Failed to fetch share balance:', error);
      setUserShareBalance('0');
    } finally {
      setShareBalanceLoading(false);
    }
  }, [isConnected, address]);

  // Fetch real-time ETH price from multiple sources
  const fetchEthPrice = async () => {
    try {
      setPriceLoading(true);

      // Try CoinGecko first
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();

        if (data.ethereum && data.ethereum.usd) {
          setEthPrice(data.ethereum.usd);
          setLastUpdated(new Date());
          setPriceSource('CoinGecko');
          setPriceUpdated(true);
          setTimeout(() => setPriceUpdated(false), 2000);
          return;
        }
      } catch (coingeckoError) {
        console.warn('CoinGecko API failed, trying alternative:', coingeckoError);
      }

      // Fallback to CoinCap API
      try {
        const response = await fetch('https://api.coincap.io/v2/assets/ethereum');
        const data = await response.json();

        if (data.data && data.data.priceUsd) {
          setEthPrice(parseFloat(data.data.priceUsd));
          setLastUpdated(new Date());
          setPriceSource('CoinCap');
          setPriceUpdated(true);
          setTimeout(() => setPriceUpdated(false), 2000);
          return;
        }
      } catch (coincapError) {
        console.warn('CoinCap API failed:', coincapError);
      }

      // If all APIs fail, keep the current price
      console.warn('All price APIs failed, keeping current price');

    } catch (error) {
      console.error('Failed to fetch ETH price from all sources:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => {
    fetchEthPrice();

    // Refresh price every 30 seconds
    const interval = setInterval(fetchEthPrice, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch user balance and share balance when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchUserBalance();
      fetchUserShareBalance();
    }
  }, [isConnected, address, fetchUserBalance, fetchUserShareBalance]);

  if (!isOpen) return null;

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
  };

  const calculateTotalValueUsd = () => {
    if (!shareAmount || !pricePerShare) return '0';
    const totalValue = parseFloat(shareAmount) * parseFloat(pricePerShare);
    return isEthCurrency ? (totalValue * ethPrice).toFixed(2) : totalValue.toFixed(2);
  };

  const calculateTotalValueEth = () => {
    if (!shareAmount || !pricePerShare) return '0';
    const totalValue = parseFloat(shareAmount) * parseFloat(pricePerShare);
    return isEthCurrency ? totalValue.toFixed(6) : (totalValue / ethPrice).toFixed(6);
  };

  const calculateExpirationTimestamp = () => {
    if (!expirationTime) return 0;
    const now = Math.floor(Date.now() / 1000);
    const days = parseInt(expirationTime);
    return now + (days * 24 * 60 * 60);
  };

  const formatExpirationDate = () => {
    const timestamp = calculateExpirationTimestamp();
    if (timestamp === 0) return 'No expiration';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const isInsufficientShares = Boolean(shareAmount && parseFloat(shareAmount) > parseFloat(userShareBalance));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Sell Investor Shares</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Share Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Amount
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.000001"
                value={shareAmount}
                onChange={(e) => setShareAmount(e.target.value)}
                className={`w-full px-4 py-3 text-lg font-medium text-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isInsufficientShares ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                placeholder="0.000000"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-500 font-medium">shares</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-sm text-gray-600">
                Available: {shareBalanceLoading ? 'Loading...' : `${userShareBalance} shares`}
              </div>
              <button
                onClick={fetchUserShareBalance}
                disabled={shareBalanceLoading}
                className="text-blue-400 hover:text-blue-600 transition-colors"
                title="Refresh share balance"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            {isInsufficientShares && (
              <div className="text-sm text-red-600 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Insufficient shares
              </div>
            )}
          </div>

          {/* Price Per Share Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Per Share ({isEthCurrency ? 'ETH' : 'USD'})
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step={isEthCurrency ? "0.000001" : "0.01"}
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                className="w-full px-4 py-3 text-2xl font-bold text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-500 font-medium">{isEthCurrency ? 'ETH' : 'USD'}</span>
              </div>
            </div>
            <div className="text-sm text-blue-600 mt-1 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>
                  {isEthCurrency
                    ? `≈ $${pricePerShare ? (parseFloat(pricePerShare) * ethPrice).toFixed(2) : '0'} USD`
                    : `≈ ${pricePerShare ? (parseFloat(pricePerShare) / ethPrice).toFixed(6) : '0'} ETH`
                  }
                </span>
                {balanceLoading && (
                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <button
                onClick={fetchUserBalance}
                disabled={balanceLoading}
                className="text-blue-400 hover:text-blue-600 transition-colors"
                title="Refresh balance"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Total Value Display */}
          {shareAmount && pricePerShare && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">Total Order Value</div>
              <div className="text-2xl font-bold text-blue-900">
                {isEthCurrency ? `${calculateTotalValueEth()} ETH` : `$${calculateTotalValueUsd()} USD`}
              </div>
              <div className="text-sm text-gray-600">
                ≈ {isEthCurrency ? `$${calculateTotalValueUsd()} USD` : `${calculateTotalValueEth()} ETH`}
              </div>
            </div>
          )}

          {/* Currency Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCurrencyChange('0x0000000000000000000000000000000000000001')}
                className={`p-3 rounded-lg border-2 transition-colors ${currency === '0x0000000000000000000000000000000000000001'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="text-center">
                  <div className="font-medium">ETH</div>
                  <div className="text-xs text-gray-500">Ethereum</div>
                </div>
              </button>
              <button
                onClick={() => handleCurrencyChange('0x0000000000000000000000000000000000000002')}
                className={`p-3 rounded-lg border-2 transition-colors ${currency === '0x0000000000000000000000000000000000000002'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="text-center">
                  <div className="font-medium">USDC</div>
                  <div className="text-xs text-gray-500">USD Coin</div>
                </div>
              </button>
            </div>
          </div>

          {/* Expiration Time */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiration (Days)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="365"
                value={expirationTime}
                onChange={(e) => setExpirationTime(e.target.value)}
                className="w-full px-4 py-3 text-lg font-medium text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="7"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-500 font-medium">days</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {expirationTime ? `Expires: ${formatExpirationDate()}` : 'No expiration set'}
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 flex items-center space-x-2">
                <span className={`transition-colors duration-300 ${priceUpdated ? 'text-green-600 font-semibold' : ''}`}>
                  1 ETH = ${ethPrice.toLocaleString()}
                </span>
                {priceLoading && (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                )}
                {priceUpdated && !priceLoading && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <button
                onClick={fetchEthPrice}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh price"
                disabled={priceLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Live price from {priceSource} • Updates every 30s
              {lastUpdated && (
                <span className="ml-2">
                  • Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* MultiContractButton for creating investor share sell order */}
          <MultiContractButton
            contracts={
              shareAmount && pricePerShare && parseFloat(shareAmount) > 0 && parseFloat(pricePerShare) > 0 ? [
                {
                  address: reventTradingAddress as `0x${string}`,
                  abi: reventTradingAbi as any,
                  functionName: 'createInvestorShareSellOrder',
                  args: [
                    eventId,
                    parseEther(shareAmount),
                    isEthCurrency
                      ? parseEther(pricePerShare)
                      : parseEther((parseFloat(pricePerShare) / ethPrice).toString()),
                    currency as `0x${string}`,
                    expirationTime ? calculateExpirationTimestamp() : 0
                  ],
                  value: BigInt(0), // Investor share sell orders don't require ETH value
                }
              ] : []
            }
            disabled={
              !shareAmount ||
              !pricePerShare ||
              parseFloat(shareAmount || '0') <= 0 ||
              parseFloat(pricePerShare || '0') <= 0 ||
              isInsufficientShares
            }
            idleLabel={
              !shareAmount || !pricePerShare
                ? 'Enter share amount and price'
                : isInsufficientShares
                  ? 'Insufficient shares'
                  : `Sell ${shareAmount} shares at ${pricePerShare} ${isEthCurrency ? 'ETH' : 'USD'} each`
            }
          />
        </div>
      </div>
    </div>
  );
}
