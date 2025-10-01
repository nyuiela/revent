"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/app/components/DemoComponents";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

type ManageEvent = {
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

interface EventBoardProps {
  onEventsLoaded?: (events: ManageEvent[]) => void;
}

export default function EventBoard({ onEventsLoaded }: EventBoardProps) {
  const { address } = useAccount();
  const router = useRouter();
  const [events, setEvents] = useState<ManageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(totalPages, Math.max(1, page));

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

        // Notify parent component that events are loaded
        if (onEventsLoaded) {
          onEventsLoaded(data.events || []);
        }
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
        <p className="text-muted-foreground">You haven&apos;t created any events yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-[60px_1fr_60px] border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
        <div>EVENT</div>
        <div className="">TITLE</div>
        <div className="text-right">MANAGE</div>
      </div>
      <div>
        {events
          .slice((safePage - 1) * pageSize, safePage * pageSize)
          .map((event, idx) => (
            <div
              key={event.id}
              className="grid grid-cols-[60px_1fr_60px] items-center px-6 py-4 odd:bg-background"
            >
              <div className="text-sm text-muted-foreground">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-border bg-muted">
                  <Image src={event.avatarUrl || "/icon.png"} alt="event" className="h-full w-full object-cover" height={64} width={64} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-semibold">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {event.isLive ? "Live" : "Not Live"} • {event.maxAttendees} max
                  </div>
                </div>
              </div>
              <div className="text-right text-base font-bold">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-muted rounded-md hover:bg-muted-hover cursor-pointer px-2 py-1"
                  onClick={() => router.push(`/${event.slug}/manage`)}
                >
                  manage
                </Button>
              </div>
            </div>
          ))}
        {/* Pagination Controls Row */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, events.length)} of {events.length}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="bg-muted rounded-md hover:bg-muted-hover cursor-pointer px-3 py-1 h-8 disabled:opacity-50"
              disabled={safePage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={safePage}
                onChange={(e) => {
                  const val = parseInt(e.target.value || '1', 10)
                  if (Number.isNaN(val)) return
                  setPage(Math.min(totalPages, Math.max(1, val)))
                }}
                className="w-14 h-8 rounded-md border border-border bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span>of {totalPages}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="bg-muted rounded-md hover:bg-muted-hover cursor-pointer px-3 py-1 h-8 disabled:opacity-50"
              disabled={safePage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


