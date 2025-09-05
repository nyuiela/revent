"use client";

import { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";

export type LiveEvent = {
  id: string;
  title: string;
  username: string;
  lat: number;
  lng: number;
  isLive: boolean;
  avatarUrl: string;
  platforms?: string[];
  // Additional fields from Graph Protocol
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
};

type Props = {
  events: LiveEvent[];
  onMapDrag?: (isDragging: boolean) => void;
};

export interface EventsMapRef {
  focusOnEvent: (event: LiveEvent) => void;
}

// Renders a real map when Mapbox GL is available and a token is set.
// Falls back to a static image background otherwise.
const EventsMap = forwardRef<EventsMapRef, Props>(({ events, onMapDrag }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<LiveEvent | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const { theme } = useTheme();

  // Calculate center based on events density - prioritize areas with most events
  const center = useMemo(() => {
    // lat: 40.7189,
    //   lng: -73.959,
    //   isLive: true,
    if (events.length === 0) return [-73.957, 40.72]; // Default to Brooklyn

    // Group events by proximity and find the densest area
    const clusters: { center: [number, number]; events: LiveEvent[]; density: number }[] = [];

    events.forEach((event) => {
      let addedToCluster = false;

      // Check if event is close to existing cluster
      for (const cluster of clusters) {
        const distance = Math.sqrt(
          Math.pow(event.lng - cluster.center[0], 2) +
          Math.pow(event.lat - cluster.center[1], 2)
        );

        if (distance < 0.01) { // Roughly 1km radius
          cluster.events.push(event);
          // Update cluster center to be average of all events in cluster
          const avgLng = cluster.events.reduce((sum, e) => sum + e.lng, 0) / cluster.events.length;
          const avgLat = cluster.events.reduce((sum, e) => sum + e.lat, 0) / cluster.events.length;
          cluster.center = [avgLng, avgLat];
          cluster.density = cluster.events.length;
          addedToCluster = true;
          break;
        }
      }

      // Create new cluster if not close to any existing one
      if (!addedToCluster) {
        clusters.push({
          center: [event.lng, event.lat],
          events: [event],
          density: 1
        });
      }
    });

    // Find cluster with highest density
    const densestCluster = clusters.reduce((max, cluster) =>
      cluster.density > max.density ? cluster : max
    );

    console.log(`🗺️ Found ${clusters.length} clusters, densest has ${densestCluster.density} events at [${densestCluster.center[0]}, ${densestCluster.center[1]}]`);

    return densestCluster.center as [number, number];
  }, [events]);

  // Get appropriate Mapbox style based on theme
  const mapStyle = useMemo(() => {
    console.log('🗺️ Theme:', theme);
    const style = theme == 'dark'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';
    console.log('🗺️ Map style selected:', style, 'for theme:', theme);
    return style;
  }, [theme]);

  useImperativeHandle(ref, () => ({
    focusOnEvent: (event: LiveEvent) => {
      console.log("Focusing on event:", event);
      if (mapRef.current && mapReady) {
        try {
          mapRef.current.flyTo({
            center: [event.lng, event.lat],
            zoom: 15,
            duration: 1000,
          });
          console.log("Map flew to:", [event.lng, event.lat]);
        } catch (error) {
          console.error("Error focusing on event:", error);
        }
      } else {
        console.log("Map not ready or ref not available");
      }
    },
  }));

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapboxgl: any = null;


    async function init() {
      if (!containerRef.current) return;
      if (!token) return;
      try {
        const mapboxglModule = (await import("mapbox-gl")).default;
        setMapboxgl(mapboxglModule);
        mapboxgl = mapboxglModule;
      } catch {
        return; // dependency not installed; fallback will render
      }

      mapboxgl.accessToken = token;
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: mapStyle,
        center,
        zoom: 13, // Slightly closer zoom to see events better
        maxZoom: 150,
        minZoom: 10,
      });

      mapRef.current = map;

      // Add drag event listeners
      if (onMapDrag) {
        map.on("dragstart", () => {
          onMapDrag(true);
        });

        map.on("dragend", () => {
          onMapDrag(false);
        });
      }

      map.on("load", () => {
        setMapReady(true);
        console.log("Map loaded, ready for events");

        // Add invisible click layer for better touch targets
        const geojson = {
          type: "FeatureCollection" as const,
          features: events.map((ev) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [ev.lng, ev.lat] },
            properties: { id: ev.id },
          })),
        };

        if (!map.getSource("events")) {
          map.addSource("events", { type: "geojson", data: geojson });
          map.addLayer({
            id: "touch-points",
            type: "circle",
            source: "events",
            paint: {
              "circle-radius": 25,
              "circle-opacity": 0
            }
          });
        } else {
          const source = map.getSource("events");
          if (source) {
            source.setData(geojson);
          }
        }

        // Add click handler for invisible layer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.on("click", "touch-points", (e: any) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const id = feature.properties?.id;
          const ev = events.find((x) => x.id === id);
          if (!ev) return;

          console.log("Layer clicked for event:", ev.title);
          const html = `
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
              <button id="watch-${ev.id}" style="width:100%;padding:8px 12px;border-radius:8px;background:#111827;color:#fff;font-size:12px;font-weight:500;border:none;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#111827'">Watch Stream</button>
            </div>
          `;
          const popup = new mapboxgl.Popup({
            offset: 12,
            closeButton: true,
            closeOnClick: false,
            maxWidth: '250px'
          })
            .setLngLat(feature.geometry.coordinates)
            .setHTML(html)
            .addTo(map);

          setTimeout(() => {
            const btn = document.getElementById(`watch-${ev.id}`);
            if (btn) {
              btn.onclick = () => {
                window.location.hash = `watch-${ev.id}`;
                popup.remove();
              };
            }
          }, 0);
        });
      });
    }

    init();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [token, onMapDrag, mapStyle, center, events]); // Include center and events in dependencies

  // Update map style when theme changes
  useEffect(() => {
    if (mapRef.current && mapReady) {
      mapRef.current.setStyle(mapStyle);
    }
  }, [mapStyle, mapReady]);

  // Handle events updates without recreating the map
  useEffect(() => {
    if (!mapRef.current || !mapReady || !mapboxgl) return;

    const map = mapRef.current;

    // Remove existing event listeners to prevent duplicates
    map.off("click", "touch-points");

    // Clear existing markers first
    const existingMarkers = document.querySelectorAll('.event-marker');
    existingMarkers.forEach(el => {
      try {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      } catch (error) {
        console.warn('Error removing marker:', error);
      }
    });

    // Create new markers for each event
    events.forEach((ev) => {
      try {
        const el = document.createElement("div");
        el.className = `event-marker rounded-full ring-2 ring-white shadow-lg overflow-hidden transition-all duration-200 ${ev.isLive ? "ring-offset-2 ring-offset-red-500 animate-pulse" : ""
          }`;
        el.style.width = "40px";
        el.style.height = "40px";
        el.style.cursor = "pointer";
        el.style.transition = "all 0.2s ease";
        el.style.position = "relative";

        // Create profile picture container
        const img = document.createElement("img");
        img.src = ev.avatarUrl;
        img.alt = ev.username;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.borderRadius = "50%";
        // eslint-disable-next-line @next/next/no-img-element
        el.appendChild(img);

        // Add live indicator dot for live events
        if (ev.isLive) {
          const liveDot = document.createElement("div");
          liveDot.style.position = "absolute";
          liveDot.style.top = "-2px";
          liveDot.style.right = "-2px";
          liveDot.style.width = "12px";
          liveDot.style.height = "12px";
          liveDot.style.backgroundColor = "#ef4444";
          liveDot.style.borderRadius = "50%";
          liveDot.style.border = "2px solid white";
          liveDot.style.animation = "pulse 2s infinite";
          el.appendChild(liveDot);
        }

        // Add hover effects
        el.addEventListener("mouseenter", () => {
          try {
            el.style.transform = "scale(1.1)";
            el.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
            el.style.zIndex = "1000";
            setHoveredEvent(ev);
          } catch (error) {
            console.warn('Error in mouseenter:', error);
          }
        });

        el.addEventListener("mouseleave", () => {
          try {
            el.style.transform = "scale(1)";
            el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
            el.style.zIndex = "auto";
            setHoveredEvent(null);
          } catch (error) {
            console.warn('Error in mouseleave:', error);
          }
        });

        // Add click handler to marker
        el.addEventListener("click", () => {
          try {
            console.log("Marker clicked for event:", ev.title);
            // Create enhanced popup on marker click
            const html = `
              <div style="min-width:200px;padding:8px">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                  <img src="${ev.avatarUrl}" style="width:32px;height:32px;border-radius:50%;object-fit:cover" alt="${ev.username}" />
                  <div>
                    <div style="font-weight:600;font-size:14px;margin-bottom:2px">${ev.title}</div>
                    <div style="font-size:12px;opacity:.7">@${ev.username}</div>
                  </div>
                </div>
                ${ev.isLive ? '<div style="color:#ef4444;font-size:11px;margin:8px 0;display:flex:align-items:center;gap:4px"><div style="width:8px;height:8px;background:#ef4444;border-radius:50%;animation:pulse 2s infinite"></div>LIVE NOW</div>' : ''}
                ${ev.platforms && ev.platforms.length > 0 ? `<div style="font-size:11px;opacity:.6;margin-bottom:8px">Platforms: ${ev.platforms.join(', ')}</div>` : ''}
                <button id="watch-${ev.id}" style="width:100%;padding:8px 12px;border-radius:8px;background:#111827;color:#fff;font-size:12px;font-weight:500;border:none;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#111827'">Watch Stream</button>
              </div>
            `;
            const popup = new mapboxgl.Popup({
              offset: 12,
              closeButton: true,
              closeOnClick: false,
              maxWidth: '250px'
            })
              .setLngLat([ev.lng, ev.lat])
              .setHTML(html)
              .addTo(map);

            setTimeout(() => {
              const btn = document.getElementById(`watch-${ev.id}`);
              if (btn) {
                btn.onclick = () => {
                  window.location.hash = `watch-${ev.id}`;
                  popup.remove();
                };
              }
            }, 0);
          } catch (error) {
            console.warn('Error in marker click:', error);
          }
        });

        new mapboxgl.Marker({ element: el })
          .setLngLat([ev.lng, ev.lat])
          .addTo(map);
      } catch (error) {
        console.warn('Error creating marker for event:', ev.id, error);
      }
    });

    // Update invisible click layer
    try {
      const geojson = {
        type: "FeatureCollection" as const,
        features: events.map((ev) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [ev.lng, ev.lat] },
          properties: { id: ev.id },
        })),
      };

      if (!map.getSource("events")) {
        map.addSource("events", { type: "geojson", data: geojson });
        map.addLayer({
          id: "touch-points",
          type: "circle",
          source: "events",
          paint: {
            "circle-radius": 25,
            "circle-opacity": 0
          }
        });
      } else {
        const source = map.getSource("events");
        if (source) {
          source.setData(geojson);
        }
      }

      // Add click handler for invisible layer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("click", "touch-points", (e: any) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const id = feature.properties?.id;
        const ev = events.find((x) => x.id === id);
        if (!ev) return;

        console.log("Layer clicked for event:", ev.title);
        const html = `
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
          <button id="watch-${ev.id}" style="width:100%;padding:8px 12px;border-radius:8px;background:#111827;color:#fff;font-size:12px;font-weight:500;border:none;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#111827'">Watch Stream</button>
        </div>
      `;
        const popup = new mapboxgl.Popup({
          offset: 12,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '250px'
        })
          .setLngLat(feature.geometry.coordinates)
          .setHTML(html)
          .addTo(map);

        setTimeout(() => {
          const btn = document.getElementById(`watch-${ev.id}`);
          if (btn) {
            btn.onclick = () => {
              window.location.hash = `watch-${ev.id}`;
              popup.remove();
            };
          }
        }, 0);
      });
    } catch (error) {
      console.warn('Error updating invisible click layer:', error);
    }

  }, [events, mapReady, mapboxgl]); // Include mapboxgl in dependencies

  if (!token) {
    return (
      <div className="relative h-full w-full bg-[var(--app-gray)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-[var(--app-foreground-muted)] mb-2">Map not available</div>
          <div className="text-xs text-[var(--app-foreground-muted)]">Set NEXT_PUBLIC_MAPBOX_TOKEN</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Hover tooltip */}
      {hoveredEvent && (
        <div className="absolute top-4 left-4 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-w-xs">
          <div className="flex items-center gap-3 mb-2">
            <Image
              width={32}
              height={32}
              src={hoveredEvent.avatarUrl}
              alt={hoveredEvent.username}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                {hoveredEvent.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                @{hoveredEvent.username}
              </div>
            </div>
          </div>
          {hoveredEvent.isLive && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-medium">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              LIVE NOW
            </div>
          )}
          {hoveredEvent.platforms && hoveredEvent.platforms.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {hoveredEvent.platforms.join(', ')}
            </div>
          )}
        </div>
      )}

      <div ref={containerRef} className="absolute inset-0" aria-label={mapReady ? "interactive map" : "loading map"} />
    </div>
  );
});

EventsMap.displayName = "EventsMap";

export default EventsMap;
