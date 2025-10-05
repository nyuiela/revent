"use client";

import React, { useEffect, useMemo, useState } from "react";
import ImageEditor from "./sections/ImageEditor";
import DetailsTable from "./sections/DetailsTable";
import ActionsPanel from "./sections/ActionsPanel";
import ParticipantsList from "./sections/ParticipantsList";
import QRCodeBottomSheet from "@/app/components/QRCodeBottomSheet";
import TicketsList, { Ticket } from "./sections/TicketsList";
import StreamHeader from "@/app/components/StreamHeader";
import { Button } from "@/app/components/DemoComponents";
import { useAccount } from "wagmi";
import { Abi } from "viem";
import { chainId, eventAbi, eventAddress } from "@/lib/contract";
import ContractButton from "@/app/components/button/ContractButton";
import { AuthGuard } from "@/contexts/AuthProvider";
// import { ConnectWallet } from "@coinbase/onchainkit/wallet";

type Props = {
  params: Promise<{ slug: string }>;
};

export default function ManagePage({ params }: Props) {
  const { address } = useAccount();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  console.log("eventData", eventData);
  console.log("address", address);
  const onSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const { slug } = await params;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000' || 'http://localhost:3001';
        const response = await fetch(`${baseUrl}/api/events/slug/${slug}`);
        const data = await response.json();
        console.log('Event data from Graph:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch event');
        }

        if (data.event) {
          setEventData(data.event);

          // Populate form values with Graph data
          const event = data.event;
          setValues({
            title: event.title || "Untitled Event",
            location: event.locationName || "Location TBD",
            start: event.startTime ? new Date(parseInt(event.startTime) * 1000).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            end: event.endTime ? new Date(parseInt(event.endTime) * 1000).toISOString().slice(0, 16) : new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
            maxAttendees: event.maxAttendees || "100",
            registrationFee: event.registrationFee || "0.01 ETH",
            description: event.description || "Event description",
          });
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch event');
        setEventData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [params]);
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Event</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="cursor-pointer">Retry</Button>
        </div>
      </div>
    );
  }
  if (eventData.creator !== address?.toLowerCase()) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">⚠️</h1>
          <h1 className="text-2xl font-bold text-destructive mb-4">Not Authorized</h1>
          <h1 className="mb-4">You are not the creator of this event</h1>
          {/* <ConnectWallet /> */}
          <appkit-connect-button label="Login" size="sm" />
          <Button onClick={() => window.location.href = `/`} className="cursor-pointer">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>

      <div className="min-h-screen bg-background text-foreground">
        <StreamHeader />
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          {/* Event Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{values.title}</h1>
            <p className="text-muted-foreground">
              Event ID: {eventData?.id} | Creator: {eventData?.creator?.slice(0, 6)}...{eventData?.creator?.slice(-4)}
            </p>
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
              eventId={eventData?.id}
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
              <div className="mb-6 flex items-center justify-end mt-4">

                <ContractButton
                  idleLabel={"Save Changes"}
                  chainId={Number(chainId)}
                  abi={eventAbi.abi as Abi}
                  address={eventAddress as `0x${string}`}
                  functionName="updateEvent"
                  args={[BigInt(eventData?.id || 0), values.title, values.location, values.start, values.end, values.maxAttendees, values.registrationFee]}
                  btnClassName="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  onWriteSuccess={() => console.log("save")}
                />

                {/* <Button
                  onClick={onSave}
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button> */}
              </div>
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

        <ContractButton
          idleLabel={"Cancel Event"}
          chainId={Number(chainId)}
          abi={eventAbi.abi as Abi}
          address={eventAddress as `0x${string}`}
          functionName="cancelEvent"
          args={[BigInt(0)]}
          btnClassName="bg-rose-600/90"
          onWriteSuccess={() => console.log("cancel")}
        />

        <QRCodeBottomSheet
          isOpen={qrOpen}
          onClose={() => setQrOpen(false)}
          slug={eventData?.slug || "event"}
          eventTitle={values.title}
        />
      </div>
    </AuthGuard>
  );
}


