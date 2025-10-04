'use client';

import { useEventData } from '@/hooks/useEventData';
import { useWallet } from '@/components/WalletProvider';

export default function EventDataDisplay() {
  const { address } = useWallet();
  const { data, isLoading, error, refetch } = useEventData(address || undefined);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading event data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-red-700">Failed to load event data</span>
        </div>
        <button
          onClick={() => refetch()}
          className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <p className="text-gray-600">No event data available</p>
      </div>
    );
  }

  const formatWeiToEth = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(6);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getEventStatusText = (status: number) => {
    const statusMap: { [key: number]: string } = {
      0: 'Draft',
      1: 'Active',
      2: 'Paused',
      3: 'Completed',
      4: 'Cancelled',
    };
    return statusMap[status] || 'Unknown';
  };

  const getDomaStatusText = (status: number) => {
    const statusMap: { [key: number]: string } = {
      0: 'Not Created',
      1: 'Created',
      2: 'Minted',
      3: 'Transferred',
    };
    return statusMap[status] || 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Event Data</h3>
        <button
          onClick={() => refetch()}
          className="text-blue-600 hover:text-blue-800 transition-colors"
          title="Refresh data"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Event Info */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2">Basic Info</h4>

          <div>
            <span className="text-sm text-gray-600">Event ID:</span>
            <span className="ml-2 font-medium">{data.eventId}</span>
          </div>

          <div>
            <span className="text-sm text-gray-600">Exists:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${data.eventExists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {data.eventExists ? 'Yes' : 'No'}
            </span>
          </div>

          <div>
            <span className="text-sm text-gray-600">Status:</span>
            <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
              {getEventStatusText(data.eventStatus)}
            </span>
          </div>

          <div>
            <span className="text-sm text-gray-600">Creator:</span>
            <span className="ml-2 font-mono text-sm">{formatAddress(data.eventCreator)}</span>
          </div>
        </div>

        {/* Investment Data */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2">Investment Data</h4>

          <div>
            <span className="text-sm text-gray-600">Total Invested:</span>
            <span className="ml-2 font-medium">{formatWeiToEth(data.totalInvested)} ETH</span>
          </div>

          <div>
            <span className="text-sm text-gray-600">Revenue Accrued:</span>
            <span className="ml-2 font-medium">{formatWeiToEth(data.revenueAccrued)} ETH</span>
          </div>

          <div>
            <span className="text-sm text-gray-600">Investors Count:</span>
            <span className="ml-2 font-medium">{data.eventInvestors.length}</span>
          </div>

          {address && (
            <div>
              <span className="text-sm text-gray-600">Your Share:</span>
              <span className="ml-2 font-medium">{formatWeiToEth(data.investorShareBalance)} ETH</span>
            </div>
          )}
        </div>

        {/* DOMA Token Data */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2">DOMA Token</h4>

          <div>
            <span className="text-sm text-gray-600">Token ID:</span>
            <span className="ml-2 font-medium">{data.domaTokenId.toString()}</span>
          </div>

          <div>
            <span className="text-sm text-gray-600">Status:</span>
            <span className="ml-2 px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
              {getDomaStatusText(data.domaStatus)}
            </span>
          </div>

          {address && (
            <>
              <div>
                <span className="text-sm text-gray-600">Revenue Claimed:</span>
                <span className="ml-2 font-medium">{formatWeiToEth(data.revenueClaimed)} ETH</span>
              </div>

              <div>
                <span className="text-sm text-gray-600">Is Investor:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${data.isInvestor ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {data.isInvestor ? 'Yes' : 'No'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Investors List */}
      {data.eventInvestors.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-800 border-b pb-2 mb-3">Event Investors</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.eventInvestors.map((investor, index) => (
              <div key={index} className="bg-gray-50 rounded px-3 py-2">
                <span className="font-mono text-sm">{formatAddress(investor)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


