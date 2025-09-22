"use client";

import React from "react";

const MOCK = Array.from({ length: 6 }).map((_, i) => ({
  addr: `0x${(123456 + i).toString(16)}...${(9876 + i).toString(16)}`,
  name: `User ${i + 1}`,
  status: i % 3 === 0 ? "confirmed" : i % 3 === 1 ? "registered" : "attended",
}));

export default function ParticipantsList() {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-medium">Participants</div>
        <div className="text-xs text-muted-foreground">{MOCK.length} total</div>
      </div>
      <div className="divide-y divide-border">
        {MOCK.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.addr}</div>
            </div>
            <span className="rounded-full px-2 py-1 text-xs capitalize ring-1 ring-border bg-background">
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


