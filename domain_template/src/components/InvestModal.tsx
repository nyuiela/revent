"use client";

import { useState } from 'react';
import { useWallet } from '@/components/WalletProvider';
import { useNotifications } from '@/components/NotificationSystem';

export default function InvestModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isConnected, address, connect } = useWallet();
  const { addNotification } = useNotifications();
  const [investAmount, setInvestAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
          aria-label="Close invest"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-2">Invest in Event</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Support this event by investing a chosen amount.</p>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (ETH)</label>
          <input
            type="number"
            min="0"
            step="0.001"
            value={investAmount}
            onChange={(e) => setInvestAmount(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.05"
          />
          {!isConnected ? (
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
              className="w-full mt-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Connect Wallet to Invest
            </button>
          ) : (
            <>
              {address && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  From: {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              )}
              <button
                onClick={async () => {
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
                        amount: parseFloat(investAmount) || 0,
                        txHash: mockTxHash,
                        investor: address
                      }),
                    });

                    addNotification({
                      type: 'success',
                      title: 'Investment Successful!',
                      message: `Successfully invested ${investAmount} ETH in MOONSHOT 2025`,
                      txHash: mockTxHash,
                      duration: 8000
                    });

                    onClose();
                    setInvestAmount('');
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
                }}
                disabled={!investAmount || isProcessing}
                className="w-full mt-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Investment...</span>
                  </>
                ) : (
                  <span>Invest {investAmount || '0'} ETH</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
