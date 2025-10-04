'use client';

import { useState } from 'react';
import { useTradingData } from '@/hooks/useTradingData';
import { useWallet } from '@/components/WalletProvider';
// import { useEventData } from '@/hooks/useEventData';
import CreateBuyOrderModal from './CreateBuyOrderModal';
import CreateSellOrderModal from './CreateSellOrderModal';

export default function TradingSection() {
  const { address } = useWallet();
  const { data: tradingData, isLoading, error, refetch } = useTradingData(address || undefined);
  // const { data: eventData } = useEventData(address || undefined);

  const [activeTab, setActiveTab] = useState<'pricing' | 'volume' | 'orders'>('pricing');
  const [isCreateBuyOrderModalOpen, setIsCreateBuyOrderModalOpen] = useState(false);
  const [isCreateSellOrderModalOpen, setIsCreateSellOrderModalOpen] = useState(false);

  const formatWeiToEth = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(6);
  };

  const formatBasisPoints = (bps: bigint) => {
    return (Number(bps) / 100).toFixed(2);
  };

  const getMomentumColor = (momentum: bigint) => {
    const momentumValue = Number(momentum);
    if (momentumValue > 10000) return 'text-green-600';
    if (momentumValue < 10000) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMomentumIcon = (momentum: bigint) => {
    const momentumValue = Number(momentum);
    if (momentumValue > 10000) return '📈';
    if (momentumValue < 10000) return '📉';
    return '➡️';
  };

  if (isLoading) {
    return (
      <div className="bg-[#6A28D7] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading trading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#6A28D7] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-300 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Trading Data</h2>
          <p className="text-white/80 mb-4">Unable to fetch trading information from the smart contract.</p>
          <button
            onClick={() => refetch()}
            className="bg-[#50C878] hover:bg-[#45B06A] text-white px-6 py-2 rounded-lg transition-all duration-200 relative transform hover:translate-y-[-2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!tradingData) {
    return (
      <div className="bg-[#6A28D7] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-white/60 text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-white mb-2">No Trading Data Available</h2>
          <p className="text-white/80">Trading data is not available for this event.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#6A28D7] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">TRADING DASHBOARD</h2>
          <p className="text-white/80 text-lg sm:text-xl">Real-time trading data and market insights</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="bg-[#4A1A8A] rounded-lg p-1 flex flex-col sm:flex-row w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-md transition-colors text-sm sm:text-base ${activeTab === 'pricing'
                ? 'bg-[#50C878] text-white'
                : 'text-white/80 hover:text-white'
                }`}
            >
              Pricing
            </button>
            <button
              onClick={() => setActiveTab('volume')}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-md transition-colors text-sm sm:text-base ${activeTab === 'volume'
                ? 'bg-[#50C878] text-white'
                : 'text-white/80 hover:text-white'
                }`}
            >
              Volume
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-md transition-colors text-sm sm:text-base ${activeTab === 'orders'
                ? 'bg-[#50C878] text-white'
                : 'text-white/80 hover:text-white'
                }`}
            >
              Orders
            </button>
          </div>
        </div>

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Current Price */}
            <div className="bg-[#4A1A8A] rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Current Share Price</h3>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-6xl font-bold text-[#50C878] mb-2 break-words">
                  {formatWeiToEth(tradingData.currentPrice)} ETH
                </div>
                <div className="text-white/80 text-sm sm:text-base">Per Share</div>
              </div>
            </div>

            {/* Price Details */}
            <div className="bg-[#4A1A8A] rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Price Information</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-white/80">Base Price:</span>
                  <span className="text-white font-medium break-words">{formatWeiToEth(tradingData.basePrice)} ETH</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-white/80">Multiplier:</span>
                  <span className="text-white font-medium">{formatBasisPoints(tradingData.currentMultiplier)}x</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-white/80">Total Value:</span>
                  <span className="text-white font-medium break-words">{formatWeiToEth(tradingData.totalValue)} ETH</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-white/80">Share Supply:</span>
                  <span className="text-white font-medium break-words">{formatWeiToEth(tradingData.shareSupply)} ETH</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Volume Tab */}
        {activeTab === 'volume' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Trading Volume */}
            <div className="bg-[#4A1A8A] rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">24h Volume</h3>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#50C878] mb-2 break-words">
                  {formatWeiToEth(tradingData.totalVolume)} ETH
                </div>
                <div className="text-white/80 text-sm sm:text-base">Total Volume</div>
              </div>
            </div>

            {/* Buy/Sell Volume */}
            <div className="bg-[#4A1A8A] rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Volume Breakdown</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-[#50C878]">Buy Volume:</span>
                  <span className="text-white font-medium break-words">{formatWeiToEth(tradingData.buyVolume)} ETH</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-[#FF6B6B]">Sell Volume:</span>
                  <span className="text-white font-medium break-words">{formatWeiToEth(tradingData.sellVolume)} ETH</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-white/80">Buy Ratio:</span>
                  <span className="text-white font-medium">{formatBasisPoints(tradingData.buyRatio)}%</span>
                </div>
              </div>
            </div>

            {/* Momentum */}
            <div className="bg-[#4A1A8A] rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl sm:col-span-2 lg:col-span-1">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Market Momentum</h3>
              <div className="text-center">
                <div className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 ${getMomentumColor(tradingData.momentumFactor)}`}>
                  {/* {getMomentumIcon(tradingData.momentumFactor)}  */}
                  {formatBasisPoints(tradingData.momentumFactor)}%
                </div>
                <div className="text-white/80 text-sm sm:text-base">Momentum Factor</div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Active Orders */}
            <div className="bg-[#4A1A8A] rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Active Orders</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-[#50C878]">Buy Orders:</span>
                  <span className="text-white font-medium">{tradingData.activeBuyOrders.length}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-[#FF6B6B]">Sell Orders:</span>
                  <span className="text-white font-medium">{tradingData.activeSellOrders.length}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-white/80">Total Orders:</span>
                  <span className="text-white font-medium">{tradingData.eventOrders.length}</span>
                </div>
                {address && (
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-[#50C878]">Your Orders:</span>
                    <span className="text-white font-medium">{tradingData.userOrders.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Actions */}
            <div className="bg-[#4A1A8A] rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Quick Actions</h3>
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={() => setIsCreateBuyOrderModalOpen(true)}
                  className="w-full bg-[#50C878] hover:bg-[#45B06A] text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 relative transform hover:translate-y-[-2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] text-sm sm:text-base"
                >
                  <span>Create Buy Order</span>
                </button>
                <button
                  onClick={() => setIsCreateSellOrderModalOpen(true)}
                  className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 relative transform hover:translate-y-[-2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] text-sm sm:text-base"
                >
                  <span>Create Sell Order</span>
                </button>
                <button className="w-full bg-[#6A28D7] hover:bg-[#5A1FA6] text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 relative transform hover:translate-y-[-2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] text-sm sm:text-base">
                  <span>View All Orders</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trading Stats */}
        <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#4A1A8A] rounded-lg p-4 sm:p-6 text-center shadow-2xl">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
              {tradingData.activeBuyOrders.length + tradingData.activeSellOrders.length}
            </div>
            <div className="text-white/80 text-xs sm:text-sm">Active Orders</div>
          </div>
          <div className="bg-[#4A1A8A] rounded-lg p-4 sm:p-6 text-center shadow-2xl">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 break-words">
              {formatWeiToEth(tradingData.totalVolume)}
            </div>
            <div className="text-white/80 text-xs sm:text-sm">24h Volume (ETH)</div>
          </div>
          <div className="bg-[#4A1A8A] rounded-lg p-4 sm:p-6 text-center shadow-2xl">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
              {formatBasisPoints(tradingData.buyRatio)}%
            </div>
            <div className="text-white/80 text-xs sm:text-sm">Buy Ratio</div>
          </div>
          <div className="bg-[#4A1A8A] rounded-lg p-4 sm:p-6 text-center shadow-2xl">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
              {formatBasisPoints(tradingData.momentumFactor)}%
            </div>
            <div className="text-white/80 text-xs sm:text-sm">Momentum</div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-6 md:mt-8">
          <button
            onClick={() => refetch()}
            className="bg-[#50C878] hover:bg-[#45B06A] text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 mx-auto relative transform hover:translate-y-[-2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Create Buy Order Modal */}
      <CreateBuyOrderModal
        isOpen={isCreateBuyOrderModalOpen}
        onClose={() => setIsCreateBuyOrderModalOpen(false)}
      />

      {/* Create Sell Order Modal */}
      <CreateSellOrderModal
        isOpen={isCreateSellOrderModalOpen}
        onClose={() => setIsCreateSellOrderModalOpen(false)}
      />
    </div>
  );
}
