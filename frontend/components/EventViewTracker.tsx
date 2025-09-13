import { useEffect, useRef, useCallback } from 'react';

interface EventViewTrackerProps {
  eventId: string;
  trackOnMount?: boolean;
}

// Global tracking state to prevent duplicate tracking across components
const trackedEvents = new Set<string>();
const trackingInProgress = new Set<string>();
const debounceTimers = new Map<string, NodeJS.Timeout>();

export default function EventViewTracker({
  eventId,
  trackOnMount = true
}: EventViewTrackerProps) {
  const hasTracked = useRef<boolean>(false);

  const trackView = useCallback(async (eventId: string) => {
    // Prevent duplicate tracking
    if (trackedEvents.has(eventId) || trackingInProgress.has(eventId)) {
      return;
    }

    // Clear any existing debounce timer for this event
    const existingTimer = debounceTimers.get(eventId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Debounce the tracking call by 1 second
    const timer = setTimeout(async () => {
      trackingInProgress.add(eventId);

      try {
        const response = await fetch('/api/events/views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ eventId }),
        });

        if (response.ok) {
          trackedEvents.add(eventId);
          hasTracked.current = true;
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      } finally {
        trackingInProgress.delete(eventId);
        debounceTimers.delete(eventId);
      }
    }, 1000);

    debounceTimers.set(eventId, timer);
  }, []);

  useEffect(() => {
    if (trackOnMount && eventId && !hasTracked.current) {
      trackView(eventId);
    }

    // Cleanup debounce timer on unmount
    return () => {
      const timer = debounceTimers.get(eventId);
      if (timer) {
        clearTimeout(timer);
        debounceTimers.delete(eventId);
      }
    };
  }, [eventId, trackOnMount, trackView]);

  // This component doesn't render anything, it just tracks views
  return null;
}
