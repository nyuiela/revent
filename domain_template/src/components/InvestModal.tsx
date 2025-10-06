"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@/components/WalletProvider';
import { useNotifications } from '@/components/NotificationSystem';
import { useTokenBalance } from '@/hooks/useBalance';
import { TokenSymbol } from '@/utils/balance';
import MultiContractButton from './buttons/MultiContractButton';
import { eventId, reventTradingAbi, reventTradingAddress } from '@/contract/abi/contract';
import { parseEther } from 'viem';
// Helper function to convert ETH to wei
// const ethToWei = (eth: string): bigint => {
//   try {
//     const ethValue = parseFloat(eth);
//     if (isNaN(ethValue) || ethValue < 0) {
//       return 0n;
//     }
//     return BigInt(Math.floor(ethValue * 1e18));
//   } catch (error) {
//     console.error('Error converting ETH to wei:', error);
//     return 0n;
//   }
// };

export default function InvestModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isConnected, address, connect } = useWallet();
  const { addNotification } = useNotifications();
  
  // Balance hooks
  const { balance: ethBalance, loading: ethBalanceLoading, formattedBalance: ethBalanceFormatted } = useTokenBalance('ETH');
  const { balance: usdcBalance, loading: usdcBalanceLoading, formattedBalance: usdcBalanceFormatted } = useTokenBalance('USDC');

  // State for amounts
  const [usdAmount, setUsdAmount] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState<'USD' | 'ETH'>('USD');
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>('ETH');

  // Real-time ETH price from multiple sources
  const [ethPrice, setEthPrice] = useState(1632); // Default fallback
  const [priceLoading, setPriceLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [priceSource, setPriceSource] = useState<string>('CoinGecko');
  const [priceUpdated, setPriceUpdated] = useState(false);

  // Get current balance based on selected token
  const getCurrentBalance = () => {
    if (selectedToken === 'ETH') {
      return ethBalanceFormatted;
    } else if (selectedToken === 'USDC') {
      return usdcBalanceFormatted;
    }
    return '0.0000';
  };

  const getBalanceLoading = () => {
    if (selectedToken === 'ETH') {
      return ethBalanceLoading;
    } else if (selectedToken === 'USDC') {
      return usdcBalanceLoading;
    }
    return false;
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
  // Balance is now automatically managed by the useTokenBalance hook

  // Conversion functions
  const convertUsdToEth = (usd: number) => usd / ethPrice;
  const convertEthToUsd = (eth: number) => eth * ethPrice;

  // Update ETH amount when USD changes
  useEffect(() => {
    if (activeCurrency === 'USD' && usdAmount) {
      const eth = convertUsdToEth(parseFloat(usdAmount));
      setEthAmount(eth.toFixed(6));
    }
  }, [usdAmount, activeCurrency]);

  // Update USD amount when ETH changes
  useEffect(() => {
    if (activeCurrency === 'ETH' && ethAmount) {
      const usd = convertEthToUsd(parseFloat(ethAmount));
      setUsdAmount(usd.toFixed(2));
    }
  }, [ethAmount, activeCurrency]);

  if (!isOpen) return null;

  const handleSwap = () => {
    setActiveCurrency(activeCurrency === 'USD' ? 'ETH' : 'USD');
  };

  const handleInvest = async () => {
    if (!isConnected || !address) {
      addNotification({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet first',
        duration: 3000
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate wallet transaction for investment
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      // Update TVL on server
      await fetch('/api/tvl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(ethAmount) || 0,
          txHash: mockTxHash,
          investor: address
        }),
      });

      addNotification({
        type: 'success',
        title: 'Investment Successful!',
        message: `Successfully invested ${ethAmount} ETH ($${usdAmount}) in MOONSHOT 2025`,
        txHash: mockTxHash,
        duration: 8000
      });

      onClose();
      setUsdAmount('');
      setEthAmount('');
    } catch (error) {
      console.error('Failed to update TVL:', error);
      addNotification({
        type: 'error',
        title: 'Investment Failed',
        message: 'Failed to process investment. Please try again.',
        duration: 5000
      });
    }

    setIsProcessing(false);
  };

  return (
    <div className="bg-black/50 backdrop-blur-sm flex items-center justify-center h-full p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden scale-[0.7]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Invest in MOONSHOT 2025</h2>
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
          {/* USD Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount in USD</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={usdAmount}
                onChange={(e) => {
                  setUsdAmount(e.target.value);
                  setActiveCurrency('USD');
                }}
                className="w-full px-4 py-3 text-2xl font-bold text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-500 font-medium">USD</span>
              </div>
            </div>
            <div className="text-sm text-blue-600 mt-1 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-gray-700">USDC:</span>
                <span className="font-medium">{usdcBalanceFormatted}</span>
                {usdcBalanceLoading && (
                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <button
                onClick={() => {
                  // Balance refreshes automatically via useTokenBalance hook
                  addNotification({
                    type: 'info',
                    title: 'Balance Refreshed',
                    message: 'Your balance is automatically updated',
                    duration: 2000
                  });
                }}
                disabled={getBalanceLoading()}
                className="text-blue-400 hover:text-blue-600 transition-colors"
                title="Refresh balance"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center my-4">
            <button
              onClick={handleSwap}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* Token Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Token</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedToken('ETH')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  selectedToken === 'ETH'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ETH
              </button>
              <button
                onClick={() => setSelectedToken('USDC')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  selectedToken === 'USDC'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                USDC
              </button>
            </div>
          </div>

          {/* Token Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount in {selectedToken}</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.000001"
                value={ethAmount}
                onChange={(e) => {
                  setEthAmount(e.target.value);
                  setActiveCurrency('ETH');
                }}
                className="w-full px-4 py-3 text-2xl font-bold text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-500 font-medium">{selectedToken}</span>
              </div>
            </div>
            <div className="text-sm text-blue-600 mt-1 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-gray-700">{selectedToken}:</span>
                <span className="font-medium">{getCurrentBalance()}</span>
                {getBalanceLoading() && (
                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <button
                onClick={() => {
                  // Balance refreshes automatically via useTokenBalance hook
                  addNotification({
                    type: 'info',
                    title: 'Balance Refreshed',
                    message: 'Your balance is automatically updated',
                    duration: 2000
                  });
                }}
                disabled={getBalanceLoading()}
                className="text-blue-400 hover:text-blue-600 transition-colors"
                title="Refresh balance"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
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

          {/* Investment Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Expected Output</span>
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">{ethAmount} ETH</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Price Impact</span>
              <span className="text-sm font-medium text-green-600">0%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Minimum received</span>
              <span className="text-sm font-medium text-gray-900">{(parseFloat(ethAmount) * 0.98).toFixed(6)} ETH</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Network Fee</span>
              <span className="text-sm font-medium text-gray-900">$2.72</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Exchange Fee</span>
              <span className="text-sm font-medium text-green-600">Free</span>
            </div>
          </div>
          <MultiContractButton
            contracts={
              ethAmount && parseFloat(ethAmount) > 0 ? [
                {
                  address: reventTradingAddress as `0x${string}`,
                  abi: reventTradingAbi as any,
                  functionName: 'investInEvent',
                  args: [eventId],
                  value: parseEther(ethAmount),
                }
              ] : []
            }
            disabled={!ethAmount || parseFloat(ethAmount) <= 0}
            idleLabel={
              !ethAmount
                ? 'Enter amount to invest'
                : `Invest ${ethAmount} ETH`
            }
          />

          {/* Action Button */}
          {/* {!isConnected ? (
            <button
              onClick={async () => {
                try {
                  await connect();
                } catch (error) {
                  addNotification({
                    type: 'error',
                    title: 'Connection Failed',
                    message: 'Please install MetaMask or another Web3 wallet',
                    duration: 5000
                  });
                }
              }}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
            >
              Connect Wallet to Invest
            </button>
          ) : (
            <button
              onClick={handleInvest}
              disabled={!usdAmount || !ethAmount || isProcessing}
              className="w-full py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Investment...</span>
                  </>
                ) : (
                <span>Invest {ethAmount} ETH</span>
                )}
              </button>
          )} */}
        </div>
      </div>
    </div>
  );
}
