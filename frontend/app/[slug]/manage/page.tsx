"use client";

import React, { useMemo, useState } from "react";
import ImageEditor from "./sections/ImageEditor";
import DetailsTable from "./sections/DetailsTable";
import ActionsPanel from "./sections/ActionsPanel";
import ParticipantsList from "./sections/ParticipantsList";
import QRCodeBottomSheet from "@/app/components/QRCodeBottomSheet";
import TicketsList, { Ticket } from "./sections/TicketsList";
import { X } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

export default function ManagePage({ params }: Props) {
  const [values, setValues] = useState<Record<string, string>>({
    title: "Sample Event",
    location: "Los Angeles, CA",
    start: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
    end: new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 16),
    maxAttendees: "250",
    registrationFee: "0.01 ETH",
    description: "A creative session exploring decentralized events onchain.",
  });

  const fields = useMemo(
    () => [
      { key: "title", label: "Title", type: "text" as const },
      { key: "location", label: "Location", type: "text" as const },
      { key: "start", label: "Start", type: "datetime" as const },
      { key: "end", label: "End", type: "datetime" as const },
      { key: "maxAttendees", label: "Max Attendees", type: "number" as const },
      { key: "registrationFee", label: "Registration Fee", type: "text" as const },
      { key: "description", label: "Description", type: "textarea" as const },
    ],
    []
  );

  const [saving, setSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const tickets: Ticket[] = [
    { name: "General Admission", type: "standard", price: "0.01 ETH", quantity: 150 },
    { name: "VIP", type: "vip", price: "0.05 ETH", quantity: 25 },
  ];
  const onSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          {/* <div>
            <h1 className="text-2xl font-bold">Manage Event</h1>
            <p className="text-sm text-muted-foreground">Update content, details and media</p>
          </div> */}
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-xl bg-[var(--events-accent,theme(colors.indigo.600))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Image / Media Editor */}
        <ImageEditor />

        {/* Actions */}
        <div className="mt-8">
          <ActionsPanel
            onPublish={() => console.log("publish")}
            onEnd={() => console.log("end")}
            onCancel={() => console.log("cancel")}
            onGenerateQR={() => setQrOpen(true)}
            onEditToggle={() => setShowDetails((s) => !s)}
            isEditing={showDetails}
          />
        </div>

        {/* Details table (hidden until Edit Event) */}
        {showDetails && (
          <div className="mt-8">
            <DetailsTable
              fields={fields}
              values={values}
              onChange={(k, v) => setValues((p) => ({ ...p, [k]: v }))}
            />
          </div>
        )}

        {/* Participants */}
        <div className="mt-8">
          <ParticipantsList />
        </div>

        {/* Tickets - hidden when none */}
        {tickets.length > 0 && (
          <div className="mt-8">
            <TicketsList tickets={tickets} />
          </div>
        )}
      </div>
      <button onClick={() => console.log("cancel")} className="rounded-xl bg-rose-600/90 px-3 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-2 w-[92%] mx-auto mt-4 h-10 mb-20">
        <X className="h-4 w-4" /> Cancel Event
      </button>

      <QRCodeBottomSheet
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        eventId={values.title || "event"}
        eventTitle={values.title}
      />
    </div>
  );
}


