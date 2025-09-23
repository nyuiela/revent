import { useQuery, useQueryClient } from '@tanstack/react-query';

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
}

// Fetch events from the Graph Protocol API
const fetchEvents = async (): Promise<GraphEvent[]> => {
  const response = await fetch('/api/events/graph');

  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  const data: EventsResponse = await response.json();
  return data.events || [];
};

// Hook for fetching events with React Query
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: 30 * 1000, // Poll every 30 seconds for new events
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook for prefetching events
export function usePrefetchEvents() {
  const queryClient = useQueryClient();

  const prefetchEvents = () => {
    queryClient.prefetchQuery({
      queryKey: ['events'],
      queryFn: fetchEvents,
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchEvents };
}

// Hook for getting a specific event by ID
export function useEvent(eventId: string) {
  const { data: events, ...rest } = useEvents();

  const event = events?.find(e => e.id === eventId);

  return {
    event,
    ...rest,
  };
}

// Hook for getting live events only
export function useLiveEvents() {
  const { data: events, ...rest } = useEvents();

  const liveEvents = events?.filter(e => e.isLive) || [];

  return {
    events: liveEvents,
    ...rest,
  };
}

// Hook for getting the last eventId (numeric) from events list
export function useLastEventId() {
  const { data: events, isLoading, error } = useEvents();

  const lastId = events && events.length > 0
    ? events
      .map(e => parseInt(e.id, 10))
      .filter(n => Number.isFinite(n))
      .reduce((max, n) => Math.max(max, n), 0)
    : undefined

  return { lastEventId: lastId, isLoading, error };
}
