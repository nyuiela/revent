"use client";

import React from "react";

export default function InviteCard() {
  return (
    <div className="rounded-2xl bg-[#F7F6FF] p-4 ring-1 ring-black/5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-white">⏳</div>
        <div className="flex-1">
          <div className="font-medium">Waiting for hidden qualities...</div>
          <div className="text-sm text-muted-foreground">See results here once friends/family answered questions</div>
          <button className="mt-3 w-full rounded-xl bg-[#6C5CE7] py-3 text-sm font-medium text-white hover:opacity-90">Share with friends</button>
        </div>
      </div>
    </div>
  );
}


