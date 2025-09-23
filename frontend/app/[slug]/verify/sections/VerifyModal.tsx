"use client";

import React from "react";
import { CheckCircle2, QrCode, Ticket, X } from "lucide-react";
import { chainId, eventAbi, eventAddress } from "@/lib/contract";
import { Abi } from "viem";
import ContractButton from "@/app/components/button/ContractButton";

export default function VerifyModal({
  isOpen,
  code,
  eventId,
  onClose,
  onConfirm,
  onMint,
}: {
  isOpen: boolean;
  code: string;
  eventId?: string | number;
  onClose: () => void;
  onConfirm: () => void;
  onMint: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl bg-card p-6 text-foreground shadow-2xl">
        <button aria-label="close" onClick={onClose} className="absolute right-3 top-3 rounded-full p-2 hover:bg-muted/50">
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--events-accent,theme(colors.indigo.600))]/15 text-[var(--events-accent,theme(colors.indigo.600))]">
            <Ticket className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold">Mint Attendance NFT</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm your attendance to receive your NFT.
            {eventId && <span className="block mt-1 text-xs">Event ID: {eventId}</span>}
          </p>

          <div className="mt-5 w-full rounded-xl border border-border bg-background p-4 text-left">
            <div className="text-xs text-muted-foreground">Confirmation code</div>
            <div className="mt-1 font-mono text-sm">{code || "—"}</div>
          </div>

          <div className="mt-6 grid w-full grid-cols-1 gap-3">
            {/* <button
              onClick={onConfirm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:opacity-90"
            >
            </button> */}
            <ContractButton
              idleLabel={<>
                <CheckCircle2 className="h-4 w-4" />
                Confirm participation
              </>
              }
              chainId={Number(chainId)}
              abi={eventAbi.abi as Abi}
              address={eventAddress as `0x${string}`}
              functionName="confirmAttendance"
              className="w-full h-fit p-0"
              btnClassName="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:opacity-90 w-full"
              args={[BigInt(eventId || 0), code]}
              onWriteSuccess={() => {
                console.log("Attendance confirmed for event", eventId);
                onConfirm();
              }}
            />
            {/* <button
              onClick={onMint}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted/50"
            >
              <QrCode className="h-4 w-4" /> Mint NFT
            </button> */}
          </div>

          <div className="mt-4 text-[11px] text-muted-foreground">powered by revent</div>
        </div>
      </div>
    </div>
  );
}


