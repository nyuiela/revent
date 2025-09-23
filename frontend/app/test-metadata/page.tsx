"use client";

import { useState } from 'react';
import {
  generateEventMetadataJSON,
  getEventMetadataUrl,
  generateAndUploadTokenMetadata
} from '@/lib/event-metadata';
import { generateTokenId as generateTokenIdUtil } from '@/lib/token-id-generator';
import { EventFormData } from '@/utils/types';

export default function TestMetadataPage() {
  const [eventId, setEventId] = useState('1');
  const [metadata, setMetadata] = useState<string | null>(null);
  const [metadataUrl, setMetadataUrl] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string>('');
  const [ipfsResult, setIpfsResult] = useState<{
    success: boolean;
    tokenId?: string;
    metadataUri?: string;
    cid?: string;
    error?: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Sample event data for testing
  const sampleEventData = {
    title: "Web3 Developer Meetup",
    description: "Join us for an exciting evening of Web3 development discussions, networking, and hands-on workshops. Learn about the latest trends in blockchain development, DeFi protocols, and NFT innovations.",
    startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString().slice(0, 16),
    location: "San Francisco, CA",
    coordinates: { lat: 37.7749, lng: -122.4194 },
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&crop=center",
    category: "Technology",
    maxParticipants: 150,
    isLive: false,
    platforms: ["Zoom", "Discord"],
    totalRewards: 100,
    eventType: "In-Person" as const,
    onlinePlatformLink: "",
    hosts: [
      { name: "Alice Johnson", role: "Organizer", avatar: "" },
      { name: "Bob Smith", role: "Speaker", avatar: "" }
    ],
    agenda: [
      { id: "agenda-1", title: "Opening Keynote", description: "Welcome and introduction to Web3", startTime: "18:00", endTime: "18:30", speakers: ["Alice Johnson"] },
      { id: "agenda-2", title: "DeFi Deep Dive", description: "Understanding decentralized finance", startTime: "18:30", endTime: "19:30", speakers: ["Bob Smith"] },
      { id: "agenda-3", title: "Networking Session", description: "Connect with fellow developers", startTime: "19:30", endTime: "21:00", speakers: [] }
    ],
    sponsors: [
      { name: "Web3 Foundation", logo: "https://example.com/sponsor1.png", link: "https://web3.foundation" },
      { name: "Ethereum Foundation", logo: "https://example.com/sponsor2.png", link: "https://ethereum.org" }
    ],
    tickets: {
      available: true,
      types: [
        { type: "VIP", price: 0.1, currency: "ETH", quantity: 20, perks: ["Front row seat", "Exclusive networking"] },
        { type: "General", price: 0.05, currency: "ETH", quantity: 100, perks: [] },
        { type: "Student", price: 0.02, currency: "ETH", quantity: 30, perks: ["Student discount"] }
      ]
    },
    socialLinks: {
      twitter: "https://twitter.com/web3meetup",
      discord: "https://discord.gg/web3meetup",
      website: "https://web3meetup.com"
    },
    slug: "web3-developer-meetup",
    // Required fields for EventFormData
    date: '',
    time: '',
    tempHost: { name: "", role: "" },
    tempAgenda: { title: "", description: "", startTime: "", endTime: "", speakers: [] },
    tempTicket: { type: "", price: 0, currency: "USD", quantity: 0, perks: [] }
  };

  const generateMetadata = () => {
    console.log('Generating metadata for event ID:', eventId);
    console.log('Current origin:', typeof window !== 'undefined' ? window.location.origin : 'server-side');

    try {
      const generatedMetadata = generateEventMetadataJSON(eventId, sampleEventData as EventFormData);
      const url = getEventMetadataUrl(eventId);

      console.log('Generated metadata:', generatedMetadata);
      console.log('Metadata URL:', url);

      setMetadata(generatedMetadata);
      setMetadataUrl(url);
    } catch (error) {
      console.error('Error generating metadata:', error);
      setMetadata(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const generateTokenId = () => {
    // Generate token ID from current event ID
    const eventNumber = parseInt(eventId, 10);
    if (isNaN(eventNumber) || eventNumber < 1) {
      alert('Event ID must be a valid number >= 1');
      return;
    }

    const newTokenId = generateTokenIdUtil(eventNumber);
    setTokenId(newTokenId);
    console.log('Generated token ID for event', eventNumber, ':', newTokenId);
  };

  const uploadToIPFS = async () => {
    if (!tokenId) {
      alert('Please generate a token ID first');
      return;
    }

    setIsUploading(true);
    try {
      console.log('Uploading token metadata to IPFS...');
      const result = await generateAndUploadTokenMetadata(eventId, sampleEventData);

      if (result.success) {
        setIpfsResult(result);
        console.log('✅ Token metadata uploaded successfully:', result);
      } else {
        console.error('❌ Upload failed:', result.error);
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Event Metadata Generator Test</h1>
        <p className="text-muted-foreground mb-6">
          This will generate ERC1155 compliant metadata for events.
          In development, metadata will be available at <code>{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/metadata/{eventId}</code>
        </p>

        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Token ID Format</h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            Token IDs are 64-character hex representations of sequential numbers:
          </p>
          <div className="space-y-1 text-xs font-mono text-yellow-700 dark:text-yellow-300">
            <div>Event 1: <code>0000000000000000000000000000000000000000000000000000000000000001</code></div>
            <div>Event 2: <code>0000000000000000000000000000000000000000000000000000000000000002</code></div>
            <div>Event 3: <code>0000000000000000000000000000000000000000000000000000000000000003</code></div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Event ID:</label>
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            placeholder="Enter event ID"
          />
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={generateMetadata}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Generate Metadata
          </button>
          <button
            onClick={generateTokenId}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Token ID
          </button>
          <button
            onClick={uploadToIPFS}
            disabled={!tokenId || isUploading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload to IPFS'}
          </button>
        </div>

        {tokenId && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Generated Token ID (64-char hex):</h3>
            <code className="text-sm text-blue-800 dark:text-blue-200 break-all">{tokenId}</code>
          </div>
        )}

        {ipfsResult && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">✅ IPFS Upload Successful!</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Token ID:</strong> <code className="text-green-800 dark:text-green-200">{ipfsResult.tokenId}</code></div>
              <div><strong>Metadata URI:</strong> <code className="text-green-800 dark:text-green-200 break-all">{ipfsResult.metadataUri}</code></div>
              <div><strong>CID:</strong> <code className="text-green-800 dark:text-green-200">{ipfsResult.cid}</code></div>
            </div>
          </div>
        )}

        {metadataUrl && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Metadata URL:</h3>
            <a
              href={metadataUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {metadataUrl}
            </a>
          </div>
        )}

        {metadata && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-inner">
            <h2 className="text-xl font-semibold mb-2">Generated Metadata JSON:</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 overflow-auto max-h-96">
              {metadata}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}