"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type GoogleLiveEvent = {
  id: string;
  title: string;
  username: string;
  lat: number;
  lng: number;
  isLive: boolean;
  avatarUrl: string;
  platforms?: string[];
  locationName?: string;
};

type Props = {
  events: GoogleLiveEvent[];
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
    __googleMapsInit?: () => void;
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.google && window.google.maps) return resolve();

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });
}

const GoogleEventsMap: React.FC<Props> = ({ events }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const center = useMemo(() => {
    if (!events || events.length === 0) return { lat: 40.72, lng: -73.957 };
    // Center on first event for simplicity (single event use on EventPage)
    return { lat: events[0].lat, lng: events[0].lng };
  }, [events]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (!containerRef.current || !apiKey) return;
      try {
        await loadGoogleMaps(apiKey);
        if (!isMounted || !containerRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = new window.google!.maps.Map(containerRef.current, {
          center,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapRef.current = map;

        // Add marker(s)
        events.forEach((ev) => {
          const marker = new window.google!.maps.Marker({
            position: { lat: ev.lat, lng: ev.lng },
            map,
            title: ev.title,
          });

          const content = `
            <div style="min-width:200px;padding:8px">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                <img src="${ev.avatarUrl}" style="width:32px;height:32px;border-radius:50%;object-fit:cover" alt="${ev.username}" />
                <div>
                  <div style="font-weight:600;font-size:14px;margin-bottom:2px">${ev.title}</div>
                  <div style="font-size:12px;opacity:.7">@${ev.username}</div>
                </div>
              </div>
              ${ev.isLive ? '<div style="color:#ef4444;font-size:11px;margin:8px 0;display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;background:#ef4444;border-radius:50%;animation:pulse 2s infinite"></div>LIVE NOW</div>' : ''}
              ${ev.platforms && ev.platforms.length > 0 ? `<div style="font-size:11px;opacity:.6;margin-bottom:8px">Platforms: ${ev.platforms.join(', ')}</div>` : ''}
            </div>
          `;
          const info = new window.google!.maps.InfoWindow({ content });
          marker.addListener("click", () => info.open({ map, anchor: marker }));
        });

        setReady(true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Google Maps init error", e);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [apiKey, center, events]);

  // Update markers if events change and map exists
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    // Simple approach: re-center map
    mapRef.current.setCenter(center);
  }, [center, ready]);

  if (!apiKey) {
    return (
      <div className="relative h-full w-full bg-[var(--app-gray)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-[var(--app-foreground-muted)] mb-2">Google Map not available</div>
          <div className="text-xs text-[var(--app-foreground-muted)]">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</div>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="absolute inset-0" aria-label={ready ? "interactive map" : "loading map"} />;
};

export default GoogleEventsMap;


