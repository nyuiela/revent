"use client"
import React, { useMemo } from 'react'
import Link from 'next/link'
import { MapPin, Users, Calendar, Loader2, RefreshCw } from "lucide-react"
import Footer from '../components/footer'
// import OwnerDisplay from '../../components/OwnerDisplay'
import ViewCount from '../../components/ViewCount'
import { useEvents } from '../../hooks/useEvents'
import { useViewCounts } from '../../hooks/useViewCounts'
// import StreamHeader from '../components/StreamHeader'


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
  // Use React Query for events data
  const { data: events = [], isLoading: loading, error: eventsError, refetch } = useEvents();

  // Get view counts for all events (memoized to prevent unnecessary re-renders)
  const eventIds = useMemo(() => events.map(event => event.id), [events]);
  const { data: viewCounts = {}, isLoading: viewsLoading } = useViewCounts(eventIds);

  const error = eventsError ? (eventsError instanceof Error ? eventsError.message : 'Failed to fetch events') : null;

  if (loading) {
    return (
      <div className="h-screen text-[var(--events-foreground)] bg-black/80 relative z-[20] pt-10">
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
      <div className="min-h-screen text-[var(--events-foreground)] bg-black/80 relative z-[20] pt-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--events-accent)] text-white rounded-lg hover:bg-[var(--events-accent-hover)] transition-colors"
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
    <div className="min-h-screen text-[var(--events-foreground)] bg-events-background relative z-[20] pt-10 bg-[#F2F4F3]">
      {/* Header */}
      <div className="top-0 z-40 bg-transparent border-none">
        {/* <StreamHeader /> */}
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--events-foreground)]">Events</h1>
            <p className="text-[12px] text-gray-700 dark:text-gray-600">
              {events.length} event{events.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 bg-[var(--events-accent)]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/events/create"
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted-hover rounded-lg transition-colors"
            >
              Create Event
            </Link>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="p-4 space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--events-foreground-muted)] mb-4">No events found</p>
            <Link
              href="/events/create"
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--events-accent)] hover:bg-[var(--events-accent-hover)] rounded-lg transition-colors"
            >
              Create the first event
            </Link>
          </div>
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              href={`/${event.slug || event.id}`} // Use slug if available, fallback to ID
              className="block border-b-[1px] border-border rounded-xl p-4 bg-events-card-bg hover:bg-events-card-bg transition-colors"
            >
              <div className="flex gap-4 items-center justify-between">
                {/* Event Image */}
                <div className="relative w-[7rem] h-[7rem] rounded-lg overflow-hidden flex-shrink-0 bg-red-400">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.avatarUrl}
                    alt={event.title}
                    className="w-full h-full object-cover "
                  />
                  {event.isLive && (
                    <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                      LIVE
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold truncate">{event.title}</h3>
                    <span className="px-2 py-1 bg-muted text-muted-foreground text-[10px] rounded-full ml-2 flex-shrink-0">
                      {event.category || 'Event'}
                    </span>
                  </div>

                  <p className="text-[12px] text-foreground-muted mb-3 line-clamp-2 text-ellipsis">
                    {event.description || 'No description available'}
                  </p>

                  <div className="flex items-end gap-4 text-xs text-foreground-muted">
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
                        <ViewCount
                          count={viewCounts[event.id] || 0}
                          isLoading={viewsLoading}
                          size="sm"
                          showIcon={false}
                        />/{event.maxAttendees}
                      </div>
                    )}
                  </div>

                  {/* Creator info */}
                  {/* <div className="mt-2">
                    <OwnerDisplay
                      address={event.creator || ''}
                      className="text-[var(--events-foreground-muted)]"
                      showIcon={true}
                    />
                  </div> */}
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
