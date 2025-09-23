import { useState, useEffect } from 'react';

export interface EventStatusData {
  eventId: string;
  currentStatus: string;
  statusName: string;
  lastChanged: string | null;
  transactionHash: string | null;
  source: string;
}

export function useEventStatus(eventId: string | number | undefined) {
  const [statusData, setStatusData] = useState<EventStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setStatusData(null);
      return;
    }

    const fetchEventStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/events/status/${eventId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch event status');
        }

        setStatusData(data);
      } catch (err) {
        console.error('Error fetching event status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch event status');
        setStatusData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEventStatus();
  }, [eventId]);

  return {
    statusData,
    loading,
    error,
    refetch: () => {
      if (eventId) {
        const fetchEventStatus = async () => {
          try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/events/status/${eventId}`);
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Failed to fetch event status');
            }

            setStatusData(data);
          } catch (err) {
            console.error('Error fetching event status:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch event status');
            setStatusData(null);
          } finally {
            setLoading(false);
          }
        };
        fetchEventStatus();
      }
    }
  };
}
