import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch view count for a single event
const fetchViewCount = async (eventId: string): Promise<number> => {
  const response = await fetch(`/api/events/views?eventId=${eventId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch view count');
  }

  const data = await response.json();
  return data.viewCount || 0;
};

// Fetch view counts for multiple events
const fetchViewCounts = async (eventIds: string[]): Promise<Record<string, number>> => {
  if (!eventIds.length) return {};

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
  return data.viewCounts || {};
};

// Track a view for an event
const trackView = async (eventId: string): Promise<number> => {
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
  return data.viewCount || 0;
};

// Hook for getting view count for a single event
export function useViewCount(eventId: string) {
  return useQuery({
    queryKey: ['viewCount', eventId],
    queryFn: () => fetchViewCount(eventId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!eventId,
  });
}

// Hook for getting view counts for multiple events
export function useViewCounts(eventIds: string[]) {
  return useQuery({
    queryKey: ['viewCounts', eventIds.sort().join(',')],
    queryFn: () => fetchViewCounts(eventIds),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: eventIds.length > 0,
  });
}

// Hook for tracking views with optimistic updates
export function useTrackView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trackView,
    onMutate: async (eventId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['viewCount', eventId] });
      await queryClient.cancelQueries({ queryKey: ['viewCounts'] });

      // Snapshot the previous value
      const previousViewCount = queryClient.getQueryData(['viewCount', eventId]);
      const previousViewCounts = queryClient.getQueryData(['viewCounts']);

      // Optimistically update the view count
      queryClient.setQueryData(['viewCount', eventId], (old: number) => (old || 0) + 1);

      // Update view counts if it exists
      if (previousViewCounts) {
        queryClient.setQueryData(['viewCounts'], (old: Record<string, number>) => ({
          ...old,
          [eventId]: (old?.[eventId] || 0) + 1,
        }));
      }

      return { previousViewCount, previousViewCounts };
    },
    onError: (err, eventId, context) => {
      // Rollback on error
      if (context?.previousViewCount !== undefined) {
        queryClient.setQueryData(['viewCount', eventId], context.previousViewCount);
      }
      if (context?.previousViewCounts) {
        queryClient.setQueryData(['viewCounts'], context.previousViewCounts);
      }
    },
    onSettled: (data, error, eventId) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['viewCount', eventId] });
      queryClient.invalidateQueries({ queryKey: ['viewCounts'] });
    },
  });
}
