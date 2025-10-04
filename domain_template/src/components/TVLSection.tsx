'use client';

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import MultiContractButton from './buttons/MultiContractButton';
import { eventId, reventTradingAbi, reventTradingAddress } from '@/contract/abi/contract';

interface TVLData {
  totalValue: number;
  lastUpdated: string;
}

export default function TVLSection({ onInvestClick }: { onInvestClick: () => void }) {
  const [tvl, setTvl] = useState<TVLData>({
    totalValue: 0,
    lastUpdated: new Date().toISOString()
  });

  // Read total invested from smart contract
  const { data: totalInvestedWei, isLoading, error, refetch } = useReadContract({
    address: reventTradingAddress as `0x${string}`,
    abi: reventTradingAbi as any,
    functionName: 'getTotalInvested',
    args: [BigInt(eventId)],
    // query: {
    // refetchInterval: 10000, // Refetch every 10 seconds
    // }
  });
  console.log(totalInvestedWei);

  // Convert wei to ETH and update TVL
  useEffect(() => {
    if (totalInvestedWei !== undefined) {
      const totalInvestedEth = Number(totalInvestedWei) / 1e18;
      setTvl({
        totalValue: totalInvestedEth,
        lastUpdated: new Date().toISOString()
      });
    }
  }, [totalInvestedWei]);

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

  return (
    <div className="bg-[#6A28D7] min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto w-full">
        {/* Main Heading */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4">
            <h2 className="text-4xl font-bold text-white">
              TOTAL VALUE INVESTED
            </h2>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="text-white/60 hover:text-white transition-colors"
              title="Refresh TVL data"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Large TVL Display */}
        <div className="">
          <div className="text-center">
            <div className="bg-[#4A1A8A] p-8 shadow-2xl">
              <div className="text-8xl font-black text-white countdown-display mb-4 font-serif">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className="text-4xl text-red-300">Error Loading</div>
                ) : (
                  formatTVL(tvl.totalValue)
                )}
              </div>
              <div className="text-2xl text-white/80 font-medium">
                Total Event Investment
              </div>
              {!isLoading && !error && (
                <div className="text-sm text-white/60 mt-2">
                  Last updated: {new Date(tvl.lastUpdated).toLocaleTimeString()}
                </div>
              )}
              {error && (
                <div className="text-sm text-red-300 mt-2">
                  Failed to load TVL data. Please check your connection.
                </div>
              )}
              {/* Debug info for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-white/40 mt-2">
                  Contract: {reventTradingAddress} | Event ID: {eventId}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Investment CTA */}
        <div className="text-center px-6 scroll-py-6">
          <button
            onClick={onInvestClick}
            className="bg-[#50C878] hover:bg-[#45B06A] text-white font-bold py-4 px-12 rounded-lg text-xl transition-colors shadow-lg transform hover:scale-105"
          >
            Invest in Event
          </button>
          {/* <MultiContractButton contracts={[]} /> */}
          <p className="text-white/70 mt-4 text-lg">
            Join the community and support MOONSHOT 2025
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white/10 rounded-lg p-6">
            <div className="text-3xl font-bold text-white mb-2">24</div>
            <div className="text-white/80">Days Remaining</div>
          </div>
          <div className="bg-white/10 rounded-lg p-6">
            <div className="text-3xl font-bold text-white mb-2">150+</div>
            <div className="text-white/80">Investors</div>
          </div>
          <div className="bg-white/10 rounded-lg p-6">
            <div className="text-3xl font-bold text-white mb-2">5.2%</div>
            <div className="text-white/80">Expected ROI</div>
          </div>
        </div>
      </div>
    </div>
  );
}
