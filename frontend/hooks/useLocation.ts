import { useState, useEffect, useCallback } from 'react';
import { useNotificationHelpers } from './useNotifications';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface LocationError {
  code: number;
  message: string;
}

// Haversine formula to calculate distance between two points in kilometers
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { notifyLocationDetected, notifyLocationError } = useNotificationHelpers();

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser'
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setIsLoading(false);
        
        // Show success notification
        notifyLocationDetected();
      },
      (error) => {
        setError({
          code: error.code,
          message: error.message
        });
        setIsLoading(false);
        
        // Show error notification
        notifyLocationError();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [notifyLocationDetected, notifyLocationError]);

  useEffect(() => {
    // Auto-request location on mount
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    location,
    error,
    isLoading,
    getCurrentLocation,
    calculateDistance
  };
}

// Hook to sort events by proximity to user location
export function useProximityEvents<T extends { lat: number; lng: number }>(
  events: T[],
  userLocation: UserLocation | null
): T[] {
  const [sortedEvents, setSortedEvents] = useState<T[]>(events);

  useEffect(() => {
    if (!userLocation || events.length === 0) {
      setSortedEvents(events);
      return;
    }

    const eventsWithDistance = events.map(event => ({
      ...event,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        event.lat,
        event.lng
      )
    }));

    // Sort by distance (closest first)
    const sorted = eventsWithDistance.sort((a, b) => a.distance - b.distance);

    // Remove the distance property before setting state
    const eventsWithoutDistance = sorted.map(({ distance, ...event }) => event);
    setSortedEvents(eventsWithoutDistance as any);
  }, [events, userLocation]);

  return sortedEvents;
}

