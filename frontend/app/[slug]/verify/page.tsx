"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import VerifyModal from "./sections/VerifyModal";
import { Button } from "@/app/components/DemoComponents";

type Props = {
  params: Promise<{ slug: string }>;
};

// Simple placeholder crypto helpers (non-secure) — replace with real crypto later
function pseudoDecrypt(encoded: string): string {
  try {
    // try decode base64 first
    const txt = atob(encoded);
    return txt;
  } catch (_) {
    try {
      return decodeURIComponent(encoded);
    } catch (_e) {
      return encoded;
    }
  }
}

export default function VerifyPage({ params }: Props) {
  const search = useSearchParams();
  const [open, setOpen] = useState(true);
  const [decoded, setDecoded] = useState<string>("");

  const code = useMemo(() => search?.get("code") || "", [search]);

  useEffect(() => {
    if (code) setDecoded(pseudoDecrypt(code));
  }, [code]);

  return (
    <div className="min-h-screen bg-white text-foreground flex justify-center items-center">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 flex flex-col justify-center items-center">
        <h1 className="text-lg font-semibold">Verify Attendance</h1>
        <p className="text-sm text-muted-foreground">This page will pop a confirmation modal for attendees.</p>
        <Button onClick={() => setOpen(true)} className="mt-4 bg-indigo-600 text-background hover:bg-indigo-600/90">Click to verify attendance</Button>
      </div>

      <VerifyModal
        isOpen={open}
        code={decoded}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          console.log("confirm attendance with code", decoded);
          setOpen(false);
        }}
        onMint={() => {
          console.log("mint NFT after confirmation");
        }}
      />
    </div>
  );
}


