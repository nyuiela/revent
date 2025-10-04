"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphqlClient";
import { gql } from "graphql-request";
import MediaGrid, { MediaItem } from "@/components/MediaGrid";
import ThemeToggle from "@/components/ThemeToggle";
import UserLogin from "@/components/UserLogin";
import BridgeModal from "@/components/BridgeModal";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";
import Image from "next/image";
import PixelBlastBackground from "@/components/PixelBlastBackground";
import Link from "next/link";
// import ethAccra from "../../../public/illustration.svg"

type Nameserver = { ldhName: string };
type Chain = { name: string };
type Token = {
  chain: Chain;
  ownerAddress: string;
  tokenAddress: string;
  tokenId: string;
  createdAt: string;
  expiresAt: string;
  networkId: string;
  openseaCollectionSlug?: string | null;
  orderbookDisabled?: boolean | null;
  startsAt?: string | null;
  type: string;
};
type DsKey = { algorithm: number; digest: string; digestType: number; keyTag: number };
type NameItem = {
  name: string;
  nameservers: Nameserver[];
  expiresAt: string;
  tokenizedAt: string;
  transferLock: boolean;
  tokens: Token[];
  isFractionalized: boolean;
  eoi: boolean;
  claimedBy: string;
  dsKeys: DsKey[];
};

type QueryResponse = { names: { items: NameItem[] } };

const namesQuery = gql`{
  names {
    items {
      name
      nameservers {
        ldhName
      }
      expiresAt
      tokenizedAt
      transferLock
      tokens {
        chain {
          name
        }
        ownerAddress
        tokenAddress
        tokenId
        createdAt
        expiresAt
        networkId
        openseaCollectionSlug
        orderbookDisabled
        ownerAddress
        startsAt
        type
      }
      isFractionalized
      eoi
      claimedBy
      dsKeys {
        algorithm
        digest
        digestType
        keyTag
      }
      fractionalTokenInfo {
        address
        boughtOutAt
        boughtOutBy
        boughtOutTxHash
        buyoutPrice
        chain {
          name
        }
        fractionalizedAt
        fractionalizedBy
        fractionalizedTxHash
        id
        launchpadAddress
        poolAddress
        status
        vestingWalletAddress
        params {
          finalLaunchpadPrice
          initialLaunchpadPrice
          initialPoolPrice
          initialValuation
          launchEndDate
          launchStartDate
          launchpadData
          launchpadFeeBps
          launchpadSupply
          launchpadType
          name
          poolFeeBps
          poolSupply
          symbol
          totalSupply
          vestingCliffSeconds
          vestingDurationSeconds
          decimals
        }
      }
    }
  }
}`


export default function DashboardPage() {
  const { user } = useUser();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: "user" | "system"; text: string }>>([
    { id: "m1", role: "system", text: "Welcome to your event dashboard. Discuss, negotiate, and coordinate here." },
  ]);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);

  // Show login modal if user is not authenticated
  useEffect(() => {
    if (!user?.isAuthenticated) {
      setShowUserLogin(true);
    }
  }, [user]);
  const { data, isLoading, error } = useQuery({
    queryKey: ["domain-data"],
    queryFn: async () => {
      console.log('Fetching domain data...');
      try {
        const result = await graphqlClient.request<QueryResponse>(namesQuery);
        console.log('Domain data fetched successfully:', result);
        return result;
      } catch (err) {
        console.error('GraphQL query failed:', err);
        // Return empty data structure as fallback
        return { names: { items: [] } } as QueryResponse;
      }
    },
    retry: 2,
    retryDelay: 2000,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return (
    <div className="min-h-screen p-6 bg-transparent overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
      {/* Header with Theme Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Domain Dashboard</h1>
          {user?.isAuthenticated && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, {user.name}!
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <nav className="flex space-x-4">
            <a href="/permissions" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Permissions
            </a>
            <a href="/gallery" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Gallery
            </a>
            <a href="/dashboard/revenue" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Revenue
            </a>
          </nav>
          <ThemeToggle />
        </div>
      </div>
      {/* Hero */}
      <section className="bg-[#282233] border-4 border-gray-200 rounded-xl mb-4 h-[45vh]">
        <Image src="/illustration.svg" alt='hero' className="w-full h-full rounded-lg scale-[0.99] object-cover" width={192} height={192} unoptimized />
      </section>

      {/* Bridge Domain */}
      <section className="mb-10 mt-4">
        <button
          onClick={() => setIsBridgeModalOpen(true)}
          className="px-3 py-2 rounded-md border border-gray-200 hover:bg-black/20 hover:text-white"
        >
          Bridge Domain
        </button>
      </section>

      {/* <PixelBlastBackground 
            className="fixed inset-0 w-full h-full -mb-[720px]"
            style={{ height: '100vh' }}
          /> */}

      {/* Stats */}
      <section className="mb-4 mt-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          <div className="bg-transparent border border-gray-200 rounded-xl p-3">
            <div className="text-lg text-gray-500">Media Items</div>
            <div className="text-2xl font-bold">{mediaItems.length}</div>
          </div>
          <div className="bg-transparent border border-gray-200 rounded-xl p-3">
            <div className="text-lg text-gray-500">Participants</div>
            <div className="text-2xl font-bold">0</div>
          </div>
          <div className="bg-transparent border border-gray-200 rounded-xl p-3">
            <div className="text-lg text-gray-500">Token Types</div>
            <div className="text-2xl font-bold">{data?.names.items.reduce((acc, n) => acc + (n.tokens?.length ?? 0), 0) ?? 0}</div>
          </div>
        </div>
      </section>

      <BridgeModal isOpen={isBridgeModalOpen} onClose={() => setIsBridgeModalOpen(false)} />
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">Loading domain data...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">Failed to load domain data: {error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Show message when no data is available */}
      {!isLoading && !error && data && data.names.items.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-600">No domain data available. This is normal if you haven't created any domains yet.</p>
        </div>
      )}
      {/* {data && (
        <div className="grid gap-4">
          {data.names.items.map((item) => (
            <div key={item.name} className="bg-transparent border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-semibold">{item.name}</div>
                  <div className="text-gray-500 text-xs">Expires {new Date(item.expiresAt).toLocaleString()}</div>
                </div>
                <div className="text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${item.transferLock ? "bg-red-100" : "bg-blue-100"}`}>
                    Transfer Lock: {item.transferLock ? "On" : "Off"}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {item.nameservers.map((ns) => (
                  <span key={ns.ldhName} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{ns.ldhName}</span>
                ))}
              </div>

              <div className="mt-3">
                <div className="font-semibold mb-2">Tokens</div>
                <div className="grid gap-2">
                  {item.tokens.map((token) => (
                    <div key={token.tokenId} className="text-xs border border-gray-200 rounded-md p-2">
                      <div className="flex gap-3 items-center flex-wrap">
                        <span className="font-semibold">{token.chain.name}</span>
                        <span>Owner: {token.ownerAddress}</span>
                        <span>Token: {token.tokenAddress}</span>
                        <span>ID: {token.tokenId.slice(0, 8)}…</span>
                      </div>
                      <div className="text-gray-500 mt-1">
                        Created {new Date(token.createdAt).toLocaleString()} • Expires {new Date(token.expiresAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <div className="font-semibold mb-2">DS Keys</div>
                <div className="grid gap-2">
                  {item.dsKeys.map((k) => (
                    <div key={`${k.keyTag}-${k.digest}`} className="text-xs bg-gray-50 p-2 rounded-md">
                      Tag {k.keyTag} • Alg {k.algorithm} • Digest {k.digestType}: {k.digest.slice(0, 24)}…
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )} */}
      <div className="mt-6">
        <MediaGrid
          title="Event Media"
          items={mediaItems}
          setItemsExternal={setMediaItems}
          onUploadFiles={async () => {
            console.log('Upload files clicked');
            // future IPFS upload integration
          }}
          onRequestDownload={async (item) => {
            console.log('Download requested for:', item);
            // future permission trading flow
          }}
        />
      </div>
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Participants & Interactions</h2>
        <div className="bg-transparent border border-gray-200 rounded-lg p-3">
          <p className="text-gray-500 text-sm">No participants yet. Hook this to your events API to display registrations and engagement.</p>
        </div>
      </div>


      {/* Chat + Quick Trade Actions */}
      <section className="bg-transparent border-gray-200 rounded-xl p-4 px-0 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold m-0">Event Chat</h2>
          <div className="flex gap-2">
            <button className="px-2.5 py-1.5 border cursor-pointer hover:bg-gray-100 hover:text-gray-900 border-gray-200 rounded-md">
              <Link href="/permissions">Permission Trade</Link>
            </button>
            <button className="px-2.5 py-1.5 border cursor-pointer hover:bg-gray-100 hover:text-gray-900 border-gray-200 rounded-md">Buy</button>
          </div>
        </div>
        <div className="bg-transparent border border-gray-200 rounded-lg h-50 overflow-auto p-2 mb-2">
          {chatMessages.map((m) => (
            <div key={m.id} className="text-sm mb-1.5">
              <span className={`font-semibold ${m.role === "user" ? "text-gray-900" : "text-gray-500"}`}>{m.role === "user" ? "You" : "System"}:</span>
              <span className="ml-1.5">{m.text}</span>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const txt = chatInput.trim();
            if (!txt) return;
            setChatMessages((prev) => [{ id: `m-${Date.now()}`, role: "user", text: txt }, ...prev]);
            setChatInput("");
          }}
          className="flex gap-2"
        >
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type message…"
            className="flex-1 px-2.5 py-2 border border-gray-200 rounded-md"
          />
          <button type="submit" className="px-3 py-2 border cursor-pointer hover:bg-gray-100 hover:text-gray-900 border-gray-200 rounded-md">Send</button>
        </form>
      </section>

      {/* User Login Modal */}
      {showUserLogin && (
        <UserLogin
          onClose={() => setShowUserLogin(false)}
        />
      )}
    </div>
  );
}


