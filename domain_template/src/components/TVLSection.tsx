'use client';

import { useState, useEffect } from 'react';

interface TVLData {
  totalValue: number;
  lastUpdated: string;
}

export default function TVLSection({ onInvestClick }: { onInvestClick: () => void }) {
  const [tvl, setTvl] = useState<TVLData>({
    totalValue: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch TVL data from server
  const fetchTVL = async () => {
    try {
      const response = await fetch('/api/tvl');
      if (response.ok) {
        const data = await response.json();
        setTvl(data);
      }
    } catch (error) {
      console.error('Failed to fetch TVL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up polling for real-time updates
  useEffect(() => {
    fetchTVL();
    
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchTVL, 5000);
    
    return () => clearInterval(interval);
  }, []);

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
    <div className="bg-[#6A28D7] py-16 px-8 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto w-full">
        {/* Main Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-8">
            TOTAL VALUE LOCKED
          </h2>
        </div>

        {/* Large TVL Display */}
        <div className="text-center mb-16">
          <div className="inline-block">
            <div className="bg-[#4A1A8A] rounded-lg p-8 shadow-2xl">
              <div className="text-8xl font-black text-white countdown-display mb-4">
                {isLoading ? 'Loading...' : formatTVL(tvl.totalValue)}
              </div>
              <div className="text-2xl text-white/80 font-medium">
                Total Event Investment
              </div>
            </div>
          </div>
        </div>

        {/* Investment CTA */}
        <div className="text-center">
          <button
            onClick={onInvestClick}
            className="bg-[#50C878] hover:bg-[#45B06A] text-white font-bold py-4 px-12 rounded-lg text-xl transition-colors shadow-lg transform hover:scale-105"
          >
            Invest in Event
          </button>
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
