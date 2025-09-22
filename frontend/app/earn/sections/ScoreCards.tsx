"use client";

import React from "react";

export default function ScoreCards() {
  return (
    <div className="grid gap-4 grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm text-muted-foreground">Value Created #1</div>
        <div className="mt-2 text-4xl font-bold">0</div>
        <div className="mt-1 text-xs text-muted-foreground">Distributed Sep 17th</div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm text-muted-foreground">Value Created #2</div>
        <div className="mt-2 text-4xl font-bold">0</div>
        <div className="mt-1 text-xs text-muted-foreground">Coming Soon</div>
      </div>
    </div>
  );
}


