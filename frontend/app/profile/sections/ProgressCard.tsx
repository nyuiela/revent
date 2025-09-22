"use client";

import React from "react";

export default function ProgressCard() {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="px-4 pb-4 pt-3 text-sm text-muted-foreground">
        You have your first signs & techniques. Keep up motivation and make this a habit.
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E9E6FF]">🛡️</span>
            Lv. 2
          </div>
          <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-[#E9E6FF]">
            <div className="absolute left-0 top-0 h-full w-[22%] rounded-full bg-[#6C5CE7]" />
          </div>
          <div className="text-xs text-muted-foreground">22%</div>
        </div>
      </div>
    </div>
  );
}


