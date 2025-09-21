import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface GraphEvent {
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
  slug?: string;
}

interface EventsResponse {
  events: GraphEvent[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
    total: number;
  };
}

export interface InfiniteEventsOptions {
  initialPageSize?: number;
  loadMoreSize?: number;
}

// Fetch events from the Graph Protocol API with pagination
const fetchEventsPage = async (page: number, limit: number): Promise<EventsResponse> => {
  const response = await fetch(`/api/events/graph?page=${page}&limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  return response.json();
};

export function useInfiniteEvents(options: InfiniteEventsOptions = {}) {
  const { initialPageSize = 5, loadMoreSize = 5 } = options;

  const [allEvents, setAllEvents] = useState<GraphEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch initial page
  const { data: initialData, isLoading, error } = useQuery({
    queryKey: ['events', 1, initialPageSize],
    queryFn: () => fetchEventsPage(1, initialPageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Update allEvents when initial data loads
  useEffect(() => {
    if (initialData) {
      setAllEvents(initialData.events);
      setHasMore(initialData.pagination.hasMore);
      setCurrentPage(1);
    }
  }, [initialData]);

  // Load more events
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const response = await fetchEventsPage(nextPage, loadMoreSize);

      setAllEvents(prev => [...prev, ...response.events]);
      setHasMore(response.pagination.hasMore);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more events:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, currentPage, loadMoreSize]);

  return {
    events: allEvents,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    totalCount: allEvents.length,
    displayedCount: allEvents.length
  };
}
