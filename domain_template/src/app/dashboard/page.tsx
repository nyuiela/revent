"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphqlClient";
import { gql } from "graphql-request";
import MediaGrid, { MediaItem } from "@/components/MediaGrid";
import { useState } from "react";
import Image from "next/image";
import ethAccra from "../../../public/illustration.svg"

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
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: "user" | "system"; text: string }>>([
    { id: "m1", role: "system", text: "Welcome to your event dashboard. Discuss, negotiate, and coordinate here." },
  ]);
  const { data, isLoading, error } = useQuery({
    queryKey: ["domain-data"],
    queryFn: () => graphqlClient.request<QueryResponse>(namesQuery),
  });

  return (
    <div className="p-6 bg-transparent">
      {/* Hero */}
      <section className="bg-amber-300 border border-gray-200 rounded-xl mb-4 h-[45vh]">
        <Image src={ethAccra} alt='hero' className="w-full h-full object-cover" />

      </section>


      {/* Stats */}
      <section className="mb-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          <div className="bg-transparent border border-gray-200 rounded-xl p-3">
            <div className="text-xs text-gray-500">Media Items</div>
            <div className="text-2xl font-bold">{mediaItems.length}</div>
          </div>
          <div className="bg-transparent border border-gray-200 rounded-xl p-3">
            <div className="text-xs text-gray-500">Participants</div>
            <div className="text-2xl font-bold">0</div>
          </div>
          <div className="bg-transparent border border-gray-200 rounded-xl p-3">
            <div className="text-xs text-gray-500">Token Types</div>
            <div className="text-2xl font-bold">{data?.names.items.reduce((acc, n) => acc + (n.tokens?.length ?? 0), 0) ?? 0}</div>
          </div>
        </div>
      </section>
      {isLoading && <p className="text-gray-600">Loading…</p>}
      {error && <p className="text-red-600">Failed to load.</p>}
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
            // future IPFS upload integration
          }}
          onRequestDownload={async () => {
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
            <button className="px-2.5 py-1.5 border border-gray-200 rounded-md">Permission Trade</button>
            <button className="px-2.5 py-1.5 border border-gray-200 rounded-md">Buy</button>
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
          <button type="submit" className="px-3 py-2 border-gray-200 rounded-md">Send</button>
        </form>
      </section>

    </div>
  );
}


