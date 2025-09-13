"use client";

import { useState } from 'react';

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
        <h1 className="text-2xl font-bold">Revenue</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Gross Revenue</div>
          <div className="text-xl font-semibold">{totals.grossEth} ETH</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Fees</div>
          <div className="text-xl font-semibold">{totals.feesEth} ETH</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Net Revenue</div>
          <div className="text-xl font-semibold">{totals.netEth} ETH</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Available to Claim</div>
          <div className="text-xl font-semibold">{totals.claimsAvailableEth} ETH</div>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Claim Revenue</div>
            <div className="text-sm text-gray-500">Withdraw available funds to your wallet</div>
          </div>
          <button
            onClick={handleClaim}
            disabled={isClaiming || claimed || totals.claimsAvailableEth <= 0}
            className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
          >
            {claimed ? 'Claimed' : isClaiming ? 'Claiming…' : `Claim ${totals.claimsAvailableEth} ETH`}
          </button>
        </div>
      </div>
    </div>
  );
}


