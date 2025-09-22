"use client";

import { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import 'mapbox-gl/dist/mapbox-gl.css';
// import { useNotificationHelpers } from "@/hooks/useNotifications";


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
  slug?: string;
};

type Props = {
  events: LiveEvent[];
  onMapDrag?: (isDragging: boolean) => void;
  userLocation?: { lat: number; lng: number } | null;
};

export interface EventsMapRef {
  focusOnEvent: (event: LiveEvent) => void;
}

// Renders a real map when Mapbox GL is available and a token is set.
// Falls back to a static image background otherwise.
const EventsMap = forwardRef<EventsMapRef, Props>(({ events, onMapDrag, userLocation }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<LiveEvent | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const markersRef = useRef<Map<string, unknown>>(new Map());
  const isUserInteractingRef = useRef(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const { theme } = useTheme();
  const [mapStyle, setStyle] = useState<string | null>('mapbox://styles/mapbox/dark-v11');
  // const { notifyEventSelected } = useNotificationHelpers();

  // Helper: compute initial center once from current events or user location
  const initialCenter = useMemo<[number, number]>(() => {
    // Prioritize user location if available
    if (userLocation) {
      return [userLocation.lng, userLocation.lat];
    }
    // Fallback to events center or default location
    if (events.length === 0) return [-73.957, 40.72];
    const avgLng = events.reduce((s, e) => s + e.lng, 0) / events.length;
    const avgLat = events.reduce((s, e) => s + e.lat, 0) / events.length;
    return [avgLng, avgLat];
  }, [events, userLocation]);

  // Get appropriate Mapbox style based on theme
  // const mapStyle = useMemo(() => {
  //   console.log('🗺️ Theme:', theme);
  //   const style = theme == 'dark'
  //     ? 'mapbox://styles/mapbox/dark-v11'
  //     : 'mapbox://styles/mapbox/light-v11';
  //   console.log('🗺️ Map style selected:', style, 'for theme:', theme);
  //   return style;
  // }, [theme]);
  useEffect(() => {
    console.log('🗺️ Theme:', theme);
    const style = theme == 'dark'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';
    console.log('🗺️ Map style selected:', style, 'for theme:', theme);
    setStyle(style);
    // return style;
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
      if (!mapStyle) return;

      try {
        console.log("🗺️ Initializing Mapbox with token:", token.substring(0, 20) + "...");

        const mapboxglModule = (await import("mapbox-gl")).default;
        setMapboxgl(mapboxglModule);
        mapboxgl = mapboxglModule;

        mapboxgl.accessToken = token;

        map = new mapboxgl.Map({
          container: containerRef.current,
          style: mapStyle,
          center: initialCenter,
          zoom: 13, // Slightly closer zoom to see events better
          maxZoom: 150,
          minZoom: 10.12,
          antialias: true,
          attributionControl: false, // Hide attribution for cleaner look
        });

        mapRef.current = map;

        // Add interaction listeners
        map.on("dragstart", () => {
          isUserInteractingRef.current = true;
          onMapDrag?.(true);
        });
        map.on("dragend", () => {
          isUserInteractingRef.current = false;
          onMapDrag?.(false);
        });
        map.on("movestart", () => { isUserInteractingRef.current = true; });
        map.on("moveend", () => { isUserInteractingRef.current = false; });

        map.on("load", () => {
          setMapReady(true);
          updateMarkers();
          console.log("✅ Map loaded successfully, ready for events");
        });

        map.on("error", (e: unknown) => {
          console.error("❌ Map error:", e);
        });

        map.on("style.load", () => {
          // Re-add markers after style changes
          updateMarkers();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, mapStyle]); // Initialize once for token/style; do not depend on events

  // Update map style when theme changes
  useEffect(() => {
    if (mapRef.current && mapReady) {
      mapRef.current.setStyle(mapStyle);
    }
  }, [mapStyle, mapReady]);

  // Local function to (re)build markers
  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !mapboxgl) return;
    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      try { (marker as { remove: () => void }).remove(); } catch { }
    });
    markersRef.current.clear();

    // Add new markers
    events.forEach((ev) => {
      try {
        const el = document.createElement("div");
        el.className = "event-marker";
        el.style.width = "44px";
        el.style.height = "44px";
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.style.backgroundRepeat = "no-repeat";
        el.style.borderRadius = "50%";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";
        el.style.position = "relative";
        el.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
        el.style.display = "block";
        el.style.transformOrigin = "center center";
        el.style.boxSizing = "border-box";
        el.style.backgroundImage = `url(${ev.avatarUrl})`;
        el.style.zIndex = "1000";

        if (ev.isLive) {
          const live = document.createElement("div");
          live.style.position = "absolute";
          live.style.top = "-2px";
          live.style.right = "-2px";
          live.style.width = "14px";
          live.style.height = "14px";
          live.style.backgroundColor = "#ef4444";
          live.style.borderRadius = "50%";
          live.style.border = "2px solid white";
          el.appendChild(live);
        }

        el.addEventListener("mouseenter", () => {
          console.log("Marker hover enter:", ev.title, "Position:", el.style.transform);
          el.style.transform = "scale(1.1)";
          el.style.zIndex = "1000";
          el.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)";
          setHoveredEvent(ev);
        });
        el.addEventListener("mouseleave", () => {
          console.log("Marker hover leave:", ev.title, "Position:", el.style.transform);
          el.style.transform = "scale(1)";
          el.style.zIndex = "auto";
          el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          setHoveredEvent(null);
        });

        // Add click handler to marker
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          console.log("Marker clicked for event:", ev.title);

          // Show event selected notification
          // notifyEventSelected(ev.title);

          // Create popup content with proper styling and theme support
          const isDarkMode = theme === 'dark' || document.documentElement.classList.contains('dark');
          const bgColor = isDarkMode ? '#1f2937' : 'white';
          const textColor = isDarkMode ? '#f9fafb' : '#1f2937';
          const borderColor = isDarkMode ? '#374151' : '#e5e7eb';
          const secondaryTextColor = isDarkMode ? '#9ca3af' : '#6b7280';

          const html = `
            <div style="min-width:200px;padding:16px;background:${bgColor};color:${textColor};border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.15);">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                <img src="${ev.avatarUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid ${borderColor}" alt="${ev.username}" />
                <div>
                  <div style="font-weight:600;font-size:16px;margin-bottom:4px;color:${textColor}">${ev.title}</div>
                  <div style="font-size:14px;color:${secondaryTextColor}">@${ev.username}</div>
                </div>
              </div>
              ${ev.isLive ? '<div style="color:#ef4444;font-size:12px;margin:8px 0;display:flex;align-items:center;gap:4px;font-weight:500"><div style="width:8px;height:8px;background:#ef4444;border-radius:50%;animation:pulse 2s infinite"></div>LIVE NOW</div>' : ''}
              ${ev.platforms && ev.platforms.length > 0 ? `<div style="font-size:12px;color:${secondaryTextColor};margin-bottom:12px">Platforms: ${ev.platforms.join(', ')}</div>` : ''}
              <button id="watch-${ev.id}" style="width:100%;padding:12px 16px;border-radius:8px;background:#3b82f6;color:#fff;font-size:14px;font-weight:500;border:none;cursor:pointer;transition:background 0.2s;margin-top:8px" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">Watch Stream</button>
            </div>
          `;

          // Create and show popup with proper persistence
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
            closeOnMove: false,
            maxWidth: '320px',
            className: 'event-popup',
            focusAfterOpen: false
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
          anchor: 'center', // This ensures the marker scales from its center point
          offset: [0, 0] // Explicit offset to prevent any positioning issues
        })
          .setLngLat([ev.lng, ev.lat])
          .addTo(map);

        markersRef.current.set(ev.id, marker);
      } catch (error) {
        console.error(`❌ Error creating marker for event ${ev.id}:`, error);
      }
    });
  }, [events, mapboxgl, theme]);

  // Update markers when events change (no recentering)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    updateMarkers();
  }, [events, mapReady, updateMarkers]);

  // Handle user location changes - center map on user location when available
  useEffect(() => {
    if (mapReady && userLocation && mapRef.current) {
      console.log("📍 Centering map on user location:", userLocation);

      // Fly to user location
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 13,
        duration: 1000,
      });

      // Add user location marker if not already present
      const userMarkerId = 'user-location-marker';
      const existingUserMarker = markersRef.current.get(userMarkerId);

      if (existingUserMarker) {
        // Update existing marker position
        (existingUserMarker as any).setLngLat([userLocation.lng, userLocation.lat]);
      } else {
        // Create new user location marker
        const userMarkerEl = document.createElement("div");
        userMarkerEl.className = "user-location-marker";
        userMarkerEl.style.width = "16px";
        userMarkerEl.style.height = "16px";
        userMarkerEl.style.backgroundColor = "#3b82f6";
        userMarkerEl.style.borderRadius = "50%";
        userMarkerEl.style.border = "3px solid white";
        userMarkerEl.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.5)";
        userMarkerEl.style.position = "relative";
        userMarkerEl.style.animation = "pulse 2s infinite";
        userMarkerEl.style.zIndex = "1001";

        const userMarker = new mapboxgl.Marker({
          element: userMarkerEl,
          anchor: 'center',
        })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(mapRef.current);

        markersRef.current.set(userMarkerId, userMarker);
      }
    }
  }, [userLocation, mapReady, mapboxgl]);

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
    <div className="relative h-full w-full bg-transparent">
      {/* Loading indicator */}
      {!mapReady && mapStyle && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      )}

      {/* Add CSS for pulse animation and popup styling */}
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
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          transform-origin: center center;
        }
        .event-marker:hover {
          transform: scale(1.1);
        }
        
        /* Popup styling overrides */
        :global(.mapboxgl-popup-content) {
          background: white !important;
          color: #1f2937 !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          border: 1px solid #e5e7eb !important;
          padding: 0 !important;
        }
        
        :global(.mapboxgl-popup-close-button) {
          color: #6b7280 !important;
          font-size: 18px !important;
          padding: 8px !important;
          right: 8px !important;
          top: 8px !important;
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 50% !important;
          width: 24px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        :global(.mapboxgl-popup-close-button:hover) {
          background: rgba(255, 255, 255, 1) !important;
          color: #374151 !important;
        }
        
        :global(.mapboxgl-popup-tip) {
          border-top-color: white !important;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          :global(.mapboxgl-popup-content) {
            background: #1f2937 !important;
            color: #f9fafb !important;
            border-color: #374151 !important;
          }
          
          :global(.mapboxgl-popup-close-button) {
            color: #9ca3af !important;
            background: rgba(31, 41, 55, 0.9) !important;
          }
          
          :global(.mapboxgl-popup-close-button:hover) {
            background: rgba(31, 41, 55, 1) !important;
            color: #f3f4f6 !important;
          }
          
          :global(.mapboxgl-popup-tip) {
            border-top-color: #1f2937 !important;
          }
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

      <div
        ref={containerRef}
        className="absolute inset-0 z-0 bg-transparent"
        style={{
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          willChange: "transform",
          minHeight: "100%",
          minWidth: "100%",
        }}
        aria-label={mapReady ? "interactive map" : "loading map"}
      />
    </div>
  );
});

EventsMap.displayName = "EventsMap";

export default EventsMap;
