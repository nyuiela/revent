"use client";

import React from "react";

type Row = {
  rank: string;
  name: string;
  earnings: string;
  score: number;
  avatar?: string;
  trend?: "up" | "down" | null;
};

const rows: Row[] = [
  { rank: "#1", name: "Base Community Call #1 🔵", earnings: "2,985", score: 319 },
  { rank: "#2", name: "Base Community Call #2 🟡🎩↗", earnings: "7,337", score: 316 },
  { rank: "#3", name: "Pizza Party House ", earnings: "91.4K", score: 287 },
  { rank: "#4", name: "Digital World 2025", earnings: "625", score: 278 },
];

export default function Leaderboard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-[100px_1fr_100px] border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
        <div>RANK</div>
        <div>EVENT</div>
        <div className="text-right">SCORE</div>
      </div>
      <div>
        {rows.map((r, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[100px_1fr_100px] items-center px-4 py-4 odd:bg-background"
          >
            <div className="text-sm font-semibold text-muted-foreground">{r.rank}</div>
            <div className="flex items-center gap-3">
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground">Total Value: {r.earnings}</div>
              </div>
            </div>
            <div className="text-right text-base font-bold">{r.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


