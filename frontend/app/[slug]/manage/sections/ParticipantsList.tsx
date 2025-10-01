"use client";

import ContractButton from "@/app/components/button/ContractButton";
import useEventIdBySlug from "@/hooks/useEventIdBySlug";
import { eventAbi, eventAddress } from "@/lib/contract";
import { useParams } from "next/navigation";
import React from "react";
import { Abi } from "viem";

const MOCK = Array.from({ length: 6 }).map((_, i) => ({
  addr: `0x${(123456 + i).toString(16)}...${(9876 + i).toString(16)}`,
  name: `User ${i + 1}`,
  status: i % 3 === 0 ? "confirmed" : i % 3 === 1 ? "registered" : "attended",
}));

export default function ParticipantsList() {
  const eventSlug = useParams().slug as string;
  const { eventId } = useEventIdBySlug(eventSlug);
  console.log("Event Id", eventId)
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
            {/* <span className="rounded-full px-2 py-1 text-xs capitalize ring-1 ring-border bg-background"> */}
            <ContractButton
              address={eventAddress as `0x${string}`}
              abi={eventAbi.abi as Abi}
              functionName="markAttended"
              args={[BigInt(eventId || 0), "0xf0830060f836B8d54bF02049E5905F619487989e" as `0x${string}`]}
              btnClassName="px-2 text-xs capitalize ring-1 ring-border bg-background"
              idleLabel={p.status}
              onWriteSuccess={() => {
                console.log("Marked attended");
              }}
            />
            {/* {p.status} */}
            {/* </span> */}
          </div>
        ))}
      </div>
    </div>
  );
}


