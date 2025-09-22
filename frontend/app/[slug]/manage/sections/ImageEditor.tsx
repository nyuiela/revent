"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";

export default function ImageEditor() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("/hero.png");
  const [uploading, setUploading] = useState(false);

  const onPick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = URL.createObjectURL(file);
    setPreview(url);
    // here we could upload to IPFS/server
    await new Promise((r) => setTimeout(r, 600));
    setUploading(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl border-none border-border bg-card">
      <div className="relative aspect-[16/6] w-full bg-muted">
        <Image src={preview} alt="cover" fill className="object-cover" />
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm text-muted-foreground">Cover image</div>
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          <button onClick={onPick} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50">{uploading ? "Uploading..." : "Change"}</button>
          {/* <button className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50">Remove</button> */}
        </div>
      </div>
    </div>
  );
}


