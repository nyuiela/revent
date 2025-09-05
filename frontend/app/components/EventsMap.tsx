"use client";

import { useRef, useState, forwardRef } from "react";
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

const EventsMap = forwardRef<EventsMapRef, Props>(({ events, onMapDrag }, ref) => {
   const containerRef = useRef<HTMLDivElement | null>(null);
   const [mapReady, setMapReady] = useState(false);
   const [hoveredEvent, setHoveredEvent] = useState<LiveEvent | null>(null);

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
