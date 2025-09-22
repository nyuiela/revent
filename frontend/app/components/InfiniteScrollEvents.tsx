"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { Eye, MapPin, Loader2 } from 'lucide-react';
import OwnerDisplay from '../../components/OwnerDisplay';
import ViewCount from '../../components/ViewCount';
import { useInfiniteEvents } from '../../hooks/useInfiniteEvents';
import { useViewCounts } from '../../hooks/useViewCounts';
import { calculateDistance } from '../../hooks/useLocation';
import Image from 'next/image';

interface InfiniteScrollEventsProps {
  userLocation?: { lat: number; lng: number } | null;
  onEventSelect?: (event: unknown) => void;
}

export default function InfiniteScrollEvents({
  userLocation,
  onEventSelect
}: InfiniteScrollEventsProps) {
  const [isAutoScroll,] = useState(false); // Default to manual mode

  const {
    events,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    totalCount,
    displayedCount,
    error
  } = useInfiniteEvents();

  const eventIds = events.map(event => event.id);
  const { data: viewCounts = {}, isLoading: viewsLoading } = useViewCounts(eventIds);

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for infinite scroll (only when auto scroll is enabled)
  const lastEventElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || !isAutoScroll) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      {
        rootMargin: '100px', // Start loading when element is 100px away from viewport
        threshold: 0.1
      }
    );

    if (node) observerRef.current.observe(node);
  }, [isLoading, hasMore, isLoadingMore, loadMore, isAutoScroll]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <section className="space-y-3 px-4">
        <h3 className="text-sm font-medium">Discover All Events</h3>
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--app-foreground-muted)]" />
            <p className="text-sm text-[var(--app-foreground-muted)]">Loading events...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-3 px-4">
        <h3 className="text-sm font-medium">Discover All Events</h3>
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="text-red-500 text-4xl">⚠️</div>
            <p className="text-sm text-[var(--app-foreground-muted)] text-center">
              Failed to load events. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg hover:bg-[var(--app-accent-hover)] transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 px-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Discover All Events</h3>
        <div className="text-xs text-[var(--app-foreground-muted)]">
          Showing {displayedCount} of {totalCount}
        </div>
      </div>

      <div className="space-y-3">
        {events.map((event, index) => {
          const isLastEvent = index === events.length - 1;
          const distance = userLocation ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            event.lat,
            event.lng
          ) : null;

          return (
            <div
              key={event.id}
              ref={isLastEvent ? lastEventElementRef : null}
              className="rounded-2xl overflow-hidden border border-border bg-card-bg cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] shadow-none"
            >
              <Link
                href={`/${event.slug || event.id}`}
                onClick={() => onEventSelect?.(event)}
                className="block"
              >
                <div className="flex gap-4 p-4">
                  {/* Event Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <Image
                      src={event.avatarUrl}
                      alt={event.title}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                    {/* Live indicator */}
                    {event.isLive && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        LIVE
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm leading-tight text-[var(--app-foreground)] truncate">
                        {event.title}
                      </h4>

                      {/* Distance and View count */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {distance !== null && (
                          <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}</span>
                          </div>
                        )}

                        <div className="bg-gray-100 dark:bg-gray-800 text-[var(--app-foreground-muted)] text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <ViewCount
                            count={viewCounts[event.id] || 0}
                            isLoading={viewsLoading}
                            size="sm"
                            showIcon={false}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-[var(--app-foreground-muted)] mb-2">
                      <OwnerDisplay
                        address={event.creator || ''}
                        className="text-[var(--app-foreground-muted)]"
                        showIcon={false}
                      />
                    </div>

                    {/* Platforms */}
                    {event.platforms && event.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.platforms.slice(0, 3).map((platform, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-[var(--app-gray)] text-[var(--app-foreground-muted)] px-2 py-0.5 rounded-full"
                          >
                            {platform}
                          </span>
                        ))}
                        {event.platforms.length > 3 && (
                          <span className="text-xs text-[var(--app-foreground-muted)] px-2 py-0.5">
                            +{event.platforms.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}

        {/* Loading More Indicator */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-6">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--app-accent)]" />
              <span className="text-sm text-[var(--app-foreground-muted)]">Loading more events...</span>
            </div>
          </div>
        )}

        {/* Load More Button - shown in manual mode or as fallback */}
        {hasMore && !isLoadingMore && events.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <button
              onClick={loadMore}
              className="px-6 py-2 bg-[var(--app-accent)] text-white rounded-lg hover:bg-[var(--app-accent-hover)] transition-colors text-sm font-medium"
            >
              {isAutoScroll ? 'Load More Events (Auto)' : 'Load More Events'}
            </button>
          </div>
        )}

        {/* End of results */}
        {!hasMore && events.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-[var(--app-foreground-muted)]">
              We have more events coming soon!
            </div>
          </div>
        )}

        {/* No events */}
        {events.length === 0 && !isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-sm text-[var(--app-foreground-muted)] mb-2">
                No events found
              </div>
              <div className="text-xs text-[var(--app-foreground-muted)]">
                Check back later for new events
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
