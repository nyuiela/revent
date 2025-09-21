import { useState, useCallback } from 'react';
import { useNotificationHelpers } from './useNotifications';

export interface WaitlistResponse {
  success: boolean;
  message: string;
  totalCount?: number;
  alreadyExists?: boolean;
}

export interface WaitlistStats {
  totalCount: number;
  totalEmails: number;
  lastUpdated: string;
}

export function useWaitlist() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifyWaitlistJoined, notifyWaitlistDuplicate, notifyWaitlistError } = useNotificationHelpers();

  // Add email to waitlist
  const addToWaitlist = useCallback(async (email: string): Promise<WaitlistResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add email to waitlist');
      }

      // Show appropriate notification based on response
      if (data.alreadyExists) {
        notifyWaitlistDuplicate();
      } else if (data.success && data.totalCount) {
        notifyWaitlistJoined(data.totalCount);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      notifyWaitlistError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [notifyWaitlistJoined, notifyWaitlistDuplicate, notifyWaitlistError]);

  // Check if email exists in waitlist
  const checkEmail = useCallback(async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/waitlist?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check email');
      }

      return data.exists;
    } catch (err) {
      console.error('Error checking email:', err);
      return false;
    }
  }, []);

  // Get waitlist statistics
  const getStats = useCallback(async (): Promise<WaitlistStats> => {
    try {
      const response = await fetch('/api/waitlist', {
        method: 'PUT',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get waitlist stats');
      }

      return data;
    } catch (err) {
      console.error('Error getting waitlist stats:', err);
      throw err;
    }
  }, []);

  return {
    addToWaitlist,
    checkEmail,
    getStats,
    isLoading,
    error,
  };
}
