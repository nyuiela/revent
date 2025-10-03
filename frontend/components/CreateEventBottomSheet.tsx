"use client";

import React from "react";
import LocationPicker from "@/app/components/LocationPicker";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

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

  // Tickets state
  const [tickets, setTickets] = React.useState<{
    available: boolean;
    types: Array<{ type: string; price: number; currency: string; quantity: number; perks?: string[] }>;
  }>({ available: false, types: [] });
  const [tempTicket, setTempTicket] = React.useState<{ type: string; price: number; currency: string; quantity: number; perks?: string[] }>({ type: "", price: 0, currency: "USD", quantity: 0, perks: [] });

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

        <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">
          {active === "basics" && <Basics />}
          {active === "schedule" && <Schedule />}
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
              hosts={hosts}
              tempHost={tempHost}
              setTempHost={setTempHost}
              addHost={() => {
                if (tempHost.name.trim()) {
                  setHosts((prev) => [...prev, { name: tempHost.name.trim(), role: tempHost.role || "Host" }]);
                  setTempHost({ name: "", role: "" });
                }
              }}
              removeHost={(index) => setHosts((prev) => prev.filter((_, i) => i !== index))}
            />
          )}
          {active === "agenda" && (
            <Agenda
              agenda={agenda}
              tempAgenda={tempAgenda}
              setTempAgenda={setTempAgenda}
              addAgenda={() => {
                if (tempAgenda.title && tempAgenda.startTime && tempAgenda.endTime) {
                  setAgenda((prev) => [
                    ...prev,
                    {
                      title: tempAgenda.title.trim(),
                      description: tempAgenda.description || "",
                      startTime: tempAgenda.startTime,
                      endTime: tempAgenda.endTime,
                      speakers: tempAgenda.speakers || [],
                    },
                  ]);
                  setTempAgenda({ title: "", description: "", startTime: "", endTime: "", speakers: [] });
                }
              }}
              removeAgenda={(index) => setAgenda((prev) => prev.filter((_, i) => i !== index))}
            />
          )}
          {active === "tickets" && (
            <Tickets
              tickets={tickets}
              setTickets={setTickets}
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
          {active === "publish" && <Publish onClose={() => onOpenChange(false)} />}
        </div>

        {/* Navigation footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

function Basics() {
  return (
    <div>
      <Section title="Event details" description="Core info users see first.">
        <Input label="Title" placeholder="Hackathon Night" />
        {/* <Input label="Slug" placeholder="hackathon-night" /> */}
        <Textarea label="Description" placeholder="Tell people what to expect..." />
      </Section>
      <Section title="Topic & privacy">
        <SelectField
          label="Topic"
          value={"tech"}
          onChange={() => { }}
          options={[
            { value: 'tech', label: 'Tech' },
            { value: 'music', label: 'Music' },
            { value: 'gaming', label: 'Gaming' },
            { value: 'art', label: 'Art' },
          ]}
        />
        <SelectField
          label="Privacy"
          value={"public"}
          onChange={() => { }}
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

function Schedule() {
  return (
    <div>
      <Section title="When" description="Dates and times.">
        <Input type="datetime-local" label="Starts" />
        <Input type="datetime-local" label="Ends" />
      </Section>
      <Section title="Timezone">
        <SelectField
          label="Timezone"
          value={"UTC"}
          onChange={() => { }}
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
  hosts: Array<{ name: string; role: string }>;
  tempHost: { name: string; role: string };
  setTempHost: React.Dispatch<React.SetStateAction<{ name: string; role: string }>>;
  addHost: () => void;
  removeHost: (index: number) => void;
}) {
  const { hosts, tempHost, setTempHost, addHost, removeHost } = props;
  return (
    <div>
      {hosts.length > 0 && (
        <Section title="Current Hosts">
          <div className="sm:col-span-2 space-y-2">
            {hosts.map((h, i) => (
              <div key={`${h.name}-${i}`} className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                <div>
                  <p className="text-sm font-medium">@{h.name}</p>
                  <p className="text-xs text-muted-foreground">{h.role || "Host"}</p>
                </div>
                <button
                  onClick={() => removeHost(i)}
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
          <button onClick={addHost} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Add Host
          </button>
        </div>
      </Section>
    </div>
  );
}

function Agenda(props: {
  agenda: Array<{ title: string; description: string; startTime: string; endTime: string; speakers: string[] }>;
  tempAgenda: { title: string; description: string; startTime: string; endTime: string; speakers: string[] };
  setTempAgenda: React.Dispatch<React.SetStateAction<{ title: string; description: string; startTime: string; endTime: string; speakers: string[] }>>;
  addAgenda: () => void;
  removeAgenda: (index: number) => void;
}) {
  const { agenda, tempAgenda, setTempAgenda, addAgenda, removeAgenda } = props;
  return (
    <div>
      {agenda.length > 0 && (
        <Section title="Current Agenda">
          <div className="sm:col-span-2 space-y-2">
            {agenda.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-xl border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <button onClick={() => removeAgenda(index)} className="rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-muted">Remove</button>
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
          <button onClick={addAgenda} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Add Agenda Item
          </button>
        </div>
      </Section>
    </div>
  );
}
function Tickets(props: {
  tickets: { available: boolean; types: Array<{ type: string; price: number; currency: string; quantity: number; perks?: string[] }> };
  setTickets: React.Dispatch<React.SetStateAction<{ available: boolean; types: Array<{ type: string; price: number; currency: string; quantity: number; perks?: string[] }> }>>;
  tempTicket: { type: string; price: number; currency: string; quantity: number; perks?: string[] };
  setTempTicket: React.Dispatch<React.SetStateAction<{ type: string; price: number; currency: string; quantity: number; perks?: string[] }>>;
}) {
  const { tickets, setTickets, tempTicket, setTempTicket } = props;

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
            checked={tickets.available}
            onChange={(e) => setTickets((prev) => ({ ...prev, available: e.target.checked }))}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-muted-foreground after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
        </label>
      </div>

      {/* Existing ticket types */}
      {tickets.available && tickets.types.length > 0 && (
        <Section title="Current Ticket Types">
          <div className="sm:col-span-2 space-y-2">
            {tickets.types.map((ticket, index) => (
              <div key={`${ticket.type}-${index}`} className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                <div>
                  <p className="text-sm font-semibold">{ticket.type}</p>
                  <p className="text-xs text-muted-foreground">${ticket.price} {ticket.currency} • {ticket.quantity} available</p>
                </div>
                <button
                  onClick={() => {
                    setTickets((prev) => ({ ...prev, types: prev.types.filter((_, i) => i !== index) }));
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
      {tickets.available && (
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
                  setTickets((prev) => ({ ...prev, types: [...prev.types, { ...tempTicket, type: tempTicket.type.trim() }] }));
                  setTempTicket({ type: "", price: 0, currency: "USD", quantity: 0, perks: [] });
                }
              }}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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

function Publish({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <Section title="Review & publish" description="You can edit later." >
        <Input label="Organizer" placeholder="Your name" />
        <Input label="Contact email" placeholder="you@example.com" type="email" />
      </Section>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <button
          className="rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-muted"
          onClick={onClose}
        >
          Save draft
        </button>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Publish
        </button>
      </div>
    </div>
  );
}


