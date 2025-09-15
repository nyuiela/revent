"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  lat: number;
  lng: number;
  heightClass?: string;
  zoom?: number;
};

const StaticLocationMap: React.FC<Props> = ({ lat, lng, heightClass = "h-64", zoom = 14 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current) return;

    let map: mapboxgl.Map | null = null;
    async function init() {
      try {
        const mod = (await import("mapbox-gl")).default;
        mod.accessToken = token;
        map = new mod.Map({
          container: containerRef.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [lng, lat],
          zoom,
          interactive: false,
        });
        mapRef.current = map;

        const el = document.createElement("div");
        el.style.width = "16px";
        el.style.height = "16px";
        el.style.borderRadius = "50%";
        el.style.background = "#ef4444";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";
        new mod.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      } catch {
        // ignore
      }
    }
    init();
    return () => {
      if (map) map.remove();
    };
  }, [lat, lng, zoom]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className={`${heightClass} w-full rounded-lg border border-border flex items-center justify-center text-center`}>
        <div>
          <div className="text-sm text-[var(--app-foreground-muted)]">Map unavailable</div>
          <div className="text-xs text-[var(--app-foreground-muted)]">Set NEXT_PUBLIC_MAPBOX_TOKEN</div>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={`${heightClass} w-full rounded-lg overflow-hidden relative`} />;
};

export default StaticLocationMap;


