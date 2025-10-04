"use client";

import { useState } from 'react';

interface PermissionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: {
    id: string;
    title: string;
    price: number;
    accessRights: string;
  };
  onSubmit: (data: { amount: number; accessRights: string; txHash: string }) => void;
  walletAddress?: string;
  userName?: string;
}

export default function PermissionRequestModal({ 
  isOpen, 
  onClose, 
  mediaItem, 
  onSubmit, 
  walletAddress, 
  userName 
}: PermissionRequestModalProps) {
  const [amount, setAmount] = useState('');
  const [accessRights, setAccessRights] = useState('read');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);

    // Simulate wallet transaction
    setTimeout(() => {
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      onSubmit({
        amount: parseFloat(amount),
        accessRights,
        txHash: mockTxHash
      });
      setIsProcessing(false);
      onClose();
      setAmount('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          aria-label="Close"
        >
          ✕
        </button>
        
        <h2 className="text-xl font-semibold mb-4">Request Permission</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Media Item
            </label>
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
              {mediaItem.title}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Offer (ETH)
            </label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Min: ${mediaItem.price} ETH`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Access Rights
            </label>
            <select
              value={accessRights}
              onChange={(e) => setAccessRights(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="read">Read Only</option>
              <option value="write">Read & Write</option>
              <option value="ownership">Full Ownership</option>
            </select>
          </div>

          {walletAddress && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              From: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!amount || !walletAddress || isProcessing}
            className="w-full mt-4 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>Submit Request</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
