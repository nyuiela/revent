"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Users, Calendar, Loader2, RefreshCw } from "lucide-react"
import Footer from '../components/footer'

// Type definition for events from Graph Protocol
interface GraphEvent {
  id: string;
  title: string;
  username: string;
  lat: number;
  lng: number;
  isLive: boolean;
  avatarUrl: string;
  platforms?: string[];
  creator?: string;
  startTime?: string;
  endTime?: string;
  maxAttendees?: string;
  registrationFee?: string;
  blockTimestamp?: string;
  description?: string;
  category?: string;
  locationName?: string;
  viewers?: number;
}

// Function to format timestamp to readable date
function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Function to format timestamp to readable time
function formatTime(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Function to get time range from start and end timestamps
function getTimeRange(startTime: string, endTime: string): string {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  return `${start} - ${end}`;
}

const EventsPage = () => {
  const [events, setEvents] = useState<GraphEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/events/graph');
      const data = await response.json();

      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        setError('No events found');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="h-screen text-foreground bg-background relative z-[20] pt-10">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading events...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-foreground bg-background relative z-[20] pt-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground bg-background relative z-[20] pt-10">
      {/* Header */}
      <div className="top-0 z-40 bg-transparent border-none">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Events</h1>
            <p className="text-sm text-muted-foreground">
              {events.length} event{events.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/e/create"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              Create Event
            </Link>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="p-4 space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--events-foreground-muted)] mb-4">No events found</p>
            <Link
              href="/e/create"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              Create the first event
            </Link>
          </div>
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              href={`/e/${event.id}`}
              className="block border-b border-border rounded-xl p-4 bg-card/50 hover:bg-card transition-colors"
            >
              <div className="flex gap-4">
                {/* Event Image */}
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.avatarUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  {event.isLive && (
                    <div className="absolute top-1 left-1 bg-destructive text-destructive-foreground text-xs px-1 py-0.5 rounded">
                      LIVE
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold truncate">{event.title}</h3>
                    <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full ml-2 flex-shrink-0">
                      {event.category || 'Event'}
                    </span>
                  </div>

                  <p className="text-[12px] text-muted-foreground mb-3 line-clamp-2 text-ellipsis">
                    {event.description || 'No description available'}
                  </p>

                  <div className="flex items-end gap-4 text-xs text-muted-foreground">
                    {event.startTime && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTimestamp(event.startTime)}
                      </div>
                    )}
                    {event.startTime && event.endTime && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {getTimeRange(event.startTime, event.endTime)}
                      </div>
                    )}
                    {event.maxAttendees && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.viewers || 0}/{event.maxAttendees}
                      </div>
                    )}
                  </div>

                  {/* Creator info */}
                  <div className="mt-2 text-xs text-[var(--events-foreground-muted)]">
                    by @{event.username}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      <Footer />
    </div>
  )
}

export default EventsPage