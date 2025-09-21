"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Coordinates = { lat: number; lng: number };

type Props = {
  value: { location: string; coordinates: Coordinates };
  onChange: (next: { location: string; coordinates: Coordinates }) => void;
  label?: string;
  placeholder?: string;
};

const DEBOUNCE_MS = 250;

const LocationPicker: React.FC<Props> = ({ value, onChange, label = "Location", placeholder = "Search for a place" }) => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [query, setQuery] = useState<string>(value.location || "");
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; center: [number, number] }>>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapboxgl, setMapboxgl] = useState<any>(null);

  const center = useMemo<[number, number]>(() => {
    if (value.coordinates.lat && value.coordinates.lng) return [value.coordinates.lng, value.coordinates.lat];
    return [-73.957, 40.72];
  }, [value.coordinates]);

  // Debounced search
  useEffect(() => {
    if (!token) return;
    const handle = setTimeout(async () => {
      const q = query.trim();
      if (!q) {
        setSuggestions([]);
        return;
      }
      try {
        setIsLoading(true);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&autocomplete=true&limit=5`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`geocode ${res.status}`);
        const json = await res.json();
        const items = Array.isArray(json.features)
          ? json.features.map((f: { id: string; place_name: string; center: [number, number] }) => ({
            id: f.id,
            name: f.place_name,
            center: f.center,
          }))
          : [];
        setSuggestions(items);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, token]);

  // Init mapbox-gl lazily
  useEffect(() => {
    let map: mapboxgl.Map | null = null;
    async function init() {
      if (!token || !containerRef.current) return;
      try {
        const mod = (await import("mapbox-gl")).default;
        setMapboxgl(mod);
        mod.accessToken = token;
        map = new mod.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center,
          zoom: 12,
        });
        mapRef.current = map;

        // Ensure marker is created after the map loads
        map.on("load", () => {
          try {
            if (!markerRef.current) {
              const el = document.createElement("div");
              el.style.width = "16px";
              el.style.height = "16px";
              el.style.borderRadius = "50%";
              el.style.background = "#ef4444";
              el.style.border = "2px solid white";
              el.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";
              const m = new mod.Marker({ element: el, draggable: true })
                .setLngLat(center)
                .addTo(map!);
              m.on("dragend", () => {
                const lngLat = m.getLngLat();
                onChange({ location: query || value.location, coordinates: { lat: lngLat.lat, lng: lngLat.lng } });
              });
              markerRef.current = m as unknown as mapboxgl.Marker;
            } else {
              markerRef.current.setLngLat(center);
            }

            // Click to set marker
            map!.on("click", (e) => {
              const { lng, lat } = e.lngLat;
              if (markerRef.current) markerRef.current.setLngLat([lng, lat]);
              onChange({ location: query || value.location, coordinates: { lat, lng } });
            });
          } catch (err) {
            console.error("Map load/marker init error:", err);
          }
        });
      } catch (err) {
        console.error("Map init error:", err);
      }
    }

    init();
    return () => {
      if (map) {
        map.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Keep map centered with external value changes
  useEffect(() => {
    if (!mapRef.current || !mapboxgl) return;
    try {
      mapRef.current.flyTo({ center, zoom: 13, essential: true });
      if (markerRef.current) {
        markerRef.current.setLngLat(center);
      } else {
        // Create a marker on-the-fly if missing
        const el = document.createElement("div");
        el.style.width = "16px";
        el.style.height = "16px";
        el.style.borderRadius = "50%";
        el.style.background = "#ef4444";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";
        const M = new mapboxgl.Marker({ element: el, draggable: true })
          .setLngLat(center)
          .addTo(mapRef.current);
        M.on("dragend", () => {
          const lngLat = (M as any).getLngLat();
          onChange({ location: query || value.location, coordinates: { lat: lngLat.lat, lng: lngLat.lng } });
        });
        markerRef.current = M as unknown as mapboxgl.Marker;
      }
    } catch {
      // noop
    }
  }, [center, mapboxgl, onChange, query, value.location]);

  const handleSelect = useCallback((s: { name: string; center: [number, number] }) => {
    setQuery(s.name);
    setOpen(false);
    onChange({ location: s.name, coordinates: { lat: s.center[1], lng: s.center[0] } });
    if (mapRef.current) {
      mapRef.current.flyTo({ center: s.center, zoom: 14, essential: true });
      if (markerRef.current) {
        markerRef.current.setLngLat(s.center);
      } else if (mapboxgl) {
        // Create marker if it doesn't exist yet
        const el = document.createElement("div");
        el.style.width = "16px";
        el.style.height = "16px";
        el.style.borderRadius = "50%";
        el.style.background = "#ef4444";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";
        const M = new mapboxgl.Marker({ element: el, draggable: true })
          .setLngLat(s.center)
          .addTo(mapRef.current);
        M.on("dragend", () => {
          const lngLat = (M as any).getLngLat();
          onChange({ location: s.name, coordinates: { lat: lngLat.lat, lng: lngLat.lng } });
        });
        markerRef.current = M as unknown as mapboxgl.Marker;
      }
    }
  }, [onChange, mapboxgl]);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
        />
        {open && (suggestions.length > 0 || isLoading) && (
          <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-sm max-h-64 overflow-auto">
            {isLoading && (
              <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
            )}
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                onClick={() => handleSelect(s)}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden relative w-full h-56">
        {!token ? (
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div>
              <div className="text-sm text-[var(--app-foreground-muted)] mb-1">Map unavailable</div>
              <div className="text-xs text-[var(--app-foreground-muted)]">Set NEXT_PUBLIC_MAPBOX_TOKEN to enable map & pin</div>
            </div>
          </div>
        ) : (
          <div ref={containerRef} className="absolute inset-0" />
        )}
      </div>

      {/* Coordinates display */}
      <div className="text-xs text-muted-foreground">
        Coordinates: {value.coordinates.lat.toFixed(5)}, {value.coordinates.lng.toFixed(5)}
      </div>
    </div>
  );
};

export default LocationPicker;


