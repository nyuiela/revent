import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface UseEventViewsResult {
  viewCount: number;
  isLoading: boolean;
  error: string | null;
  trackView: () => Promise<void>;
}

export function useEventViews(eventId: string): UseEventViewsResult {
  const [viewCount, setViewCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef<boolean>(false);
  const isTracking = useRef<boolean>(false);

  // Fetch view count for the event (only once)
  const fetchViewCount = useCallback(async () => {
    if (!eventId || hasFetched.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/events/views?eventId=${eventId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch view count');
      }

      const data = await response.json();
      setViewCount(data.viewCount || 0);
      hasFetched.current = true;
    } catch (err) {
      console.error('Error fetching view count:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch view count');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Track a view for the event (with debouncing)
  const trackView = useCallback(async () => {
    if (!eventId || isTracking.current) return;

    try {
      isTracking.current = true;
      const response = await fetch('/api/events/views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        throw new Error('Failed to track view');
      }

      const data = await response.json();
      setViewCount(data.viewCount || 0);
    } catch (err) {
      console.error('Error tracking view:', err);
      setError(err instanceof Error ? err.message : 'Failed to track view');
    } finally {
      isTracking.current = false;
    }
  }, [eventId]);

  // Fetch view count on mount (only once)
  useEffect(() => {
    if (eventId && !hasFetched.current) {
      fetchViewCount();
    }
  }, [eventId, fetchViewCount]);

  return {
    viewCount,
    isLoading,
    error,
    trackView,
  };
}

// Hook for tracking views on multiple events
export function useMultipleEventViews(eventIds: string[]) {
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef<boolean>(false);
  const lastEventIds = useRef<string>('');

  const fetchViewCounts = useCallback(async () => {
    if (!eventIds.length) {
      setIsLoading(false);
      return;
    }

    // Create a stable key for the event IDs to prevent unnecessary refetches
    const eventIdsKey = eventIds.sort().join(',');

    if (hasFetched.current && lastEventIds.current === eventIdsKey) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/events/views', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch view counts');
      }

      const data = await response.json();
      setViewCounts(data.viewCounts || {});
      hasFetched.current = true;
      lastEventIds.current = eventIdsKey;
    } catch (err) {
      console.error('Error fetching view counts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch view counts');
    } finally {
      setIsLoading(false);
    }
  }, [eventIds]);

  useEffect(() => {
    fetchViewCounts();
  }, [fetchViewCounts]);

  return {
    viewCounts,
    isLoading,
    error,
    refetch: fetchViewCounts,
  };
}
