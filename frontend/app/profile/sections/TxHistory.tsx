"use client";

import React from "react";
import Image from "next/image";

type TxRow = {
  hash: string;
  action: string; // human readable message
  kind:
  | "create_event"
  | "create_tickets"
  | "publish_event"
  | "cancel_event"
  | "mint_nft"
  | "register"
  | "confirm_attendance";
  amount?: string; // optional, e.g., 0.01 ETH gas/fee
  date: string;
  link?: string;
};

const txs: TxRow[] = [
  { hash: "0x9a12...4f3c", action: "Create Event", kind: "create_event", amount: "0.004 ETH", date: "2025-09-20", link: "https://basescan.org/tx/0x9a12" },
  { hash: "0x2b77...cad1", action: "Create Tickets", kind: "create_tickets", amount: "0.006 ETH", date: "2025-09-20", link: "https://basescan.org/tx/0x2b77" },
  { hash: "0x55d3...e0ab", action: "Publish Event", kind: "publish_event", amount: "0.003 ETH", date: "2025-09-21", link: "https://basescan.org/tx/0x55d3" },
  { hash: "0x88a2...11ff", action: "Mint Event NFT", kind: "mint_nft", amount: "0.002 ETH", date: "2025-09-22", link: "https://basescan.org/tx/0x88a2" },
  { hash: "0x71bc...ae90", action: "Registered for Event", kind: "register", amount: "0.00 ETH", date: "2025-09-22", link: "https://basescan.org/tx/0x71bc" },
  { hash: "0xabcd...0099", action: "Confirmed Attendance", kind: "confirm_attendance", amount: "0.00 ETH", date: "2025-09-23", link: "https://basescan.org/tx/0xabcd" },
];

function KindBadge({ kind }: { kind: TxRow["kind"] }) {
  const map: Record<TxRow["kind"], { label: string; className: string }> = {
    create_event: { label: "Create", className: "bg-indigo-500/10 text-indigo-600" },
    create_tickets: { label: "Tickets", className: "bg-amber-500/10 text-amber-600" },
    publish_event: { label: "Publish", className: "bg-emerald-500/10 text-emerald-600" },
    cancel_event: { label: "Cancel", className: "bg-rose-500/10 text-rose-600" },
    mint_nft: { label: "Mint NFT", className: "bg-fuchsia-500/10 text-fuchsia-600" },
    register: { label: "Register", className: "bg-sky-500/10 text-sky-600" },
    confirm_attendance: { label: "Attendance", className: "bg-purple-500/10 text-purple-600" },
  };
  const s = map[kind];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-border ${s.className}`}>{s.label}</span>
  );
}

export default function TxHistory() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-[110px_1fr_120px] border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
        <div>Tx</div>
        <div>Details</div>
        <div className="text-right">Date</div>
      </div>
      <div>
        {txs.map((t, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[110px_1fr_120px] items-center px-6 py-4 odd:bg-background"
          >
            {/* TxType + Tx */}
            <div className="flex items-center gap-3 text-sm flex-col">
              <KindBadge kind={t.kind} />
              <button className="text-xs underline" onClick={() => t.link && window.open(t.link, "_blank")}>{t.hash}</button>
            </div>
            {/* Details */}
            <div className="text-sm">
              <div className="font-semibold">{t.action}</div>
              <div className="text-xs text-muted-foreground">{t.amount ? `${t.amount} gas/fee` : ""}</div>
            </div>
            {/* Date */}
            <div className="text-right text-sm">{t.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


