"use client";

import { useEffect } from "react";
import Link from "next/link";
import StreamHeader from "./StreamHeader";
import { Eye } from "lucide-react";
type Mode = "map" | "camera" | "screen";

export default function StreamHome() {


   useEffect(() => {
      let cancelled = false;
      async function load() {
         try {
            // Use the new Graph Protocol API endpoint
            const res = await fetch("/api/events/graph");
            const json = await res.json();
            if (!cancelled) {
               setEvents(json.events || []);
               console.log(`Loaded ${json.events?.length || 0} events from Graph Protocol`);
            }
         } catch (error) {
            console.error("Error loading events from Graph Protocol:", error);
            // Fallback to empty array on error
            if (!cancelled) setEvents([]);
         }
      }
      load();
      // Refresh every 30 seconds to get new events
      const t = setInterval(load, 30000);
      return () => {
         cancelled = true;
         clearInterval(t);
      };
   }, []);

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
      author: `@${event.username}`,
   }));

   // Use real event creators for curators section
   const curators = events.slice(6, 10).map(event => ({
      id: event.id,
      name: event.username,
      viewers: Math.floor(Math.random() * 100) + 20,
      avatarUrl: event.avatarUrl,
   }));


   return (
      <div className="space-y-5 animate-fade-in w-full bg-red-00">
         <StreamHeader />

         {/* Main viewport card */}
         <div className="relative rounded-3xl overflow-hidden border border-[var(--app-card-border)] bg-[var(--app-card-bg)] bg-red-00 h-[30rem] w-full shadow-none">

         </div>



         {/* Curations for you */}
         <section className="space-y-3 px-4">
            <h3 className="text-sm font-medium">Events for you</h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
               {curations.map((c) => (
                  <Link
                     key={c.id}
                     href={`/e/${c.id}`}
                     className="min-w-[72%] rounded-2xl overflow-hidden border border-[var(--app-card-border)] bg-[var(--app-card-bg)] shadow block"
                  >
                     <div className="relative h-32">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 left-2 right-2 text-white">
                           <div className="text-xs opacity-90">{c.author}</div>
                           <div className="text-base font-semibold leading-tight">{c.title}</div>
                        </div>
                     </div>
                  </Link>
               ))}
            </div>
         </section>

         {/* Curators for you */}
         <section className="space-y-3 px-4">
            <h3 className="text-sm font-medium">Live Streams for you</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
               {curators.map((u) => (
                  <div key={u.id} className="flex flex-col items-center min-w-[72px]">
                     <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-white shadow">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="text-xs mt-1">{u.name}</div>
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


