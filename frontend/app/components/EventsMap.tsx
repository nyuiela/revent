"use client";

import { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';


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
        console.log("🗺️ Initializing Mapbox with token:", token.substring(0, 20) + "...");
        
        const mapboxglModule = (await import("mapbox-gl")).default;
        setMapboxgl(mapboxglModule);
        mapboxgl = mapboxglModule;
        
        mapboxgl.accessToken = token;
        
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: mapStyle,
          center,
          zoom: 13, // Slightly closer zoom to see events better
          maxZoom: 150,
          minZoom: 10.12,
          antialias: true,
          attributionControl: false, // Hide attribution for cleaner look
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
          console.log("✅ Map loaded successfully, ready for events");
        });

        map.on("error", (e) => {
          console.error("❌ Map error:", e);
        });

        map.on("style.load", () => {
          console.log("✅ Map style loaded");
        });

      } catch (error) {
        console.error("❌ Failed to initialize map:", error);
        return; // dependency not installed or other error; fallback will render
      }
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
    console.log(`🗺️ Updating markers for ${events.length} events`);

    // Remove existing event listeners to prevent duplicates
    map.off("click", "touch-points");

    // Clear existing markers first - use Mapbox's internal marker tracking
    const mapContainer = map.getContainer();
    const existingMarkers = mapContainer.querySelectorAll('.event-marker');
    existingMarkers.forEach((el: Element) => {
      try {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      } catch (error) {
        console.warn('Error removing marker:', error);
      }
    });

    // Create new markers for each event using the pattern you provided
    events.forEach((ev, index) => {
      try {
        console.log(`🗺️ Creating marker for event ${index + 1}: ${ev.title} at [${ev.lng}, ${ev.lat}]`);
        
        // Create marker element following the Mapbox example pattern
        const el = document.createElement("div");
        el.className = "event-marker";
        el.style.width = "50px";
        el.style.height = "50px";
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.style.backgroundRepeat = "no-repeat";
        el.style.borderRadius = "50%";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";
        el.style.position = "relative";
        el.style.transition = "all 0.2s ease";
        el.style.display = "block";

        // Set background image to the event's avatar
        el.style.backgroundImage = `url(${ev.avatarUrl})`;

        // Add live indicator for live events
        if (ev.isLive) {
          const liveIndicator = document.createElement("div");
          liveIndicator.style.position = "absolute";
          liveIndicator.style.top = "-2px";
          liveIndicator.style.right = "-2px";
          liveIndicator.style.width = "16px";
          liveIndicator.style.height = "16px";
          liveIndicator.style.backgroundColor = "#ef4444";
          liveIndicator.style.borderRadius = "50%";
          liveIndicator.style.border = "2px solid white";
          liveIndicator.style.animation = "pulse 2s infinite";
          el.appendChild(liveIndicator);
        }

        // Add hover effects
        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.1)";
          el.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)";
          el.style.zIndex = "1000";
          setHoveredEvent(ev);
        });

        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
          el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          el.style.zIndex = "auto";
          setHoveredEvent(null);
        });

        // Add click handler to marker
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          console.log("Marker clicked for event:", ev.title);
          
          // Create popup content
          const html = `
            <div style="min-width:200px;padding:12px">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                <img src="${ev.avatarUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover" alt="${ev.username}" />
                <div>
                  <div style="font-weight:600;font-size:16px;margin-bottom:2px">${ev.title}</div>
                  <div style="font-size:14px;opacity:.7">@${ev.username}</div>
                </div>
              </div>
              ${ev.isLive ? '<div style="color:#ef4444;font-size:12px;margin:8px 0;display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;background:#ef4444;border-radius:50%;animation:pulse 2s infinite"></div>LIVE NOW</div>' : ''}
              ${ev.platforms && ev.platforms.length > 0 ? `<div style="font-size:12px;opacity:.6;margin-bottom:8px">Platforms: ${ev.platforms.join(', ')}</div>` : ''}
              <button id="watch-${ev.id}" style="width:100%;padding:10px 12px;border-radius:8px;background:#111827;color:#fff;font-size:14px;font-weight:500;border:none;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#111827'">Watch Stream</button>
            </div>
          `;

          // Create and show popup
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
            maxWidth: '300px',
            className: 'event-popup'
          })
            .setLngLat([ev.lng, ev.lat])
            .setHTML(html)
            .addTo(map);

          // Handle watch button click
          setTimeout(() => {
            const btn = document.getElementById(`watch-${ev.id}`);
            if (btn) {
              btn.onclick = () => {
                console.log(`Watching event: ${ev.title}`);
                window.location.hash = `watch-${ev.id}`;
                popup.remove();
              };
            }
          }, 100);
        });

        // Create and add the marker to the map
        const marker = new mapboxgl.Marker({ 
          element: el,
          anchor: 'center'
        })
          .setLngLat([ev.lng, ev.lat])
          .addTo(map);

        console.log(`✅ Marker created for ${ev.title}`);
      } catch (error) {
        console.error(`❌ Error creating marker for event ${ev.id}:`, error);
      }
    });

    console.log(`✅ Finished creating ${events.length} markers`);

  }, [events, mapReady, mapboxgl]);

  if (!token) {
    return (
      <div className="relative h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Interactive Map</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Map functionality requires Mapbox token</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono">
            Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Add CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .event-marker {
          transition: all 0.2s ease;
        }
        .event-marker:hover {
          transform: scale(1.1);
        }
      `}</style>

      {/* Hover tooltip */}
      {hoveredEvent && (
        <div className="absolute top-4 left-4 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-border p-3 max-w-xs">
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
