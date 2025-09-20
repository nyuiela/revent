import { useState, useEffect, useCallback, useMemo } from 'react';
import { useEvents } from './useEvents';

export interface InfiniteEventsOptions {
  initialPageSize?: number;
  loadMoreSize?: number;
}

export function useInfiniteEvents(options: InfiniteEventsOptions = {}) {
  const { initialPageSize = 20, loadMoreSize = 20 } = options;
  
  const { data: allEvents = [], isLoading, error } = useEvents();
  const [displayedCount, setDisplayedCount] = useState(initialPageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Get the events to display (first N events)
  const displayedEvents = useMemo(() => {
    return allEvents.slice(0, displayedCount);
  }, [allEvents, displayedCount]);

  // Check if there are more events to load
  const hasMore = useMemo(() => {
    return displayedCount < allEvents.length;
  }, [displayedCount, allEvents.length]);

  // Load more events
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setDisplayedCount(prev => Math.min(prev + loadMoreSize, allEvents.length));
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, loadMoreSize, allEvents.length]);

  // Reset displayed count when all events change
  useEffect(() => {
    setDisplayedCount(initialPageSize);
  }, [allEvents.length, initialPageSize]);

  return {
    events: displayedEvents,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    totalCount: allEvents.length,
    displayedCount
  };
}
