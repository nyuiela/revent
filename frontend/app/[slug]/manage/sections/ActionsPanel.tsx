"use client";

import React from "react";
import { QrCode, Pencil, Play, Square, X } from "lucide-react";
import { chainId, eventAbi, eventAddress } from "@/lib/contract";
import { Abi } from "viem";
import ContractButton from "@/app/components/button/ContractButton";

export default function ActionsPanel({
  onPublish,
  onEnd,
  onCancel,
  onGenerateQR,
  onEditToggle,
  isEditing,
}: {
  onPublish: () => void;
  onEnd: () => void;
  onCancel: () => void;
  onGenerateQR: () => void;
  onEditToggle: () => void;
  isEditing: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 text-sm text-muted-foreground flex items-center justify-between">
        <p>
          Quick actions
        </p>

        {/* <div className="mt-4 flex items-center justify-end"> */}
        <button onClick={onEditToggle} className="inline-flex items-center gap-2 rounded-xl border-none underline border-border px-3 py-2 text-sm hover:bg-muted/50">
          <Pencil className="h-4 w-4" /> {isEditing ? "Hide details" : "Edit event"}
        </button>
        {/* </div> */}
      </div>
      {/* <div className="rounded-2xl border border-muted-foreground/40 bg-muted p-4 my-2"> */}


      <ContractButton
        idleLabel={"Publish Event"}
        chainId={Number(chainId)}
        abi={eventAbi.abi as Abi}
        address={eventAddress as `0x${string}`}
        functionName="publishEvent"
        className="w-full h-fit"
        btnClassName="w-full bg-indigo-600 text-white"
        args={[BigInt(0)]}
        onWriteSuccess={() => console.log("publish")}
      />
      <div className="text-xs text-red-500 w-[90%] text-center mx-auto mt-2">Your event is in draft mode. Publish it to the blockchain to make it live.</div>

      {/* </div> */}
      <div className="grid grid-cols-2 gap-3 max-h-20 items-start mt-4">
        {/* <button onClick={onEnd} className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-center gap-2">
          <Square className="h-4 w-4" /> End
        </button> */}
        <ContractButton
          idleLabel={"End Event"}
          chainId={Number(chainId)}
          abi={eventAbi.abi as Abi}
          address={eventAddress as `0x${string}`}
          functionName="endEvent"
          className="w-full h-fit"
          btnClassName="w-full bg-rose-600/80 text-white"
          args={[BigInt(0)]}
          onWriteSuccess={() => console.log("end")}
        />
        <button onClick={onGenerateQR} className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-center gap-2 max-h-12">
          <QrCode className="h-4 w-4" /> QR Code
        </button>
      </div>


    </div >
  );
}


