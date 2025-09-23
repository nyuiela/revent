"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

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

type Row = {
  rank: string;
  name: string;
  earnings: string;
  attendees: number;
  avatar?: string;
  trend?: "up" | "down" | null;
};

export default function Leaderboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/events/graph?limit=50');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch events');
        }

        // Sort events by maxAttendees (participants) in descending order
        const sortedEvents = (data.events || []).sort((a: Event, b: Event) => {
          const attendeesA = parseInt(a.maxAttendees) || 0;
          const attendeesB = parseInt(b.maxAttendees) || 0;
          return attendeesB - attendeesA;
        });

        setEvents(sortedEvents);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Loading leaderboard...</p>
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
        <p className="text-muted-foreground">No events found</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-[100px_1fr_100px] border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
        <div>RANK</div>
        <div>EVENT</div>
        <div className="text-right">ATTENDEES</div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {events.map((event, idx) => {
          const attendees = parseInt(event.maxAttendees) || 0;
          const rank = idx + 1;
          
          return (
            <div
              key={event.id}
              className="grid grid-cols-[100px_1fr_100px] items-center px-4 py-4 odd:bg-background"
            >
              <div className="text-sm font-semibold text-muted-foreground">#{rank}</div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
                  <Image 
                    src={event.avatarUrl || "/icon.png"} 
                    alt={event.title} 
                    width={40} 
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold text-clip">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {event.isLive ? "🔴 Live" : "⏸ Not Live"} • by {event.creator.slice(0, 6)}...{event.creator.slice(-4)}
                  </div>
                </div>
              </div>
              <div className="text-right text-base font-bold">{attendees.toLocaleString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


