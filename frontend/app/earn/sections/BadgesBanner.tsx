"use client";

import React from "react";

export default function BadgesBanner() {
  return (
    <div className="rounded-2xl border border-indigo-300/40 bg-indigo-500/10 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-600">🏅</span>
          <div>
            <div className="font-medium text-indigo-700 dark:text-indigo-300">Creator Badges Coming Soon</div>
            <div className="text-sm text-indigo-800/80 dark:text-indigo-200/80">Earn badges by contributing to the community.</div>
          </div>
        </div>
        <button className="rounded-md px-2 py-1 text-xl text-indigo-700 hover:bg-indigo-500/20">×</button>
      </div>
    </div>
  );
}


