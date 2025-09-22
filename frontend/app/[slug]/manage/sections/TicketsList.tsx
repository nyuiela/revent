"use client";

import React from "react";

export type Ticket = {
  name: string;
  type: string;
  price: string; // formatted (e.g., 0.01 ETH)
  quantity: number;
};

export default function TicketsList({ tickets }: { tickets: Ticket[] }) {
  if (!tickets || tickets.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-medium">Tickets</div>
        <div className="text-xs text-muted-foreground">{tickets.length} type{tickets.length > 1 ? "s" : ""}</div>
      </div>
      <div className="divide-y divide-border">
        {tickets.map((t, i) => (
          <div key={`${t.name}-${i}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3">
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.type}</div>
            </div>
            <div className="text-sm">{t.price}</div>
            <div className="text-xs text-muted-foreground">{t.quantity} available</div>
          </div>
        ))}
      </div>
    </div>
  );
}


