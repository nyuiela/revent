"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphqlClient";
import { gql } from "graphql-request";
import Link from "next/link";
import MediaGrid, { MediaItem } from "@/components/MediaGrid";
import { useState } from "react";

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
    <div style={{ padding: 24 }}>
      {/* Hero */}
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          background: "linear-gradient(180deg, #ffffff, #f8fafc)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Event Tokenization Dashboard</h1>
            <p style={{ marginTop: 6, color: "#4b5563" }}>
              Manage domain assets, tokens, media, and participant interactions for your event.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/media" style={{ textDecoration: "none" }}>
              <button style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8 }}>Manage Media</button>
            </Link>
            <button style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8 }}>Tokenize Event</button>
          </div>
        </div>
      </section>

      {/* Chat + Quick Trade Actions */}
      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Event Chat</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6 }}>Permission Trade</button>
            <button style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6 }}>Buy</button>
          </div>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, height: 200, overflow: "auto", padding: 8, background: "#fafafa", marginBottom: 8 }}>
          {chatMessages.map((m) => (
            <div key={m.id} style={{ fontSize: 14, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: m.role === "user" ? "#111827" : "#6b7280" }}>{m.role === "user" ? "You" : "System"}:</span>
              <span style={{ marginLeft: 6 }}>{m.text}</span>
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
          style={{ display: "flex", gap: 8 }}
        >
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type message…"
            style={{ flex: 1, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6 }}
          />
          <button type="submit" style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6 }}>Send</button>
        </form>
      </section>

      {/* Stats */}
      <section style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Media Items</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{mediaItems.length}</div>
          </div>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Participants</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>0</div>
          </div>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Token Types</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{data?.names.items.reduce((acc, n) => acc + (n.tokens?.length ?? 0), 0) ?? 0}</div>
          </div>
        </div>
      </section>
      {isLoading && <p>Loading…</p>}
      {error && <p>Failed to load.</p>}
      {data && (
        <div style={{ display: "grid", gap: 16 }}>
          {data.names.items.map((item) => (
            <div key={item.name} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>Expires {new Date(item.expiresAt).toLocaleString()}</div>
                </div>
                <div style={{ fontSize: 12 }}>
                  <span style={{ padding: "2px 8px", background: item.transferLock ? "#fee2e2" : "#ecfeff", borderRadius: 12 }}>
                    Transfer Lock: {item.transferLock ? "On" : "Off"}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {item.nameservers.map((ns) => (
                  <span key={ns.ldhName} style={{ fontSize: 12, background: "#f3f4f6", padding: "2px 8px", borderRadius: 12 }}>{ns.ldhName}</span>
                ))}
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Tokens</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {item.tokens.map((token) => (
                    <div key={token.tokenId} style={{ fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 6, padding: 8 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600 }}>{token.chain.name}</span>
                        <span>Owner: {token.ownerAddress}</span>
                        <span>Token: {token.tokenAddress}</span>
                        <span>ID: {token.tokenId.slice(0, 8)}…</span>
                      </div>
                      <div style={{ color: "#6b7280", marginTop: 4 }}>
                        Created {new Date(token.createdAt).toLocaleString()} • Expires {new Date(token.expiresAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>DS Keys</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {item.dsKeys.map((k) => (
                    <div key={`${k.keyTag}-${k.digest}`} style={{ fontSize: 12, background: "#f9fafb", padding: 8, borderRadius: 6 }}>
                      Tag {k.keyTag} • Alg {k.algorithm} • Digest {k.digestType}: {k.digest.slice(0, 24)}…
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 24 }}>
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
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Participants & Interactions</h2>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <p style={{ color: "#6b7280", fontSize: 14 }}>No participants yet. Hook this to your events API to display registrations and engagement.</p>
        </div>
      </div>
    </div>
  );
}


