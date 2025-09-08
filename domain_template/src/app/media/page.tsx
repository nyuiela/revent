"use client";

import Link from "next/link";
import MediaGrid, { MediaItem } from "@/components/MediaGrid";
import { useState } from "react";

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Event Media</h1>
        <Link href="/dashboard" style={{ textDecoration: "underline" }}>Dashboard</Link>
      </div>
      <MediaGrid
        items={items}
        setItemsExternal={setItems}
        onUploadFiles={async () => {
          // future IPFS upload
        }}
        onRequestDownload={async () => {
          // future permission trading flow
        }}
      />
    </div>
  );
}


