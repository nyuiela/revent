"use client";

import React from "react";
import { QrCode, Pencil, Play, Square, X } from "lucide-react";
import { chainId, eventAbi, eventAddress } from "@/lib/contract";
import { Abi } from "viem";
import ContractButton from "@/app/components/button/ContractButton";
import MultiContractButton from "@/app/components/button/MultiContractButton";
import { useEventStatus } from "@/hooks/useEventStatus";

export default function ActionsPanel({
  onPublish,
  onEnd,
  onCancel,
  onGenerateQR,
  onEditToggle,
  isEditing,
  eventId,
}: {
  onPublish: () => void;
  onEnd: () => void;
  onCancel: () => void;
  onGenerateQR: () => void;
  onEditToggle: () => void;
  isEditing: boolean;
  eventId?: string | number;
}) {
  const { statusData, loading: statusLoading } = useEventStatus(eventId);

  // Determine if publish button should be shown
  const canPublish = statusData?.statusName === "DRAFT" || !statusData;
  const isPublished = statusData?.statusName === "PUBLISHED";
  const isLive = statusData?.statusName === "LIVE";
  const isCompleted = statusData?.statusName === "COMPLETED";
  const isCancelled = statusData?.statusName === "CANCELLED";
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


      {/* Status Display */}
      <div className="mb-4 p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Event Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusData?.statusName === "DRAFT" ? "bg-yellow-100 text-yellow-800" :
            statusData?.statusName === "PUBLISHED" ? "bg-blue-100 text-blue-800" :
              statusData?.statusName === "LIVE" ? "bg-green-100 text-green-800" :
                statusData?.statusName === "COMPLETED" ? "bg-gray-100 text-gray-800" :
                  statusData?.statusName === "CANCELLED" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
            }`}>
            {statusLoading ? "Loading..." : statusData?.statusName || "DRAFT"}
          </span>
        </div>
      </div>

      {/* Publish Button - Only show if status is DRAFT */}
      {canPublish && (
        <>
          {/* Example of MultiContractButton for complex operations */}
          <div className="mt-2">
            <MultiContractButton
              contracts={[
                {
                  address: eventAddress as `0x${string}`,
                  abi: eventAbi.abi as Abi,
                  functionName: "publishEvent",
                  args: [BigInt(eventId || 0)]
                },
                {
                  address: eventAddress as `0x${string}`,
                  abi: eventAbi.abi as Abi,
                  functionName: "setConfirmationCode",
                  args: [BigInt(eventId || 0), "123456"] // eventId, maxTickets, price
                }
              ]}
              chainId={Number(chainId)}
              className="w-full h-fit"
              btnClassName="w-full bg-emerald-600 text-white"
              idleLabel="Publish Event"
              sequential={true}
              onWriteSuccess={() => {
                console.log("Multi-contract operation completed");
                window.location.reload();
              }}
            />
          </div>

          <div className="text-xs text-amber-600 w-[90%] text-center mx-auto mt-2">
            Your event is in draft mode. Publish it to the blockchain to make it live.
          </div>
        </>
      )}

      {/* Status-specific messages */}
      {/* {isPublished && (
        <div className="text-xs text-blue-600 w-[90%] text-center mx-auto mt-2">
          Event is published and ready to go live.
        </div>
      )} */}
      {/* 
      {isLive && (
        <div className="text-xs text-green-600 w-[90%] text-center mx-auto mt-2">
          Event is currently live and accepting attendees.
        </div>
      )} */}

      {isCompleted && (
        <div className="text-xs text-gray-600 w-[90%] text-center mx-auto mt-2">
          Event has been completed.
        </div>
      )}

      {isCancelled && (
        <div className="text-xs text-red-600 w-[90%] text-center mx-auto mt-2">
          Event has been cancelled.
        </div>
      )}

      {/* </div> */}
      <div className="grid grid-cols-2 gap-3 max-h-20 items-start mt-4">
        {/* End Event Button - Only show if event is LIVE or PUBLISHED */}
        {(isLive || isPublished) && (
          <ContractButton
            idleLabel={"End Event"}
            chainId={Number(chainId)}
            abi={eventAbi.abi as Abi}
            address={eventAddress as `0x${string}`}
            functionName="endEvent"
            className="w-full h-fit"
            btnClassName="w-full bg-rose-600/80 text-white"
            args={[BigInt(eventId || 0)]}
            onWriteSuccess={() => {
              console.log("end");
              // Refetch status after successful end
              window.location.reload();
            }}
          />
        )}

        {/* Cancel Event Button - Only show if event is DRAFT or PUBLISHED */}
        {/* {(canPublish || isPublished) && (
          <ContractButton
            idleLabel={"Cancel Event"}
            chainId={Number(chainId)}
            abi={eventAbi.abi as Abi}
            address={eventAddress as `0x${string}`}
            functionName="cancelEvent"
            className="w-full h-fit"
            btnClassName="w-full bg-red-600/80 text-white"
            args={[BigInt(eventId || 0)]}
            onWriteSuccess={() => {
              console.log("cancel");
              // Refetch status after successful cancel
              window.location.reload();
            }}
          />
        )} */}

        <button onClick={onGenerateQR} className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-center gap-2 max-h-12">
          <QrCode className="h-4 w-4" /> QR Code
        </button>
      </div>


    </div >
  );
}


