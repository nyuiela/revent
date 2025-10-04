"use client";

import { useState } from 'react';
import { MediaItem, PermissionRequest } from './MediaGrid';
import Image from 'next/image';

interface MediaCardProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem | null;
  allMedia: MediaItem[];
  onUpdateMedia: (updatedMedia: MediaItem) => void;
  onSelectMedia: (media: MediaItem) => void;
}

export default function MediaCard({
  isOpen,
  onClose,
  media,
  allMedia,
  onUpdateMedia,
  onSelectMedia
}: MediaCardProps) {
  const [name, setName] = useState(media?.title || '');
  const [price, setPrice] = useState(media?.price || 0);
  const [accessRights, setAccessRights] = useState<'read' | 'write' | 'ownership'>(media?.accessRights || 'read');
  const [ipfsHash, setIpfsHash] = useState(media?.ipfsHash || '');

  if (!isOpen || !media) return null;

  const handleSave = () => {
    const updatedMedia = {
      ...media,
      title: name,
      price,
      accessRights,
      ipfsHash
    };
    onUpdateMedia(updatedMedia);
    onClose();
  };

  const mockRequests: PermissionRequest[] = [
    {
      id: '1',
      requester: '0x1234...5678',
      amount: 0.5,
      accessRights: 'read',
      status: 'pending',
      createdAt: Date.now() - 3600000
    },
    {
      id: '2',
      requester: '0x9876...5432',
      amount: 1.2,
      accessRights: 'ownership',
      status: 'pending',
      createdAt: Date.now() - 7200000
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl h-[80vh] flex overflow-hidden shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Left Sidebar - Media List */}
        <div className="w-64 bg-gray-50 dark:bg-gray-700 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Media Library</h3>
          <div className="space-y-2">
            {allMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectMedia(item)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${item.id === media.id
                  ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                  : 'bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500'
                  }`}
              >
                <div className="aspect-square rounded overflow-hidden mb-2">
                  {item.file?.type.startsWith('video') ? (
                    <video src={item.url} className="w-full h-full object-cover" />
                  ) : (
                    <Image src={item.url} alt={item.title as string} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {item.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.price} ETH
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Media Preview */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1 bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden mb-4">
            {media.file?.type.startsWith('video') ? (
              <video
                src={media.url}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <Image
                src={media.url}
                alt={media.title as string}
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <div className="font-medium">{media.title}</div>
            <div>Owner: {media.owner}</div>
            <div>Created: {new Date(media.createdAt || 0).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Right Side - Form and Requests */}
        <div className="w-80 bg-gray-50 dark:bg-gray-700 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
          <div className="space-y-6">
            {/* Media Details Form */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Media Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Access Rights
                  </label>
                  <select
                    value={accessRights}
                    onChange={(e) => setAccessRights(e.target.value as 'read' | 'write' | 'ownership')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  >
                    <option value="read">Read Access</option>
                    <option value="write">Write Access</option>
                    <option value="ownership">Full Ownership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    IPFS Hash
                  </label>
                  <input
                    type="text"
                    value={ipfsHash}
                    onChange={(e) => setIpfsHash(e.target.value)}
                    placeholder="Qm..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Permission Requests */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Permission Requests</h3>
              <div className="space-y-3">
                {mockRequests.map((request) => (
                  <div key={request.id} className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {request.requester}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${request.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : request.status === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <div>Amount: {request.amount} ETH</div>
                      <div>Access: {request.accessRights}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(request.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
