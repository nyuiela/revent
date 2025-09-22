"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/app/components/DemoComponents";
import { useAccount } from "wagmi";

type Event = {
  id: string;
  title: string;
  username: string;
  slug: string;
  avatarUrl: string;
  creator: string;
  isLive: boolean;
  startTime: string;
  endTime: string;
  maxAttendees: string;
  registrationFee: string;
  blockTimestamp: string;
};

export default function EventBoard() {
  const { address } = useAccount();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserEvents = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/events/creator/${address}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch events');
        }

        setEvents(data.events || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching user events:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserEvents();
  }, [address]);

  if (!address) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Please connect your wallet to view your events</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Loading your events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">You haven't created any events yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-[100px_1fr_100px] border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
        <div>EVENT</div>
        <div className="">TITLE</div>
        <div className="text-right">MANAGE</div>
      </div>
      <div>
        {events.map((event, idx) => (
          <div
            key={event.id}
            className="grid grid-cols-[100px_1fr_100px] items-center px-6 py-4 odd:bg-background"
          >
            <div className="text-sm font-semibold text-muted-foreground">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-border bg-muted">
                <Image src={event.avatarUrl || "/icon.png"} alt="event" className="h-full w-full object-cover" height={64} width={64} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <div className="font-semibold">{event.title}</div>
                <div className="text-xs text-muted-foreground">
                  {event.isLive ? "🔴 Live" : "⏸ Not Live"} • {event.maxAttendees} max
                </div>
              </div>
            </div>
            <div className="text-right text-base font-bold">
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-sm bg-muted rounded-md px-2 py-1"
                onClick={() => window.open(`/${event.slug}/manage`, '_blank')}
              >
                manage
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


