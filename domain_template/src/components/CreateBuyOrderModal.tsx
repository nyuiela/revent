"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@/components/WalletProvider';
import { useNotifications } from '@/components/NotificationSystem';
import MultiContractButton from './buttons/MultiContractButton';
import { eventId, reventTradingAbi, reventTradingAddress } from '@/contract/abi/contract';
import { parseEther } from 'viem';

export default function CreateBuyOrderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isConnected, address, connect } = useWallet();
  const { addNotification } = useNotifications();

  // State for order parameters
  const [maxPrice, setMaxPrice] = useState('');
  const [currency, setCurrency] = useState('0x0000000000000000000000000000000000000001'); // ETH address
  const [expirationTime, setExpirationTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to check if currency is ETH
  const isEthCurrency = currency === '0x0000000000000000000000000000000000000001';

  // User wallet balance
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Real-time ETH price from multiple sources
  const [ethPrice, setEthPrice] = useState(1632); // Default fallback
  const [priceLoading, setPriceLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [priceSource, setPriceSource] = useState<string>('CoinGecko');
  const [priceUpdated, setPriceUpdated] = useState(false);

  // Fetch user's ETH balance from wallet
  const fetchUserBalance = async () => {
    if (!isConnected || !address) {
      setEthBalance('0');
      return;
    }

    try {
      setBalanceLoading(true);

      // Check if ethereum provider is available
      if (!window.ethereum) {
        console.warn('No ethereum provider found');
        setEthBalance('0');
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

        setEthBalance(ethBalanceFormatted);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      setEthBalance('0');
    } finally {
      setBalanceLoading(false);
    }
  };

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

  // Fetch user balance when wallet connects or ETH price changes
  useEffect(() => {
    if (isConnected && address) {
      fetchUserBalance();
    }
  }, [isConnected, address, ethPrice]);

  if (!isOpen) return null;

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
  };

  const calculateMaxPriceUsd = () => {
    if (!maxPrice) return '0';
    return (parseFloat(maxPrice) * ethPrice).toFixed(2);
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create Buy Order</h2>
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

          {/* Max Price Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Price ({isEthCurrency ? 'ETH' : 'USD'})
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step={isEthCurrency ? "0.000001" : "0.01"}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
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
                    ? `≈ $${calculateMaxPriceUsd()} USD`
                    : `≈ ${maxPrice ? (parseFloat(maxPrice) / ethPrice).toFixed(6) : '0'} ETH`
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

          {/* Order Details */}
          {/* <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Order Type</span>
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Buy Order</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Maximum Price</span>
              <span className="text-sm font-medium text-gray-900">
                {maxPrice || '0'} {isEthCurrency ? 'ETH' : 'USD'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Currency</span>
              <span className="text-sm font-medium text-gray-900">
                {currency === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'USDC'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Expiration</span>
              <span className="text-sm font-medium text-gray-900">
                {expirationTime ? `${expirationTime} days` : 'No expiration'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Network Fee</span>
              <span className="text-sm font-medium text-gray-900">~$2.72</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Trading Fee</span>
              <span className="text-sm font-medium text-green-600">1%</span>
            </div>
          </div> */}

          {/* MultiContractButton for creating buy order */}
          <MultiContractButton
            contracts={
              maxPrice && parseFloat(maxPrice) > 0 ? [
                {
                  address: reventTradingAddress as `0x${string}`,
                  abi: reventTradingAbi as any,
                  functionName: 'createBuyOrder',
                  args: [
                    eventId,
                    isEthCurrency
                      ? parseEther(maxPrice)
                      : parseEther((parseFloat(maxPrice) / ethPrice).toString()),
                    currency as `0x${string}`,
                    expirationTime ? calculateExpirationTimestamp() : 0
                  ],
                  value: isEthCurrency ? parseEther(maxPrice) : BigInt(0),
                }
              ] : []
            }
            disabled={!maxPrice || parseFloat(maxPrice) <= 0}
            idleLabel={
              !maxPrice
                ? 'Enter maximum price'
                : `Create Buy Order - ${maxPrice} ${isEthCurrency ? 'ETH' : 'USD'}`
            }
          />
        </div>
      </div>
    </div>
  );
}
