"use client";

import { useState, useEffect, useRef } from "react";
import { type LiveEvent } from "./EventsMap";
import { Search, MapPin, Send } from "lucide-react";
import Image from "next/image";

type Props = {
  events: LiveEvent[];
  onEventSelect: (event: LiveEvent) => void;
  onSearch: (query: string) => void;
  selectedEventTitle?: string; // Add this prop to receive the selected event title
  onClearSelectedEvent?: () => void; // Add callback to clear selected event
};

export default function EventSearch({
  events,
  onEventSelect,
  onSearch,
  selectedEventTitle,
  onClearSelectedEvent,
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<LiveEvent[]>([]);
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Update query when selectedEventTitle changes (when an event is selected from search)
  useEffect(() => {
    if (selectedEventTitle) {
      setQuery(selectedEventTitle);
      setIsOpen(false);
    }
  }, [selectedEventTitle]);

  useEffect(() => {
    if (query.trim() === "") {
      setFilteredEvents([]);
      setIsOpen(false);
      return;
    }

    const filtered = events.filter(
      (event) =>
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.username.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredEvents(filtered);
    setIsOpen(filtered.length > 0);
  }, [query, events]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEventSelect = (event: LiveEvent) => {
    onEventSelect(event);
    setQuery("");
    setIsOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div ref={searchRef} className="relative flex-1">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="flex-1 flex items-center bg-muted text-muted-foreground rounded-full px-4 py-2.5  shadow-sm">
          <Search className="w-4 h-4 mr-2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Clear selected event title when user starts typing
              if (
                selectedEventTitle &&
                e.target.value !== selectedEventTitle &&
                onClearSelectedEvent
              ) {
                onClearSelectedEvent();
              }
            }}
            placeholder="Search for something"
            className="bg-transparent placeholder-muted-foreground text-sm w-full focus:outline-none"
            onFocus={() => query.trim() !== "" && setIsOpen(true)}
          />
        </div>
        <button
          type="submit"
          className="w-10 h-10 rounded-full bg-muted text-muted-foreground grid place-items-center hover:bg-muted-hover transition-colors shadow-sm"
          aria-label="search"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-background max-h-64 overflow-y-auto z-10">
          {filteredEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => handleEventSelect(event)}
              className="w-full flex items-center gap-3 p-3 hover:bg-background text-left border-b border-background last:border-b-0 transition-colors bg-background"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={event.avatarUrl}
                  alt={event.username}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate text-foreground">
                  {event.title}
                </div>
                <div className="text-xs text-gray-500">
                  @{event.username}
                  {event.isLive && (
                    <span className="ml-2 text-red-500 font-medium">
                      • LIVE
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                <MapPin className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
