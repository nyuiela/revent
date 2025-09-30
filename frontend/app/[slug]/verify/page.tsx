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
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const code = useMemo(() => search?.get("code") || "", [search]);

  useEffect(() => {
    if (code) setDecoded(pseudoDecrypt(code));
  }, [code]);

  // Fetch event data using slug
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const { slug } = await params;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000' || 'http://localhost:3001';
        const response = await fetch(`${baseUrl}/api/events/slug/${slug}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch event');
        }

        if (data.event) {
          setEventData(data.event);
          console.log('Event data for verification:', data.event);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch event');
        setEventData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-foreground flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-foreground flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Event</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground flex justify-center items-center">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 flex flex-col justify-center items-center">
        <h1 className="text-lg font-semibold">Verify Attendance</h1>
        <p className="text-sm text-muted-foreground">
          {eventData ? `Event: ${eventData.title || 'Unknown Event'}` : 'This page will pop a confirmation modal for attendees.'}
        </p>
        <Button onClick={() => setOpen(true)} className="mt-4 bg-indigo-600 text-background hover:bg-indigo-600/90">
          Click to verify attendance
        </Button>
      </div>

      <VerifyModal
        isOpen={open}
        code={decoded}
        eventId={eventData?.id}
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


