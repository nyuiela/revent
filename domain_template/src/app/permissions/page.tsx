"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import WalletConnect from '@/components/WalletConnect';
import PermissionRequestModal from '@/components/PermissionRequestModal';
import { useUser } from '@/contexts/UserContext';
import Image from 'next/image';

interface PermissionRequest {
  id: string;
  mediaId: string;
  requester: string;
  requesterName: string;
  amount: number;
  accessRights: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  txHash?: string;
}

interface MediaItem {
  id: string;
  url: string;
  title: string;
  price: number;
  accessRights: string;
  owner: string;
  ownerName: string;
  createdAt: number;
  requests: PermissionRequest[];
}

const mockMedia: MediaItem[] = [
  {
    id: '1',
    url: '/stream.jpg',
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
    url: '/stream.jpg',
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
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'requests' | 'transfers'>('requests');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch media items and requests
  const fetchMediaItems = async () => {
    try {
      const response = await fetch('/api/permissions/requests');
      if (response.ok) {
        const data = await response.json();
        setMediaItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch media items:', error);
    }
  };

  // Poll for updates every 5 seconds
  useEffect(() => {
    fetchMediaItems();
    const interval = setInterval(fetchMediaItems, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
    setIsWalletConnected(true);
  };

  const handleWalletDisconnect = () => {
    setWalletAddress('');
    setIsWalletConnected(false);
  };

  const handleRequestPermission = (mediaItem: MediaItem) => {
    setSelectedMedia(mediaItem);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (data: { amount: number; accessRights: string; txHash: string }) => {
    try {
      const response = await fetch('/api/permissions/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: selectedMedia?.id,
          requester: walletAddress,
          requesterName: user?.name || 'Anonymous',
          amount: data.amount,
          accessRights: data.accessRights,
          txHash: data.txHash
        })
      });

      if (response.ok) {
        fetchMediaItems(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to submit request:', error);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setIsProcessing(true);
    
    // Simulate wallet transaction for approval
    setTimeout(async () => {
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      try {
        const response = await fetch('/api/permissions/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            action: 'approve',
            txHash: mockTxHash
          })
        });

        if (response.ok) {
          fetchMediaItems(); // Refresh data
        }
      } catch (error) {
        console.error('Failed to approve request:', error);
      }
      
      setIsProcessing(false);
    }, 2000);
  };

  const handleRejectRequest = async (requestId: string) => {
    setIsProcessing(true);
    
    // Simulate wallet transaction for rejection
    setTimeout(async () => {
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      try {
        const response = await fetch('/api/permissions/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            action: 'reject',
            txHash: mockTxHash
          })
        });

        if (response.ok) {
          fetchMediaItems(); // Refresh data
        }
      } catch (error) {
        console.error('Failed to reject request:', error);
      }
      
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen p-6 bg-transparent overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard" 
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Permissions Dashboard</h1>
        <div className="flex items-center space-x-4">
          <WalletConnect 
            onConnect={handleWalletConnect}
            onDisconnect={handleWalletDisconnect}
            isConnected={isWalletConnected}
            address={walletAddress}
          />
          <ThemeToggle />
        </div>
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Media Items & Requests</h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Auto-refreshing every 5 seconds
            </div>
          </div>
          
          {mediaItems.map((media) => (
            <div key={media.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <Image src={media.url || '/stream.jpg'} alt={`${media.title}`} className="w-full h-full object-cover" width={80} height={80} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{media.title}</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    <div>Owner: {media.ownerName} ({media.owner})</div>
                    <div>Current Price: {media.price} ETH</div>
                    <div>Access Rights: {media.accessRights}</div>
                  </div>
                  
                  {/* Request Permission Button */}
                  <div className="mb-4">
                    <button
                      onClick={() => handleRequestPermission(media)}
                      disabled={!isWalletConnected}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
                    >
                      {!isWalletConnected ? 'Connect Wallet to Request' : 'Request Permission'}
                    </button>
                  </div>
                  
                  {media.requests && media.requests.length > 0 ? (
                    <div className="space-y-3">
                      {media.requests.map((request) => (
                        <div key={request.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {request.requesterName} ({request.requester.slice(0, 6)}...{request.requester.slice(-4)})
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                Offering: {request.amount} ETH for {request.accessRights} access
                              </div>
                              {request.txHash && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  TX: {request.txHash.slice(0, 10)}...
                                </div>
                              )}
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              request.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : request.status === 'approved'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          {request.status === 'pending' && isWalletConnected && (
                            <div className="flex space-x-2 mt-3">
                              <button
                                onClick={() => handleApproveRequest(request.id)}
                                disabled={isProcessing}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                              >
                                {isProcessing ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                disabled={isProcessing}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                              >
                                {isProcessing ? 'Processing...' : 'Reject'}
                              </button>
                            </div>
                          )}
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
                            <Image src={transfer.mediaId === '1' ? '/stream.jpg' : '/stream.jpg'} alt="Media" className="w-full h-full object-cover" width={40} height={40} />
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

      {/* Permission Request Modal */}
      {selectedMedia && (
        <PermissionRequestModal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedMedia(null);
          }}
          mediaItem={selectedMedia}
          onSubmit={handleSubmitRequest}
          walletAddress={walletAddress}
          userName={user?.name}
        />
      )}
    </div>
  );
}
