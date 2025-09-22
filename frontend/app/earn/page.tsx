"use client";

import React from "react";
import ScoreCards from "./sections/ScoreCards";
import BadgesBanner from "./sections/BadgesBanner";
import Leaderboard from "./sections/Leaderboard";
import Image from "next/image";

export default function EarnPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* <div className="h-16 w-16 rounded-full bg-[var(--app-gray)] overflow-hidden">
              <Image
                alt="Avatar"
                src="/icon.png"
                height={30}
                width={64}
                className="h-full w-full object-cover"
              />
            </div> */}
            <div>
              <h1 className="text-2xl font-bold">Revalue</h1>
              <p className="text-sm text-muted-foreground">Total Value Created: 0</p>
            </div>
          </div>

          <button className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50">
            Settings
          </button>
        </div>

        {/* Score Cards */}
        <div className="mt-6">
          <ScoreCards />
        </div>

        {/* Badges banner */}
        <div className="mt-6">
          <BadgesBanner />
        </div>

        {/* Leaderboard */}
        <div className="mt-6">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}


