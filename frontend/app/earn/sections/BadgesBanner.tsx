"use client";

import React from "react";

export default function BadgesBanner() {
  return (
    <div className="rounded-2xl border border-emerald-300/40 bg-emerald-500/30 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">🏅</span> */}
          <div>
            <div className="font-medium text-foreground dark:text-foreground">Creator Badges Coming Soon</div>
            <div className="text-sm text-foreground/80 dark:text-foreground/80">Earn badges by contributing to the community.</div>
          </div>
        </div>
        <button className="rounded-md px-2 py-1 text-xl text-emerald-700 hover:bg-emerald-500/20">×</button>
      </div>
    </div>
  );
}


