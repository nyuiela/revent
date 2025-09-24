"use client";

import React, { useState } from "react";
import ProfileHeader from "./sections/ProfileHeader";
import ProgressCard from "./sections/ProgressCard";
import InviteCard from "./sections/InviteCard";
import StatsGrid from "./sections/StatsGrid";
import Image from "next/image";
import NftCard from "./sections/NftCard";
import EventBoard from "./sections/manage";
import TxHistory from "./sections/TxHistory";
import { AuthGuard } from "@/contexts/AuthProvider";

type ManageEvent = {
  id: string;
  title: string;
  username: string;
  slug: string;
  avatarUrl: string;
  creator: string;
  isLive: boolean;
  startTime: string;
  endTime: string;
  maxAttendees: string;
  registrationFee: string;
  blockTimestamp: string;
};

type TxEvent = {
  id: string;
  eventId: string;
  title: string;
  avatarUrl: string;
  creator: string;
  transactionCount: number;
};

export default function ProfilePage() {
  const [sharedEvents, setSharedEvents] = useState<TxEvent[]>([]);

  const handleEventsLoaded = (events: ManageEvent[]) => {
    // Convert manage events to tx history events format
    const convertedEvents: TxEvent[] = events.map(event => ({
      id: event.id,
      eventId: event.id, // Using id as eventId for now
      title: event.title,
      avatarUrl: event.avatarUrl,
      creator: event.creator,
      transactionCount: 0 // Will be updated when transactions are fetched
    }));
    setSharedEvents(convertedEvents);
  };
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-foreground mb-24">
        <div className="mx-auto w-full max-w-md px-0 py-8">
          <ProfileHeader />

          <div className="mt-6 bg-background p-0">
            <div className="flex flex-col items-center px-0 pt-8">
              <Image alt="mascot" src="/icon.png" className="h-28 w-28 rounded-full object-contain" height={112} width={112} />
            </div>

            <div className="px-4 pb-6 pt-4">
              <NftCard />
              <div className="mt-6" />
              {/* <ProgressCard /> */}
              {/* <div className="mt-4" />
              <InviteCard /> */}
              <div className="mt-6" />
              <StatsGrid />
              <div className="mt-6" />
              <h2 className="text-lg px-2 py-4 font-semibold">Creator Board</h2>
              <EventBoard onEventsLoaded={handleEventsLoaded} />
              <div className="mt-6" />
              <h2 className="text-lg px-2 py-4 font-semibold">Transaction History</h2>
              <TxHistory events={sharedEvents} />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}


