"use client";

import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { MediaItem, PermissionRequest } from '@/components/MediaGrid';

const mockMedia: MediaItem[] = [
  {
    id: '1',
    url: '/icon.png',
    title: 'Image_HD_Dec 15 2:30 PM_a1b2c3',
    price: 0.5,
    accessRights: 'read',
    owner: '0x1234...5678',
    createdAt: Date.now() - 86400000,
    requests: [
      {
        id: 'req1',
        requester: '0x9876...5432',
        amount: 0.6,
        accessRights: 'ownership',
        status: 'pending',
        createdAt: Date.now() - 3600000
      }
    ]
  },
  {
    id: '2',
    url: '/icon.png',
    title: 'Video_SD_Dec 14 4:15 PM_d4e5f6',
    price: 1.2,
    accessRights: 'write',
    owner: '0xabcd...efgh',
    createdAt: Date.now() - 172800000,
    requests: []
  }
];

const mockTransfers = [
  {
    id: 'transfer1',
    mediaId: '1',
    from: '0x1234...5678',
    to: '0x9876...5432',
    amount: 0.6,
    timestamp: Date.now() - 1800000,
    txHash: '0xabc123...def456'
  },
  {
    id: 'transfer2',
    mediaId: '2',
    from: '0xabcd...efgh',
    to: '0x5678...9012',
    amount: 1.2,
    timestamp: Date.now() - 7200000,
    txHash: '0xdef456...ghi789'
  }
];

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'transfers'>('requests');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const handleApproveRequest = (requestId: string) => {
    console.log('Approving request:', requestId);
  };

  const handleRejectRequest = (requestId: string) => {
    console.log('Rejecting request:', requestId);
  };

  return (
    <div className="min-h-screen p-6 bg-transparent overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Permissions Dashboard</h1>
        <ThemeToggle />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Permission Requests
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'transfers'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Ownership Transfers
        </button>
      </div>

      {/* Content */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Pending Requests</h2>
          
          {mockMedia.map((media) => (
            <div key={media.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img src={media.url} alt={media.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{media.title}</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    <div>Owner: {media.owner}</div>
                    <div>Current Price: {media.price} ETH</div>
                    <div>Access Rights: {media.accessRights}</div>
                  </div>
                  
                  {media.requests && media.requests.length > 0 ? (
                    <div className="space-y-3">
                      {media.requests.map((request) => (
                        <div key={request.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {request.requester}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                Offering: {request.amount} ETH for {request.accessRights} access
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              request.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {/* {request.status} */}
                            </span>
                          </div>
                          {/* <div className="flex space-x-2 mt-3">
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </div> */}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-sm">No pending requests</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Transfers</h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Media
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {mockTransfers.map((transfer) => (
                    <tr key={transfer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                            <img src="/icon.png" alt="Media" className="w-full h-full object-cover" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {mockMedia.find(m => m.id === transfer.mediaId)?.title || 'Unknown Media'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {transfer.from}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {transfer.to}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {transfer.amount} ETH
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                        <a href={`https://etherscan.io/tx/${transfer.txHash}`} target="_blank" rel="noopener noreferrer">
                          {transfer.txHash.slice(0, 10)}...
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transfer.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
