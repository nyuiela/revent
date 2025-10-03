"use client";

import React, { useState } from "react";
import CreateEventBottomSheet from "@/components/CreateEventBottomSheet";

export default function BetaCreateEventPage() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Create an Event (Beta)</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A faster flow with a bottom sheet guided setup.
        </p>

        <div className="mt-6">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start creating
          </button>
        </div>
      </div>

      <CreateEventBottomSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}


