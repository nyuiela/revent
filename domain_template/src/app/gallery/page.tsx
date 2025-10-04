"use client";

import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import WalletConnect from '@/components/WalletConnect';
import PermissionRequestModal from '@/components/PermissionRequestModal';
import InvestModal from '@/components/InvestModal';
import { useUser } from '@/contexts/UserContext';
import { MediaItem } from '@/components/MediaGrid';
import Image from 'next/image';
import GalleryGrid, { GalleryItem } from '@/components/GalleryGrid';

const mockMedia: MediaItem[] = [
  {
    id: '1',
    url: '/stream.jpg',
    title: 'Image_HD_Dec 15 2:30 PM_a1b2c3',
    price: 0.5,
    accessRights: 'read',
    owner: '0x1234...5678',
    createdAt: Date.now() - 86400000,
    requests: []
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
  },
  {
    id: '3',
    url: '/stream.jpg',
    title: 'Image_Low_Dec 13 1:45 PM_g7h8i9',
    price: 0.3,
    accessRights: 'ownership',
    owner: '0x5678...9012',
    createdAt: Date.now() - 259200000,
    requests: []
  }
];

export default function GalleryPage() {
  const { user } = useUser();
  const [filter, setFilter] = useState<'all' | 'images' | 'videos'>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showInvest, setShowInvest] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const filteredMedia = mockMedia.filter(media => {
    if (filter === 'all') return true;
    if (filter === 'images') return !media.file?.type.startsWith('video');
    if (filter === 'videos') return media.file?.type.startsWith('video');
    return true;
  });


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
          requester: '0x1234...5678', // This will be replaced with actual wallet address
          requesterName: user?.name || 'Anonymous',
          amount: data.amount,
          accessRights: data.accessRights,
          txHash: data.txHash
        })
      });

      if (response.ok) {
        setShowRequestModal(false);
        setSelectedMedia(null);
      }
    } catch (error) {
      console.error('Failed to submit request:', error);
    }
  };

  const handleMediaClick = (media: MediaItem) => {
    setSelectedMedia(media);
    setShowPreview(true);
  };

  return (
    <div className="min-h-screen p-6 bg-transparent overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Media Gallery</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInvest(true)}
            className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Invest in Event
          </button>
                  <WalletConnect />
          <ThemeToggle />
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          All Media
        </button>
        <button
          onClick={() => setFilter('images')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'images'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Images
        </button>
        <button
          onClick={() => setFilter('videos')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'videos'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Videos
        </button>
      </div>

      {/* Media Grid - extracted component for reliability */}
      <GalleryGrid
        items={filteredMedia.map<GalleryItem>((m) => ({
          id: m.id,
          url: m.url || '/stream.jpg',
          title: m.title || 'Untitled Media',
          price: m.price,
          isVideo: Boolean(m.file?.type.startsWith('video')),
        }))}
        onClickItem={(item) => {
          const media = filteredMedia.find((m) => m.id === item.id);
          if (media) handleMediaClick(media);
        }}
      />

      {/* Preview Modal */}
      {showPreview && selectedMedia && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl h-[80vh] flex overflow-hidden shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Media Preview */}
            <div className="flex-1 p-6 flex flex-col">
              <div className="relative flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                {selectedMedia.file?.type.startsWith('video') ? (
                  <video 
                    src={selectedMedia.url || '/stream.jpg'} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image 
                    src={selectedMedia.url || '/stream.jpg'}
                    alt={`${selectedMedia.title}`}
                    fill
                    sizes="90vw"
                    className="object-contain"
                    priority
                  />
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div className="font-medium text-lg mb-2">{selectedMedia.title}</div>
                <div>Owner: {selectedMedia.owner}</div>
                <div>Price: {selectedMedia.price} ETH</div>
                <div>Access Rights: {selectedMedia.accessRights}</div>
                <div>Created: {new Date(selectedMedia.createdAt || 0).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Action Panel */}
            <div className="w-80 bg-gray-50 dark:bg-gray-700 p-6 flex flex-col justify-between overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Request Access</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Access Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white">
                      <option value="read">Read Access</option>
                      <option value="write">Write Access</option>
                      <option value="ownership">Full Ownership</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Offer (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`${selectedMedia.price}`}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Message (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add a message to the owner..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => handleRequestPermission(selectedMedia)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Send Request
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invest Modal */}
      <InvestModal 
        isOpen={showInvest} 
        onClose={() => setShowInvest(false)}
      />

      {/* Permission Request Modal */}
      {selectedMedia && (
        <PermissionRequestModal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedMedia(null);
          }}
          mediaItem={{
            id: selectedMedia.id,
            title: selectedMedia.title || 'Untitled Media',
            price: selectedMedia.price || 0,
            accessRights: selectedMedia.accessRights || 'read'
          }}
          onSubmit={handleSubmitRequest}
          walletAddress="0x1234...5678"
          userName={user?.name}
        />
      )}
    </div>
  );
}
