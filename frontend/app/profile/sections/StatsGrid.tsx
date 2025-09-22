"use client";

import React from "react";

export default function StatsGrid() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="text-base font-semibold">3/20</div>
        <div className="text-sm text-muted-foreground">Events Attended</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="text-base font-semibold">320</div>
          <div className="text-sm text-muted-foreground">Events Hosted</div>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="text-base font-semibold">3 hours</div>
          <div className="text-sm text-muted-foreground">Time spent Reventing</div>
        </div>
      </div>
    </div>
  );
}


