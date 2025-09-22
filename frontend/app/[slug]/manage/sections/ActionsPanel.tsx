"use client";

import React from "react";
import { QrCode, Pencil, Play, Square, X } from "lucide-react";

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
      <div className="rounded-2xl border border-muted-foreground/40 bg-muted p-4 my-2">
        <div className="flex flex-col items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-600">🏅</span> */}
            <div>
              {/* <div className="font-medium text-muted-foreground">Publish your event to the blockchain</div> */}
              <div className="text-sm text-red-500">Your event is in draft mode. Publish it to the blockchain to make it live.</div>

            </div>

          </div>
          <button onClick={onPublish} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-background hover:opacity-90 flex items-center justify-center gap-2 w-full">
            <Play className="h-4 w-4" /> Publish
          </button>
          {/* <button className="rounded-md px-2 py-1 text-sm text-pink-700 hover:bg-pink-500/20">×</button> */}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button onClick={onEnd} className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-center gap-2">
          <Square className="h-4 w-4" /> End
        </button>
        <button onClick={onGenerateQR} className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-center gap-2">
          <QrCode className="h-4 w-4" /> QR Code
        </button>
      </div>


    </div >
  );
}


