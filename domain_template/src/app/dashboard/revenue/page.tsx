"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RevenuePage() {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const totals = {
    grossEth: 12.34,
    feesEth: 0.78,
    netEth: 11.56,
    claimsAvailableEth: 3.21,
  };

  async function handleClaim() {
    setIsClaiming(true);
    try {
      // wire onchain claim here
      await new Promise((r) => setTimeout(r, 1200));
      setClaimed(true);
    } finally {
      setIsClaiming(false);
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard" 
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Revenue</h1>
        <div></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Gross Revenue</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{totals.grossEth} ETH</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Fees</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{totals.feesEth} ETH</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Net Revenue</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{totals.netEth} ETH</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Available to Claim</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{totals.claimsAvailableEth} ETH</div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Claim Revenue</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Withdraw available funds to your wallet</div>
          </div>
          <button
            onClick={handleClaim}
            disabled={isClaiming || claimed || totals.claimsAvailableEth <= 0}
            className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {claimed ? 'Claimed' : isClaiming ? 'Claiming…' : `Claim ${totals.claimsAvailableEth} ETH`}
          </button>
        </div>
      </div>
    </div>
  );
}


