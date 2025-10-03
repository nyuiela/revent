"use client";

import React, { useState } from "react";
import LocationPicker from "@/app/components/LocationPicker";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import MultiContractButton from "@/app/components/button/MultiContractButton";
import { chainId, eventAbi, eventAddress, ticketAbi, ticketAddress } from "@/lib/contract";
import { useRouter } from "next/navigation";
import { getLastEventId } from "@/utils/subgraph";
import { generateSlug } from "@/lib/slug-generator";
import { EventDetails } from "@/utils/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const tabs = [
  { key: "basics", label: "Basics" },
  { key: "schedule", label: "Schedule" },
  { key: "location", label: "Location" },
  { key: "hosts", label: "Hosts" },
  { key: "agenda", label: "Agenda" },
  { key: "tickets", label: "Tickets" },
  { key: "media", label: "Media" },
  { key: "publish", label: "Publish" },
];

export default function CreateEventBottomSheet({ open, onOpenChange }: Props) {
  const [active, setActive] = React.useState<string>(tabs[0].key);
  const currentIndex = React.useMemo(() => tabs.findIndex((t) => t.key === active), [active]);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === tabs.length - 1;
  const [isAnimating, setIsAnimating] = React.useState<boolean>(false);
  const goPrev = () => {
    if (currentIndex > 0) setActive(tabs[currentIndex - 1].key);
  };
  const goNext = () => {
    if (currentIndex < tabs.length - 1) setActive(tabs[currentIndex + 1].key);
  };

  // Media tab local state (drag & drop, preview)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isDragOver, setIsDragOver] = React.useState<boolean>(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    setUploadError(null);
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeUploadedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadedFile(null);
    setPreviewUrl(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Hosts state
  const [hosts, setHosts] = React.useState<Array<{ name: string; role: string }>>([]);
  const [tempHost, setTempHost] = React.useState<{ name: string; role: string }>({ name: "", role: "" });

  // Agenda state
  const [agenda, setAgenda] = React.useState<Array<{ title: string; description: string; startTime: string; endTime: string; speakers: string[] }>>([]);
  const [tempAgenda, setTempAgenda] = React.useState<{ title: string; description: string; startTime: string; endTime: string; speakers: string[] }>({ title: "", description: "", startTime: "", endTime: "", speakers: [] });

  // Location state
  const [eventLocationType, setEventLocationType] = React.useState<"online" | "venue" | "hybrid">("online");
  const [locationText, setLocationText] = React.useState<string>("");
  const [coordinates, setCoordinates] = React.useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [onlinePlatformLink, setOnlinePlatformLink] = React.useState<string>("");

  // Temp state for forms
  const [tempTicket, setTempTicket] = React.useState<{ type: string; price: number; currency: string; quantity: number; perks?: string[] }>({ type: "", price: 0, currency: "USD", quantity: 0, perks: [] });

  // Form state
  const [topic, setTopic] = React.useState<string>("tech");
  const [privacy, setPrivacy] = React.useState<string>("public");
  const [timezone, setTimezone] = React.useState<string>("UTC");

  // Main form data state
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    category: '',
    location: '',
    onlinePlatformLink: '',
    coordinates: { lat: 0, lng: 0 },
    startDateTime: '',
    endDateTime: '',
    maxParticipants: 100,
    image: '',
    tickets: {
      available: false,
      types: [] as Array<{ type: string; price: number; currency: string; quantity: number; perks?: string[] }>
    },
    date: '',
    time: '',
    isLive: false,
    platforms: [] as string[],
    totalRewards: 0,
    eventType: "In-Person" as "Online" | "In-Person" | "Hybrid",
    hosts: [] as Array<{ name: string; role: string; avatar?: string; bio?: string; social?: any }>,
    agenda: [] as Array<{ title: string; description: string; startTime: string; endTime: string; speakers: string[] }>,
    sponsors: [] as any[],
    socialLinks: {} as any,
    slug: ''
  });

  // Sync location state with formData
  React.useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      location: locationText,
      coordinates,
      onlinePlatformLink,
      eventType: eventLocationType === "online" ? "Online" : eventLocationType === "venue" ? "In-Person" : "Hybrid"
    }));
  }, [locationText, coordinates, onlinePlatformLink, eventLocationType]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    // Trigger animation state on open/close
    setIsAnimating(true);
    const t = setTimeout(() => setIsAnimating(false), 320);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {/* Overlay */}
      <div
        onClick={() => onOpenChange(false)}
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-2xl border border-border bg-background shadow-2xl transition-transform duration-300 ${open ? (isAnimating ? "translate-y-0" : "") : "translate-y-full"}`}
      >
        {/* Grabber */}
        <div className="flex items-center justify-center py-2">
          <div className="h-1.5 w-12 rounded-full bg-muted" />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 px-4 pb-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${active === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 pt-4">
          {active === "basics" && <Basics formData={formData} setFormData={setFormData} topic={topic} setTopic={setTopic} privacy={privacy} setPrivacy={setPrivacy} />}
          {active === "schedule" && <Schedule formData={formData} setFormData={setFormData} timezone={timezone} setTimezone={setTimezone} />}
          {active === "location" && (
            <Location
              eventLocationType={eventLocationType}
              setEventLocationType={setEventLocationType}
              locationText={locationText}
              coordinates={coordinates}
              setLocation={(next) => {
                setLocationText(next.location);
                setCoordinates(next.coordinates);
              }}
              onlinePlatformLink={onlinePlatformLink}
              setOnlinePlatformLink={setOnlinePlatformLink}
            />
          )}
          {active === "hosts" && (
            <Hosts
              formData={formData}
              setFormData={setFormData}
              tempHost={tempHost}
              setTempHost={setTempHost}
            />
          )}
          {active === "agenda" && (
            <Agenda
              formData={formData}
              setFormData={setFormData}
              tempAgenda={tempAgenda}
              setTempAgenda={setTempAgenda}
            />
          )}
          {active === "tickets" && (
            <Tickets
              formData={formData}
              setFormData={setFormData}
              tempTicket={tempTicket}
              setTempTicket={setTempTicket}
            />
          )}
          {active === "media" && (
            <Media
              fileInputRef={fileInputRef}
              uploadedFile={uploadedFile}
              previewUrl={previewUrl}
              uploadError={uploadError}
              handleFileInputChange={handleFileInputChange}
              removeUploadedFile={removeUploadedFile}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              isDragOver={isDragOver}
            />
          )}
          {active === "publish" && <Publish formData={formData} setFormData={setFormData} onClose={() => onOpenChange(false)} />}
        </div>

        {/* Navigation footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            className={`rounded-md px-4 py-2 text-sm ${isFirst ? "cursor-not-allowed opacity-50" : "bg-background hover:bg-muted"
              }`}
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/90"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        {...props}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1 sm:col-span-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <textarea
        {...props}
        className="min-h-[96px] rounded-md border border-input bg-background p-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onResize() {
      if (btnRef.current) {
        const r = btnRef.current.getBoundingClientRect();
        setPos({ top: r.bottom + 6, left: r.left, width: r.width });
      }
    }
    window.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    onResize();
    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open]);

  const current = options.find(o => o.value === value)?.label ?? '';

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 rounded-md border border-input bg-background px-3 text-left text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        {current || 'Select...'}
      </button>
      {open && pos && typeof document !== 'undefined' && (
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 60 }}
          className="overflow-hidden rounded-md border border-border bg-background shadow-lg"
        >
          <ul className="max-h-64 overflow-auto py-1">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted ${value === opt.value ? 'bg-muted' : ''
                    }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Basics(props: {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  topic: string;
  setTopic: (val: string) => void;
  privacy: string;
  setPrivacy: (val: string) => void
}) {
  const { formData, setFormData, topic, setTopic, privacy, setPrivacy } = props;
  return (
    <div>
      <Section title="Event details" description="Core info users see first.">
        <Input
          label="Title"
          placeholder="Hackathon Night"
          value={formData.title}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
        />
        {/* <Input label="Slug" placeholder="hackathon-night" /> */}
        <Textarea
          label="Description"
          placeholder="Tell people what to expect..."
          value={formData.description}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
        />
      </Section>
      <Section title="Topic & privacy">
        <SelectField
          label="Topic"
          value={topic}
          onChange={(val) => {
            setTopic(val);
            setFormData((prev: any) => ({ ...prev, category: val }));
          }}
          options={[
            { value: 'tech', label: 'Tech' },
            { value: 'music', label: 'Music' },
            { value: 'gaming', label: 'Gaming' },
            { value: 'art', label: 'Art' },
          ]}
        />
        <SelectField
          label="Privacy"
          value={privacy}
          onChange={setPrivacy}
          options={[
            { value: 'public', label: 'Public' },
            { value: 'unlisted', label: 'Unlisted' },
            { value: 'private', label: 'Private' },
          ]}
        />
      </Section>
    </div>
  );
}

function Schedule(props: {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  timezone: string;
  setTimezone: (val: string) => void
}) {
  const { formData, setFormData, timezone, setTimezone } = props;
  return (
    <div>
      <Section title="When" description="Dates and times.">
        <Input
          type="datetime-local"
          label="Starts"
          value={formData.startDateTime}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, startDateTime: e.target.value }))}
        />
        <Input
          type="datetime-local"
          label="Ends"
          value={formData.endDateTime}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, endDateTime: e.target.value }))}
        />
      </Section>
      <Section title="Timezone">
        <SelectField
          label="Timezone"
          value={timezone}
          onChange={setTimezone}
          options={[
            { value: 'UTC', label: 'UTC' },
            { value: 'GMT', label: 'GMT' },
            { value: 'PST', label: 'PST' },
            { value: 'EST', label: 'EST' },
          ]}
        />
      </Section>
    </div>
  );
}

function Location(props: {
  eventLocationType: "online" | "venue" | "hybrid";
  setEventLocationType: React.Dispatch<React.SetStateAction<"online" | "venue" | "hybrid">>;
  locationText: string;
  coordinates: { lat: number; lng: number };
  setLocation: (next: { location: string; coordinates: { lat: number; lng: number } }) => void;
  onlinePlatformLink: string;
  setOnlinePlatformLink: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { eventLocationType, setEventLocationType, locationText, coordinates, setLocation, onlinePlatformLink, setOnlinePlatformLink } = props;

  return (
    <div>
      <Section title="Where" description="Venue or online link.">
        <SelectField
          label="Type"
          value={eventLocationType}
          onChange={(val) => setEventLocationType(val as any)}
          options={[
            { value: 'online', label: 'Online' },
            { value: 'venue', label: 'Venue' },
            { value: 'hybrid', label: 'Hybrid' },
          ]}
        />

        {(eventLocationType === "venue" || eventLocationType === "hybrid") && (
          <div className="sm:col-span-2">
            <LocationPicker
              value={{ location: locationText, coordinates }}
              onChange={(next) => setLocation(next)}
            />
          </div>
        )}

        {eventLocationType === "online" && (
          <Input
            label="Online platform link"
            placeholder="meet.revent.xyz/room/abc"
            value={onlinePlatformLink}
            onChange={(e) => setOnlinePlatformLink((e.target as HTMLInputElement).value)}
          />
        )}
      </Section>
    </div>
  );
}

function Hosts(props: {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  tempHost: { name: string; role: string };
  setTempHost: React.Dispatch<React.SetStateAction<{ name: string; role: string }>>;
}) {
  const { formData, setFormData, tempHost, setTempHost } = props;
  return (
    <div>
      {formData.hosts.length > 0 && (
        <Section title="Current Hosts">
          <div className="sm:col-span-2 space-y-2">
            {formData.hosts.map((h: any, i: number) => (
              <div key={`${h.name}-${i}`} className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                <div>
                  <p className="text-sm font-medium">@{h.name}</p>
                  <p className="text-xs text-muted-foreground">{h.role || "Host"}</p>
                </div>
                <button
                  onClick={() => setFormData((prev: any) => ({ ...prev, hosts: prev.hosts.filter((_: any, idx: number) => idx !== i) }))}
                  className="rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Add Host">
        <Input
          label="Address or username"
          placeholder="0x... or @username"
          value={tempHost.name}
          onChange={(e) => {
            const name = (e.target as HTMLInputElement).value.replace('@', '');
            setTempHost((prev) => ({ ...prev, name }));
          }}
        />
        <Input
          label="Role"
          placeholder="Organizer, Speaker, Host"
          value={tempHost.role}
          onChange={(e) => setTempHost((prev) => ({ ...prev, role: (e.target as HTMLInputElement).value }))}
        />
        <div className="sm:col-span-2">
          <button
            onClick={() => {
              if (tempHost.name.trim()) {
                setFormData((prev: any) => ({
                  ...prev,
                  hosts: [...prev.hosts, { name: tempHost.name.trim(), role: tempHost.role || "Host" }]
                }));
                setTempHost({ name: "", role: "" });
              }
            }}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add Host
          </button>
        </div>
      </Section>
    </div>
  );
}

function Agenda(props: {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  tempAgenda: { title: string; description: string; startTime: string; endTime: string; speakers: string[] };
  setTempAgenda: React.Dispatch<React.SetStateAction<{ title: string; description: string; startTime: string; endTime: string; speakers: string[] }>>;
}) {
  const { formData, setFormData, tempAgenda, setTempAgenda } = props;
  return (
    <div>
      {formData.agenda.length > 0 && (
        <Section title="Current Agenda">
          <div className="sm:col-span-2 space-y-2">
            {formData.agenda.map((item: any, index: number) => (
              <div key={`${item.title}-${index}`} className="rounded-xl border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <button onClick={() => setFormData((prev: any) => ({ ...prev, agenda: prev.agenda.filter((_: any, i: number) => i !== index) }))} className="rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-muted">Remove</button>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">{item.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>
                    {item.startTime} - {item.endTime}
                  </span>
                  {item.speakers?.length ? <span>Speakers: {item.speakers.join(', ')}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Add Agenda Item">
        <Input
          label="Title"
          placeholder="Opening keynote"
          value={tempAgenda.title}
          onChange={(e) => setTempAgenda((prev) => ({ ...prev, title: (e.target as HTMLInputElement).value }))}
        />
        <Input
          label="Start time"
          type="time"
          value={tempAgenda.startTime}
          onChange={(e) => setTempAgenda((prev) => ({ ...prev, startTime: (e.target as HTMLInputElement).value }))}
        />
        <Input
          label="End time"
          type="time"
          value={tempAgenda.endTime}
          onChange={(e) => setTempAgenda((prev) => ({ ...prev, endTime: (e.target as HTMLInputElement).value }))}
        />
        <Textarea
          label="Description"
          placeholder="What happens in this session?"
          value={tempAgenda.description}
          onChange={(e) => setTempAgenda((prev) => ({ ...prev, description: (e.target as HTMLTextAreaElement).value }))}
        />
        <Input
          label="Speakers (comma separated)"
          placeholder="@alice, @bob"
          value={tempAgenda.speakers.join(', ')}
          onChange={(e) => {
            const list = (e.target as HTMLInputElement).value.split(',').map((s) => s.trim()).filter(Boolean);
            setTempAgenda((prev) => ({ ...prev, speakers: list }));
          }}
        />
        <div className="sm:col-span-2">
          <button
            onClick={() => {
              if (tempAgenda.title && tempAgenda.startTime && tempAgenda.endTime) {
                setFormData((prev: any) => ({
                  ...prev,
                  agenda: [
                    ...prev.agenda,
                    {
                      title: tempAgenda.title.trim(),
                      description: tempAgenda.description || "",
                      startTime: tempAgenda.startTime,
                      endTime: tempAgenda.endTime,
                      speakers: tempAgenda.speakers || [],
                    },
                  ]
                }));
                setTempAgenda({ title: "", description: "", startTime: "", endTime: "", speakers: [] });
              }
            }}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add Agenda Item
          </button>
        </div>
      </Section>
    </div>
  );
}
function Tickets(props: {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  tempTicket: { type: string; price: number; currency: string; quantity: number; perks?: string[] };
  setTempTicket: React.Dispatch<React.SetStateAction<{ type: string; price: number; currency: string; quantity: number; perks?: string[] }>>;
}) {
  const { formData, setFormData, tempTicket, setTempTicket } = props;

  return (
    <div>
      {/* Availability toggle */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-background p-4">
        <div>
          <h3 className="font-semibold">Tickets Available</h3>
          <p className="text-sm text-muted-foreground">Sell tickets for this event</p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={formData.tickets.available}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, tickets: { ...prev.tickets, available: e.target.checked } }))}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-background after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
        </label>
      </div>

      {/* Existing ticket types */}
      {formData.tickets.available && formData.tickets.types.length > 0 && (
        <Section title="Current Ticket Types">
          <div className="sm:col-span-2 space-y-2">
            {formData.tickets.types.map((ticket: any, index: number) => (
              <div key={`${ticket.type}-${index}`} className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                <div>
                  <p className="text-sm font-semibold">{ticket.type}</p>
                  <p className="text-xs text-muted-foreground">${ticket.price} {ticket.currency} • {ticket.quantity} available</p>
                </div>
                <button
                  onClick={() => {
                    setFormData((prev: any) => ({ ...prev, tickets: { ...prev.tickets, types: prev.tickets.types.filter((_: any, i: number) => i !== index) } }));
                  }}
                  className="rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Add ticket type */}
      {formData.tickets.available && (
        <Section title="Add Ticket Type">
          <Input
            label="Ticket Type"
            placeholder="General Admission, VIP, Early Bird"
            value={tempTicket.type}
            onChange={(e) => setTempTicket((prev) => ({ ...prev, type: (e.target as HTMLInputElement).value }))}
          />
          <Input
            label="Price"
            type="number"
            placeholder="0.00"
            value={Number.isFinite(tempTicket.price) ? tempTicket.price : 0}
            onChange={(e) => setTempTicket((prev) => ({ ...prev, price: parseFloat((e.target as HTMLInputElement).value) || 0 }))}
            min={0}
            step={0.01}
          />
          <SelectField
            label="Currency"
            value={tempTicket.currency}
            onChange={(val) => setTempTicket((prev) => ({ ...prev, currency: val }))}
            options={[
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (£)' },
              { value: 'ETH', label: 'ETH' },
            ]}
          />
          <Input
            label="Quantity"
            type="number"
            placeholder="100"
            value={Number.isFinite(tempTicket.quantity) ? tempTicket.quantity : 0}
            onChange={(e) => setTempTicket((prev) => ({ ...prev, quantity: parseInt((e.target as HTMLInputElement).value) || 0 }))}
            min={1}
          />
          <div className="sm:col-span-2">
            <button
              onClick={() => {
                if (tempTicket.type && tempTicket.quantity > 0) {
                  setFormData((prev: any) => ({ ...prev, tickets: { ...prev.tickets, types: [...prev.tickets.types, { ...tempTicket, type: tempTicket.type.trim() }] } }));
                  setTempTicket({ type: "", price: 0, currency: "USD", quantity: 0, perks: [] });
                }
              }}
              className="w-full rounded-full bg-primary px-4 py-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add Ticket Type
            </button>
          </div>
        </Section>
      )}
    </div>
  );
}

function Media(props: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadedFile: File | null;
  previewUrl: string | null;
  uploadError: string | null;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeUploadedFile: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
}) {
  const {
    fileInputRef,
    uploadedFile,
    previewUrl,
    uploadError,
    handleFileInputChange,
    removeUploadedFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragOver,
  } = props;

  return (
    <div>
      <Section title="Media" description="Drag & drop a cover or click to select.">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* File Preview */}
        {previewUrl && (
          <div className="relative sm:col-span-2">
            <div className="relative h-52 w-full overflow-hidden rounded-xl border border-border bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              <button
                onClick={removeUploadedFile}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {uploadedFile?.name} ({uploadedFile?.size ? (uploadedFile.size / 1024 / 1024).toFixed(2) : '0'} MB)
            </p>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="sm:col-span-2 text-sm text-red-500">{uploadError}</div>
        )}

        {/* Drag and Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`sm:col-span-2 cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${isDragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary hover:bg-muted/20'
            }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isDragOver ? 'bg-primary' : 'bg-muted'}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`h-8 w-8 ${isDragOver ? 'text-primary-foreground' : 'text-muted-foreground'}`}
              >
                <path d="M3 15a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4" />
                <path d="M12 12V3m0 0l-3 3m3-3l3 3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">{isDragOver ? 'Drop your image here!' : 'Select Event Image'}</h3>
            <p className="text-sm text-muted-foreground">
              {isDragOver ? (
                <span className="font-medium text-primary">Release to select</span>
              ) : (
                <>or <span className="font-medium text-primary">click to browse</span></>
              )}
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Publish({ formData, setFormData, onClose }: { formData: any; setFormData: React.Dispatch<React.SetStateAction<any>>; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);

  // Global error handler
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Global error in Publish component:', error);
      setVerificationStatus(`Error: ${error.message}`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection in Publish component:', event.reason);
      setVerificationStatus(`Promise rejection: ${event.reason}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  const [transactionStep, setTransactionStep] = useState<'event' | 'tickets' | 'domain' | 'complete'>('event');
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [preGeneratedEventId, setPreGeneratedEventId] = useState<string | null>(null);
  const [transactionTimeout, setTransactionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [useBatchedMode, setUseBatchedMode] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [createdEventDetails, setCreatedEventDetails] = useState<EventDetails | null>(null);
  const [transactionSuccessful, setTransactionSuccessful] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [preparedContracts, setPreparedContracts] = useState<any[] | null>(null);
  const [preparedTicketContracts, setPreparedTicketContracts] = useState<any[] | null>(null);
  const [preparedDomainContracts, setPreparedDomainContracts] = useState<any[] | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPreparingForTransaction, setIsPreparingForTransaction] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [domainName, setDomainName] = useState<string>('');
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [, setIpfsHash] = useState<string | null>(null);
  const router = useRouter()
  // Function to get the next event ID from The Graph
  const getNextEventId = async (): Promise<string> => {
    try {
      const lastEventId = await getLastEventId();
      const nextEventId = lastEventId + 1;
      console.log('Next event ID will be:', nextEventId);
      return nextEventId.toString();
    } catch (error) {
      console.error('Error getting next event ID:', error);
      // Fallback to timestamp-based ID
      return Date.now().toString();
    }
  };
  // Function to create event details from form data
  const createEventDetails = (eventId: string): EventDetails => {
    const startDate = formData.startDateTime ? new Date(formData.startDateTime) : new Date();

    // Transform agenda items to include required id field
    const transformedAgenda = (formData.agenda || []).map((item: any, index: number) => ({
      id: `agenda-${index}`,
      title: item.title || '',
      description: item.description || '',
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      speakers: item.speakers || [],
    }));

    return {
      id: eventId,
      title: formData.title || '',
      description: formData.description || '',
      date: startDate.toLocaleDateString(),
      time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: formData.location || '',
      onlinePlatformLink: formData.onlinePlatformLink || '',
      coordinates: formData.coordinates || { lat: 0, lng: 0 },
      image: formData.image || '',
      category: formData.category || '',
      maxParticipants: formData.maxParticipants || 100,
      currentParticipants: 0,
      isLive: formData.isLive || false,
      platforms: formData.platforms || [],
      totalRewards: formData.totalRewards || 0,
      participants: [],
      media: [],
      rewards: [],
      agenda: transformedAgenda,
      hosts: formData.hosts || [],
      sponsors: formData.sponsors || [],
      socialLinks: formData.socialLinks || {},
    };
  };
  const createBatchedTickets = (eventId: string) => {
    if (!formData.tickets || !formData.tickets.available || !formData.tickets.types || formData.tickets.types.length === 0) {
      return null;
    }

    // Prepare arrays for the createTickets function
    const names: string[] = [];
    const ticketTypes: string[] = [];
    const prices: bigint[] = [];
    const currencies: string[] = [];
    const totalQuantities: bigint[] = [];
    const perks: string[][] = [];

    // Populate arrays from form data
    for (const ticketType of formData.tickets.types) {
      names.push(ticketType.type);
      ticketTypes.push(ticketType.type);
      prices.push(BigInt(Math.floor(ticketType.price * 1000000000000000000))); // Convert to wei
      currencies.push(ticketType.currency);
      totalQuantities.push(BigInt(ticketType.quantity));
      perks.push(ticketType.perks || []);
    }

    return {
      abi: ticketAbi.abi,
      address: ticketAddress as `0x${string}`,
      functionName: "createTickets",
      args: [
        BigInt(eventId), // eventId
        names, // name[]
        ticketTypes, // ticketType[]
        prices, // price[]
        currencies, // currency[]
        totalQuantities, // totalQuantity[]
        perks // perks[][]
      ],
    };
  };

  // Build Transaction "contracts" for OnchainKit (uploads to IPFS, returns contract call)
  const handleSubmit = async () => {
    try {
      console.log('Building metadata for IPFS upload...');
      // Basic validations already handled in UI; build metadata
      const metadata = {
        title: formData.title || '',
        description: formData.description || '',
        location: formData.location || '',
        image: formData.image || '',
        category: formData.category || '',
        maxParticipants: formData.maxParticipants || 100,
        hosts: formData.hosts || [],
        agenda: formData.agenda || [],
        tickets: formData.tickets || { available: false, types: [] },
        socialLinks: formData.socialLinks || {},
        startISO: formData.startDateTime || '',
        endISO: formData.endDateTime || '',
      };

      console.log('Uploading metadata to IPFS...');
      const res = await fetch("/api/ipfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `event-${formData.title}`, content: metadata }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("IPFS upload failed:", t);
        throw new Error("Failed to upload event metadata to IPFS");
      }
      const { uri } = await res.json();
      setIpfsHash(uri);

      // After IPFS, call registerEvent with computed times and IPFS hash
      const startIso = formData.startDateTime || (formData.date && formData.time ? `${formData.date}T${formData.time}` : "");
      let endIso = formData.endDateTime || "";
      // Fallback: if end not provided, default to +3 hours from start
      if (!endIso && startIso) {
        const tentativeEnd = new Date(startIso);
        if (!isNaN(tentativeEnd.getTime())) {
          tentativeEnd.setHours(tentativeEnd.getHours() + 3);
          endIso = tentativeEnd.toISOString();
        }
      }
      if (!startIso || !endIso) {
        throw new Error("Please set both start and end time");
      }
      const startTime = Math.floor(new Date(startIso).getTime() / 1000);
      const endTime = Math.floor(new Date(endIso).getTime() / 1000);
      if (startTime >= endTime) {
        throw new Error("End time must be after start time");
      }

      // Generate a unique slug for this event
      const eventSlug = generateSlug();
      console.log('Generated event slug:', eventSlug);

      // Store the slug in form data for reference
      setFormData((prev: any) => ({ ...prev, slug: eventSlug }));

      // Return a ContractFunctionParameters[] for OnchainKit <Transaction contracts={...}>
      const contracts = [
        {
          abi: eventAbi.abi,
          address: eventAddress as `0x${string}`,
          functionName: "createEvent",
          args: [
            uri, // ipfsHash
            BigInt(startTime), // startTime
            BigInt(endTime), // endTime
            BigInt(formData.maxParticipants), // maxAttendees
            formData.tickets.available ? true : false, // isVIP (default to false, can be made configurable)
            "0x", // data (empty bytes for now)
            eventSlug, // slug
          ],
        },
      ];

      console.log('Successfully created contracts:', contracts);
      return contracts;
    } catch (e) {
      console.error('Error in handleSubmit:', e);
      throw e;
    }
  };

  const createBatchedEventAndTickets = async (_eventId: string) => {
    try {
      const contracts: any[] = [];
      const eventContract = await handleSubmit();
      contracts.push(...eventContract);

      const ticket = createBatchedTickets(_eventId);
      if (ticket) contracts.push(ticket);

      return contracts;
    } catch (error) {
      console.error('Error creating batched event and tickets:', error);
      throw error;
    }
  };
  const handleCreateEvent = async () => {
    try {
      console.log('Starting event creation preparation...');
      setIsPreparingForTransaction(true);
      setVerificationStatus('Preparing everything for event creation...');

      // Validate required fields
      if (!formData.title) {
        throw new Error('Event title is required');
      }
      if (!formData.startDateTime) {
        throw new Error('Event start time is required');
      }
      if (!formData.endDateTime) {
        throw new Error('Event end time is required');
      }

      console.log('Form data validation passed:', {
        title: formData.title,
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime,
        tickets: formData.tickets
      });

      // First prepare all contracts (image upload, metadata upload, contract preparation)
      const eventId = await getNextEventId();
      console.log('Generated event ID:', eventId);

      const contracts = await createBatchedEventAndTickets(eventId as string);
      console.log('Created contracts:', contracts);
      setPreparedContracts(contracts);

      setVerificationStatus('Ready to create event! Click the transaction button below.');
      return contracts;
    } catch (error) {
      console.error('Error preparing for event creation:', error);
      setVerificationStatus(`Failed to prepare for event creation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPreparingForTransaction(false);
    }
  };
  return (
    <div>
      <Section title="Review & publish" description="You can edit later." >
        <Input label="Organizer" placeholder="Your name" />
        <Input label="Contact email" placeholder="you@example.com" type="email" />
      </Section>

      {verificationStatus && (
        <div className="mb-4 rounded-md bg-muted p-3">
          <p className="text-sm text-muted-foreground">{verificationStatus}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">

        {preparedContracts && preparedContracts.length > 0 ? (
          <div className="w-full">
            <MultiContractButton
              useMulticall={false}
              sequential={true}
              chainId={Number(chainId)}
              contracts={preparedContracts}
              onReceiptSuccess={async () => {
                try {
                  console.log('Transaction successful, creating event details...');
                  setTransactionSuccessful(true);
                  const eid = preGeneratedEventId || createdEventId || formData.slug || 'event';
                  console.log('Event ID for details:', eid);
                  const details = createEventDetails(eid);
                  console.log('Event details created:', details);
                  setCreatedEventDetails(details);
                  setShowSuccessCard(true);
                } catch (error) {
                  console.error('Error creating event details:', error);
                  setVerificationStatus('Event created but failed to load details');
                }
              }}
              idleLabel="Create Event & Tickets"
              className="mt-5"
              successLabel="Event & Tickets Created"
              errorLabel="Try Again"
              cancelLabel="Cancel"
              showCancel={true}
              showToast={true}
              successToastMessage="Event & Tickets Created"
              preSubmitFunction={handleCreateEvent}
              btnClassName="w-full bg-emerald-600 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-background font-medium py-3 px-4 rounded-lg transition-colors"
            />
          </div>
        ) : (
          <button
            onClick={handleCreateEvent}
            disabled={isPreparingForTransaction}
            className="w-full bg-emerald-600 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-background font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isPreparingForTransaction ? 'Preparing...' : 'Prepare Event Creation'}
          </button>
        )}
      </div>
    </div>
  );
}


