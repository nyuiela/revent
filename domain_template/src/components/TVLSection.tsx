'use client';

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import MultiContractButton from './buttons/MultiContractButton';
import { eventId, reventTradingAbi, reventTradingAddress } from '@/contract/abi/contract';
import { useEventData } from '@/hooks/useEventData';
import { useWallet } from '@/components/WalletProvider';

interface TVLData {
  totalValue: number;
  lastUpdated: string;
}

export default function TVLSection({ onInvestClick }: { onInvestClick: () => void }) {
  const { address } = useWallet();
  const { data: eventData, isLoading: eventLoading, error: eventError, refetch: refetchEvent } = useEventData(address || undefined);

  const [tvl, setTvl] = useState<TVLData>({
    totalValue: 0,
    lastUpdated: new Date().toISOString()
  });

  // ETH price state
  const [ethPrice, setEthPrice] = useState(1632); // Default fallback
  const [priceLoading, setPriceLoading] = useState(true);

  // Fetch ETH price from CoinGecko
  const fetchEthPrice = async () => {
    try {
      setPriceLoading(true);

      // Try CoinGecko first
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();

        if (data.ethereum && data.ethereum.usd) {
          setEthPrice(data.ethereum.usd);
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
          return;
        }
      } catch (coincapError) {
        console.warn('CoinCap API failed:', coincapError);
      }

      console.warn('All price APIs failed, keeping current price');

    } catch (error) {
      console.error('Failed to fetch ETH price from all sources:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  // Read total invested from smart contract
  const { data: totalInvestedWei, isLoading, error, refetch } = useReadContract({
    address: reventTradingAddress as `0x${string}`,
    abi: reventTradingAbi as any,
    functionName: 'getTotalInvested',
    args: [BigInt(1)],
    // query: {
    // refetchInterval: 10000, // Refetch every 10 seconds
    // }
  });


  // Fetch ETH price on component mount
  useEffect(() => {
    fetchEthPrice();

    // Refresh price every 30 seconds
    const interval = setInterval(fetchEthPrice, 30000);

    return () => clearInterval(interval);
  }, []);

  // Convert wei to ETH and then to USD, update TVL
  useEffect(() => {
    // Use event data if available, otherwise fall back to direct contract call
    const totalInvestedWeiValue = eventData?.totalInvested || totalInvestedWei;

    if (totalInvestedWeiValue !== undefined && ethPrice > 0) {
      const totalInvestedEth = Number(totalInvestedWeiValue) / 1e18;
      const totalInvestedUsd = totalInvestedEth * ethPrice;
      setTvl({
        totalValue: totalInvestedUsd,
        lastUpdated: new Date().toISOString()
      });
    }
  }, [eventData?.totalInvested, totalInvestedWei, ethPrice]);

  // Format TVL value with proper formatting
  const formatTVL = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  // Format wei to ETH
  const formatWeiToEth = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(6);
  };

  return (
    <div className="bg-[#6A28D7] min-h-screen flex items-center py-8">
      <div className="max-w-7xl mx-auto w-full px-4">
        {/* Main Heading */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center">
              TOTAL VALUE INVESTED
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  refetch();
                  refetchEvent();
                }}
                disabled={isLoading || eventLoading}
                className="text-white/60 hover:text-white transition-colors"
                title="Refresh TVL data"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={fetchEthPrice}
                disabled={priceLoading}
                className="text-white/60 hover:text-white transition-colors"
                title="Refresh ETH price"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Large TVL Display */}
        <div className="mb-8">
          <div className="text-center">
            <div className="bg-[#4A1A8A] p-4 sm:p-6 md:p-8 shadow-2xl rounded-lg">
              <div className="text-4xl sm:text-6xl md:text-8xl font-black text-white countdown-display mb-4 font-serif break-words">
                {(isLoading || eventLoading) ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (error || eventError) ? (
                  <div className="text-2xl sm:text-4xl text-red-300">Error Loading</div>
                ) : (
                  formatTVL(tvl.totalValue)
                )}
              </div>
              <div className="text-lg sm:text-xl md:text-2xl text-white/80 font-medium">
                Total Event Investment (USD)
              </div>
              {!isLoading && !error && (
                <div className="text-xs sm:text-sm text-white/60 mt-2 space-y-1">
                  <div>Last updated: {new Date(tvl.lastUpdated).toLocaleTimeString()}</div>
                  <div className="flex items-center justify-center space-x-2">
                    <span>ETH Price: ${ethPrice.toLocaleString()}</span>
                    {priceLoading && (
                      <div className="w-3 h-3 border border-white/60 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>
              )}
              {error && (
                <div className="text-xs sm:text-sm text-red-300 mt-2">
                  Failed to load TVL data. Please check your connection.
                </div>
              )}
              {/* Debug info for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-white/40 mt-2 space-y-1 break-words">
                  <div>Contract: {reventTradingAddress} | Event ID: {eventId}</div>
                  {totalInvestedWei ? (
                    <div>
                      ETH Amount: {(Number(totalInvestedWei as bigint) / 1e18).toFixed(6)} ETH |
                      USD Value: ${((Number(totalInvestedWei as bigint) / 1e18) * ethPrice).toFixed(2)}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Investment CTA */}
        <div className="text-center mb-8">
          <button
            onClick={onInvestClick}
            className="bg-[#50C878] hover:bg-[#45B06A] text-white font-bold py-3 px-6 sm:py-4 sm:px-12 rounded-lg text-lg sm:text-xl transition-colors shadow-lg transform hover:scale-105 w-full sm:w-auto"
          >
            Invest in Event
          </button>
          {/* <MultiContractButton contracts={[]} /> */}
          <p className="text-white/70 mt-4 text-sm sm:text-lg">
            Join the community and support MOONSHOT 2025
          </p>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 text-center">
          <div className="bg-white/10 rounded-lg p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">24</div>
            <div className="text-white/80 text-sm sm:text-base">Days Remaining</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {eventData ? eventData.eventInvestors.length : '0'}
            </div>
            <div className="text-white/80 text-sm sm:text-base">Investors</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 sm:p-6 sm:col-span-2 md:col-span-1">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {eventData ? formatWeiToEth(eventData.revenueAccrued) : '0'}
            </div>
            <div className="text-white/80 text-sm sm:text-base">Revenue Accrued (ETH)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
