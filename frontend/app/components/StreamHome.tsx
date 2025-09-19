"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import StreamHeader from "./StreamHeader";
import EventsMap, { type LiveEvent, type EventsMapRef } from "./EventsMap";
import EventSearch from "./EventSearch";
import { Camera, ChevronUp, Monitor, Plus, Eye } from "lucide-react";
import OwnerDisplay from "../../components/OwnerDisplay";
import ViewCount from "../../components/ViewCount";
import { useEvents } from "../../hooks/useEvents";
import { useViewCounts } from "../../hooks/useViewCounts";
// import { useViewProfile } from "@coinbase/onchainkit/minikit";
// Removed unused Graph Protocol imports - now handled by API route
type Mode = "map" | "camera" | "screen";

export default function StreamHome() {
  const [mode] = useState<Mode>("map");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showDiscover, setShowDiscover] = useState(true);
  const [searchBarVisible, setSearchBarVisible] = useState(true);
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const mapRef = useRef<EventsMapRef>(null);
  // const viewProfile = useViewProfile();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use React Query for events data
  const { data: events = [], isLoading: eventsLoading } = useEvents();

  // Get view counts for all events (memoized to prevent unnecessary re-renders)
  const eventIds = useMemo(() => events.map(event => event.id), [events]);
  const { data: viewCounts = {}, isLoading: viewsLoading } = useViewCounts(eventIds);

  const filters = ["all", "eat", "café", "bar"]; // exact labels per screenshot

  // Use real events from Graph Protocol for discover section
  // Take the first 4 events and add viewer count simulation
  const discoverEvents = events.slice(0, 4).map(event => ({
    ...event,
    viewers: Math.floor(Math.random() * 200) + 50, // Simulate viewer count
  }));

  // Use real events for curations section
  const curations = events.slice(4, 6).map(event => ({
    id: event.id,
    title: event.title.toLowerCase(),
    image: event.avatarUrl,
    author: event.creator || '', // Store creator address for OwnerDisplay
  }));

  // Use real event creators for curators section
  const curators = events.slice(6, 10).map(event => ({
    id: event.id,
    name: event.creator || '', // Store creator address for OwnerDisplay
    viewers: Math.floor(Math.random() * 100) + 20,
    avatarUrl: event.avatarUrl,
  }));

  const handleEventSelect = (event: LiveEvent) => {
    console.log("Event selected from search:", event);
    console.log("Map ref available:", !!mapRef.current);
    setSelectedEventTitle(event.title); // Set the selected event title
    mapRef.current?.focusOnEvent(event);
  };

  const handleSearch = (searchQuery: string) => {
    // You can add additional search logic here
    console.log("Search query:", searchQuery);
  };

  const handleMapDrag = (isDragging: boolean) => {
    setSearchBarVisible(!isDragging);
  };

  // Show loading state while data is being fetched
  if (eventsLoading) {
    return (
      <div className="space-y-5 w-full">
        <StreamHeader />
        <div className="relative rounded-3xl overflow-hidden border border-[var(--app-card-border)] bg-[var(--app-card-bg)] h-[30rem] w-full shadow-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--app-accent)]"></div>
              <p className="text-[var(--app-foreground-muted)] text-sm">Loading events...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in w-full bg-red-00">
      <StreamHeader />

      {/* Main viewport card */}
      <div className="relative rounded-3xl overflow-hidden border border-gray-200 bg-app-card-bg dark:border-gray-700 h-[30rem] w-full shadow-none">
        {/* Mode preview background */}
        <div className="relative h-full">
          {mode === "map" && (
            <div className="absolute inset-0">
              <EventsMap ref={mapRef} events={events} onMapDrag={handleMapDrag} />
            </div>
          )}

          {mode === "camera" && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white">
              <div className="flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 opacity-80" />
                <span className="text-sm opacity-80">Camera preview</span>
              </div>
            </div>
          )}

          {mode === "screen" && (
            <div className="absolute inset-0 bg-[var(--app-gray)] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Monitor className="w-8 h-8 text-[var(--app-foreground-muted)]" />
                <span className="text-sm text-[var(--app-foreground-muted)]">Screen share</span>
              </div>
            </div>
          )}

          {/* Search bar - responsive to map dragging */}
          <div className={`absolute left-4 right-4 top-4 flex items-center gap-2 transition-all duration-300 ${searchBarVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}>
            <EventSearch
              events={events}
              onEventSelect={handleEventSelect}
              onSearch={handleSearch}
              selectedEventTitle={selectedEventTitle}
              onClearSelectedEvent={() => setSelectedEventTitle("")}
            />
          </div>

          {/* Mode segmented control */}
          <div className="absolute left-4 bottom-4 right-4 flex items-center justify-between">
            <div className="inline-flex items-center bg-black/70 text-white rounded-full p-1">
              <button
                onClick={() => setShowDiscover(!showDiscover)}
                className={`px-3 py-1.5 text-xs rounded-full transition-all flex items-center gap-1 
                  // $
                  // {showDiscover ? "bg-white text-black" : "text-white"}

                  `}
              >
                <ChevronUp className={`w-3 h-3 transition-transform ${showDiscover ? 'rotate-180' : ''}`} />
                Discover
              </button>
            </div>

            <div className="flex items-center gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs shadow-sm bg-white/60 dark:bg-black/40 text-foreground ${activeFilter === f ? " bg-background text-blue-600" : "text-foreground"
                    }`}
                >
                  {f}
                </button>
              ))}
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-white/90 text-black grid place-items-center hover:bg-white transition-colors"
                aria-label="more"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Discover Events Section */}
      {
        showDiscover && (
          <section className="space-y-3 px-4">
            <h3 className="text-sm font-medium">Discover Events</h3>
            <div className="grid grid-cols-2 gap-3">
              {discoverEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/e/${event.id}`}
                  className="rounded-2xl overflow-hidden border border-border bg-card-bg cursor-pointer hover:shadow-lg transition-shadow shadow-none relative h-32 block"
                >
                  {/* Background image covering the whole card */}
                  <div className="absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={event.avatarUrl} alt={event.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                  {/* Live indicator */}
                  {event.isLive && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
                      LIVE
                    </div>
                  )}

                  {/* View count (replaced viewer count) */}
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-10 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <ViewCount
                      count={viewCounts[event.id] || 0}
                      isLoading={viewsLoading}
                      size="sm"
                      showIcon={false}
                    />
                  </div>

                  {/* Text content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                    <div className="font-medium text-sm truncate text-white drop-shadow-sm">{event.title}</div>
                    <div className="text-xs text-white/80 drop-shadow-sm">
                      <OwnerDisplay
                        address={event.creator || ''}
                        className="text-white/80"
                        showIcon={false}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      }

      {/* Curations for you */}
      <section className="space-y-3 px-4">
        <h3 className="text-sm font-medium">Events for you</h3>
        {/* <button onClick={viewProfile}>View Profile</button> */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {curations.map((c) => (
            <Link
              key={c.id}
              href={`/e/${c.id}`}
              className="min-w-[72%] rounded-2xl overflow-hidden border border-border   bg-card-bg shadow block"
            >
              <div className="relative h-32">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <div className="text-xs opacity-90">
                    <OwnerDisplay
                      address={c.author}
                      className="text-white/90"
                      showIcon={false}
                    />
                  </div>
                  <div className="text-base font-semibold leading-tight">{c.title}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Curators for you */}
      <section className="space-y-3 px-4">
        <h3 className="text-sm font-medium">Active Participants for you</h3>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
          {curators.map((u) => (
            <div key={u.id} className="flex flex-col items-center min-w-[72px]">
              <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-white shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-xs mt-1">
                <OwnerDisplay
                  address={u.name}
                  className="text-foreground"
                  showIcon={false}
                />
              </div>
              <div className="text-[10px] text-[var(--app-foreground-muted)] flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {u.viewers}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div >
  );
}


