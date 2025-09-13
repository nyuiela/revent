import { useState, useEffect } from 'react';
import { getDisplayName } from '@/utils/farcaster';

interface UseFarcasterUsernameResult {
  displayName: string;
  isFarcaster: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useFarcasterUsername(address: string): UseFarcasterUsernameResult {
  const [displayName, setDisplayName] = useState<string>('');
  const [isFarcaster, setIsFarcaster] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setDisplayName('');
      setIsFarcaster(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchDisplayName = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getDisplayName(address);
        setDisplayName(result.name);
        setIsFarcaster(result.isFarcaster);
      } catch (err) {
        console.error('Error fetching Farcaster username:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch username');
        setDisplayName(address.slice(0, 6) + '...' + address.slice(-4));
        setIsFarcaster(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDisplayName();
  }, [address]);

  return {
    displayName,
    isFarcaster,
    isLoading,
    error
  };
}
