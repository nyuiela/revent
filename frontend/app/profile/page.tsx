"use client";

import React from "react";
import ProfileHeader from "./sections/ProfileHeader";
import ProgressCard from "./sections/ProgressCard";
import InviteCard from "./sections/InviteCard";
import StatsGrid from "./sections/StatsGrid";
import Image from "next/image";
import NftCard from "./sections/NftCard";
import EventBoard from "./sections/manage";
import TxHistory from "./sections/TxHistory";
import { AuthGuard } from "@/contexts/AuthProvider";

export default function ProfilePage() {
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
              <EventBoard />
              <div className="mt-6" />
              <h2 className="text-lg px-2 py-4 font-semibold">Transaction History</h2>
              <TxHistory />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}


