"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/app/components/DemoComponents";

type Row = {
  // rank: string;
  name: string;
  earnings: string;
  link: string;
  avatar?: string;
  trend?: "up" | "down" | null;
};

const rows: Row[] = [
  // { name: "Juampi 🥙", earnings: "$2,247", link: "/slug/manage", avatar: "/icon.png" },
  { name: "Base Community Call #1 🔵", earnings: "$2,985", link: "/slug/manage" },
  { name: "Base Community Call #2 🟡🎩↗", earnings: "$7,337", link: "/slug/manage" },
  { name: "Pizza Party House ", earnings: "$91.4K", link: "/slug/manage" },
  { name: "Digital World 2025", earnings: "$625", link: "/slug/manage" },
];

export default function EventBoard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-[100px_1fr_100px] border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
        {/* <div>RANK</div> */}
        <div>EVENT</div>
        <div className="">TITLE</div>
        {/* <div className="text-right">MANAGE</div> */}
      </div>
      <div>
        {rows.map((r, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[100px_1fr_100px] items-center px-6 py-4 odd:bg-background"
          >
            <div className="text-sm font-semibold text-muted-foreground">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-border bg-muted">
                <Image src={r.avatar || "/icon.png"} alt="avatar" className="h-full w-full object-cover" height={64} width={64} />
              </div>
            </div>
            <div className="flex items-center gap-3">

              <div>
                <div className="font-semibold">{r.name}</div>
                {/* <div className="text-xs text-muted-foreground">Total Earnings: {r.earnings}</div> */}
              </div>
            </div>
            <div className="text-right text-base font-bold " onClick={() => window.open(r.link, '_blank')}>
              <Button variant="secondary" size="sm" className="w-sm bg-muted rounded-md px-2 py-1" onClick={() => window.open(r.link, '_blank')}>
                manage
              </Button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}


