'use client';

import { useState, useEffect } from 'react';

interface TVLData {
  totalValue: number;
  lastUpdated: string;
}

export default function TVLBar({ onInvestClick }: { onInvestClick: () => void }) {
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
    <div className="bg-black text-white py-2 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">TOTAL VALUE LOCKED</span>
        <span className="text-2xl font-bold tracking-wider">
          {isLoading ? 'Loading...' : formatTVL(tvl.totalValue)}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm">Invest in Event</span>
        <button 
          onClick={onInvestClick}
          className="bg-[#6A28D7] hover:bg-[#5A1FC7] text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          Invest
        </button>
      </div>
    </div>
  );
}
