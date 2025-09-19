"use client";

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface Chain {
  id: string;
  name: string;
  logo: string;
  isActive: boolean; // Indicates if the domain is already active on this chain
  bgColor?: string;
  bgGradient?: string; // CSS gradient string
  textColor?: string;
}

const mockChains: Chain[] = [
  { 
    id: 'ethereum', 
    name: 'Ethereum', 
    logo: 'https://superbridge.app/img/ethereum/icon.svg', 
    isActive: true,
    bgColor: '#627EEA',
    textColor: 'white'
  },
  { 
    id: 'base', 
    name: 'Base', 
    logo: 'https://superbridge.app/img/base/icon.svg', 
    isActive: false,
    bgColor: '#0052FF',
    textColor: 'white'
  },
  { 
    id: 'arbitrum', 
    name: 'Arbitrum One', 
    logo: 'https://superbridge.app/img/arbitrum-one/icon.svg', 
    isActive: true,
    bgColor: '#1C4ADD',
    textColor: 'white'
  },
  { 
    id: 'optimism', 
    name: 'Optimism', 
    logo: 'https://superbridge.app/img/optimism/icon.svg', 
    isActive: false,
    bgColor: '#FF0420',
    textColor: 'white'
  },
  { 
    id: 'polygon', 
    name: 'Polygon', 
    logo: 'https://superbridge.app/img/polygon/icon.svg', 
    isActive: false,
    bgColor: '#8247E5',
    textColor: 'white'
  },
  { 
    id: 'celo', 
    name: 'Celo', 
    logo: 'https://superbridge.app/img/celo/icon.svg', 
    isActive: false,
    bgColor: '#FFFF52',
    textColor: 'black'
  },
  { 
    id: 'avalanche', 
    name: 'Avalanche', 
    logo: 'https://superbridge.app/img/avalanche/icon.svg', 
    isActive: false,
    bgColor: '#E84142',
    textColor: 'white'
  },
  { 
    id: 'binance', 
    name: 'BNB Smart Chain', 
    logo: 'https://superbridge.app/img/bsc/icon.svg', 
    isActive: false,
    bgColor: '#FFE900',
    textColor: '#181A1E'
  },
  { 
    id: 'lisk', 
    name: 'Lisk', 
    logo: 'https://superbridge.app/img/lisk-mainnet/icon.svg', 
    isActive: false,
    bgGradient: 'linear-gradient(to bottom, #000000, #1E134D, #5B3CF3)',
    textColor: 'white'
  },
];

interface BridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BridgeModal({ isOpen, onClose }: BridgeModalProps) {
  const [selectedChains, setSelectedChains] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Pre-select chains where the domain is already active
      const activeChainIds = new Set(mockChains.filter(chain => chain.isActive).map(chain => chain.id));
      setSelectedChains(activeChainIds);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChainClick = (chainId: string) => {
    setSelectedChains(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chainId)) {
        newSet.delete(chainId);
      } else {
        newSet.add(chainId);
      }
      return newSet;
    });
  };

  const handleBridge = () => {
    alert(`Bridging domain to: ${Array.from(selectedChains).join(', ')} (Mock action)`);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-white/5 via-gray-500/5 to-black/10 dark:from-black/5 dark:via-gray-500/5 dark:to-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl w-full max-w-3xl h-[90vh] flex flex-col shadow-2xl relative border border-white/20 dark:border-gray-700/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 border border-white/20 dark:border-gray-700/50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Bridge Domain</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Select networks to bridge your domain to.</p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-500">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {mockChains.map(chain => (
              <div
                key={chain.id}
                className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 aspect-[3.25/4] flex flex-col
                  ${selectedChains.has(chain.id) ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'}`}
                onClick={() => handleChainClick(chain.id)}
                style={{ 
                  backgroundColor: chain.bgColor, 
                  backgroundImage: chain.bgGradient 
                }}
              >
                {/* Background pattern for some chains */}
                {chain.id === 'arbitrum' && (
                  <img 
                    className="inset-0 z-0 absolute h-full w-full mix-blend-overlay opacity-80" 
                    alt="Arbitrum One" 
                    src="https://superbridge.app/img/arbitrum-one/bg.png"
                  />
                )}
                
                <div className="flex gap-4 flex-col capitalize items-center justify-center px-3 md:px-6 grow w-full relative z-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                    <Image
                      src={chain.logo}
                      alt={chain.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 md:w-20 md:h-20"
                    />
                  </div>
                  <h3 className={`text-xs md:text-sm text-center font-heading z-10`} style={{ color: chain.textColor }}>
                    {chain.name}
                  </h3>
                </div>
                
                {selectedChains.has(chain.id) && (
                  <div className="absolute flex items-center justify-center bg-opacity-50">
                    <CheckCircle2 fill="#2734e6" className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBridge}
            disabled={selectedChains.size === 0}
            className={`px-5 py-2 rounded-md font-medium transition-colors ${
              selectedChains.size > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            Bridge Selected ({selectedChains.size})
          </button>
        </div>
      </div>
    </div>
  );
}


