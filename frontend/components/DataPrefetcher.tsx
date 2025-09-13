"use client";
import { useEffect } from 'react';
import { usePrefetchEvents } from '@/hooks/useEvents';
import { useQueryClient } from '@tanstack/react-query';

interface DataPrefetcherProps {
  children: React.ReactNode;
}

export default function DataPrefetcher({ children }: DataPrefetcherProps) {
  const { prefetchEvents } = usePrefetchEvents();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch events data on app load
    prefetchEvents();

    // Set up background refetching every 5 minutes
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [prefetchEvents, queryClient]);

  return <>{children}</>;
}
