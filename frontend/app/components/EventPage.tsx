"use client";

import {
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from "@coinbase/onchainkit/transaction";
import { WalletModal } from "@coinbase/onchainkit/wallet";
import { eventAbi, eventAddress } from "@/lib/contract";
import type { Abi } from "viem";
import StaticLocationMap from "./StaticLocationMap";
import config from "@/lib/wagmi";
import ParticipantsGrid from "./ParticipantsGrid";
import EventViewTracker from "../../components/EventViewTracker";
import ViewCount from "../../components/ViewCount";
import { useEventViews } from "../../hooks/useEventViews";
import { useEventTickets } from "../../hooks/useEventTickets";
import { EventDetails } from "@/utils/types";
import RegistrationSuccessCard from "./RegistrationSuccessCard";
import { Avatar, FollowersYouKnow, ProfileSocials } from "ethereum-identity-kit";
import Image from "next/image";
import { Button } from "./DemoComponents";
import { useRouter } from "next/navigation";
import { ticketAbi, ticketAddress } from "@/lib/contract";
import EventManagement from "./EventManagement";


type Props = {
  eventId?: string;
  ipfsHash?: string; // e.g., ipfs://CID or CID
  idType?: "eventId" | "ipfs" | "unknown" | "slug";
  graphEventData?: {
    id: string;
    eventId: string;
    creator: string;
    ipfsHash: string;
    startTime: string;
    endTime: string;
    maxParticipants: string;
    registrationFee: string;
    blockTimestamp: string;
    transactionHash: string;
  };
  eventSlugData?: {
    id: string;
    title: string;
    description?: string;
    slug?: string;
    creator?: string;
    avatarUrl?: string;
    lat?: number;
    lng?: number;
    isLive?: boolean;
    platforms?: string[];
    category?: string;
    startTime?: string;
    endTime?: string;
    maxAttendees?: string;
  };
  onBack?: () => void;
};

export default function EventPage({ eventId, ipfsHash, idType, graphEventData, eventSlugData }: Props) {
  const [isScrolling, setIsScrolling] = useState(false);
  const { viewCount, isLoading: viewCountLoading } = useEventViews(eventId || '');
  const { tickets, isLoading: ticketsLoading, hasTickets, error: ticketsError } = useEventTickets(eventId);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [ticketMode] = useState<"none" | "single" | "multiple">("single");
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [ipfsData, setIpfsData] = useState<Record<string, unknown> | null>(null);
  const [ipfsLoading, setIpfsLoading] = useState<boolean>(false);
  const [ipfsError, setIpfsError] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const { address } = useAccount();
  const chainId = useChainId();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const numericEventId = eventId && typeof eventId === "string" ? Number(eventId) : eventId;
  const canTransact = Boolean(address && chainId && eventAddress);
  const canPurchaseTickets = Boolean(address && chainId && ticketAddress);

  // Debug logging
  console.log('EventPage Debug:', {
    eventId,
    numericEventId,
    address,
    chainId,
    eventAddress,
    canTransact,
    canPurchaseTickets
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();

  // Only make contract calls if we have a valid eventId
  const { data: eventData } = useReadContract({
    address: eventAddress as `0x${string}`,
    abi: eventAbi.abi as Abi,
    functionName: "getEvent",
    args: [BigInt(numericEventId || 1)],
    config,
    query: {
      enabled: Boolean(eventId && numericEventId), // Only run if we have a valid eventId
    },
  });

  const { data: attendeesData } = useReadContract({
    address: eventAddress as `0x${string}`,
    abi: eventAbi.abi as Abi,
    functionName: "getEventAttendees",
    args: [BigInt(numericEventId || 1)],
    config,
    query: {
      enabled: Boolean(eventId && numericEventId), // Only run if we have a valid eventId
    },
  });

  const { data: isRegistered } = useReadContract({
    address: eventAddress as `0x${string}`,
    abi: eventAbi.abi as Abi,
    functionName: "isRegisteredForEvent",
    account: address as `0x${string}`,
    args: [BigInt(numericEventId || 1), address as `0x${string}`],
    config,
    query: {
      enabled: Boolean(eventId && numericEventId && address), // Only run if we have valid eventId and address
    },
  });

  // Check if connected user is the event creator using Graph data
  const eventCreator = graphEventData?.creator;
  const isEventCreator = Boolean(
    address &&
    eventCreator &&
    address.toLowerCase() === eventCreator.toLowerCase()
  );

  console.log('EventPage Debug:', {
    eventId,
    ipfsHash,
    idType,
    numericEventId,
    eventData,
    attendeesData,
    isRegistered,
    graphEventData,
    address,
    eventCreator,
    isEventCreator
  });

  // Scroll detection logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show button when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY) {
        setIsScrolling(false);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsScrolling(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // const [selectedMedia, setSelectedMedia] = useState<EventMedia | null>(null);
  // const [selectedStreamer, setSelectedStreamer] = useState<EventParticipant | null>(null);
  // const [buyAmount, setBuyAmount] = useState("0.01");
  // const [isBuyMode, setIsBuyMode] = useState(true);

  // Resolve ipfs:// URIs to a public gateway URL
  function resolveIpfsUri(uri: string): string {
    const cid = uri.startsWith("ipfs://") ? uri.replace("ipfs://", "") : uri;
    return `https://ipfs.io/ipfs/${cid}`;
  }

  // Fetch event metadata from IPFS - prioritize graphEventData, then direct ipfsHash, then contract eventData
  useEffect(() => {
    let aborted = false;
    async function run() {
      let ipfsUri = ipfsHash;

      // Priority 1: Use IPFS hash from Graph Protocol data
      if (!ipfsUri && graphEventData && graphEventData.ipfsHash) {
        ipfsUri = graphEventData.ipfsHash.startsWith('ipfs://')
          ? graphEventData.ipfsHash
          : `ipfs://${graphEventData.ipfsHash}`;
        console.log('Using IPFS hash from Graph Protocol data:', ipfsUri);
      }

      // Priority 2: Use IPFS hash from contract eventData
      if (!ipfsUri && eventData && Array.isArray(eventData) && eventData.length > 0) {
        ipfsUri = eventData[0] as string; // Assuming the first element is the IPFS URI
        console.log('Using IPFS hash from contract eventData:', ipfsUri);
      }

      if (!ipfsUri) {
        console.log('No IPFS URI found, skipping IPFS fetch');
        return;
      }

      try {
        setIpfsLoading(true);
        setIpfsError(null);
        const url = resolveIpfsUri(ipfsUri);
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch IPFS metadata (${res.status})`);
        const json = await res.json() as Record<string, unknown>;
        if (!aborted) setIpfsData(json);
      } catch (e: unknown) {
        if (!aborted) setIpfsError((e as Error)?.message || "Failed to load IPFS metadata");
      } finally {
        if (!aborted) setIpfsLoading(false);
      }
    }
    run();
    return () => { aborted = true; };
  }, [ipfsHash, eventData, graphEventData]);

  // Format helpers for date/time (prefer IPFS startISO/endISO)
  // Accept either ISO strings or unix seconds/millis from IPFS
  const startISO: string | undefined = ipfsData?.startISO as string | undefined;
  const endISO: string | undefined = ipfsData?.endISO as string | undefined;

  // Show loading state if we're fetching data
  if (ipfsLoading || (eventId && !eventData && !ipfsData && !graphEventData)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--app-accent)] mx-auto mb-4"></div>
          <p className="text-[var(--app-foreground-muted)]">
            {eventId ? 'Retrieving event data...' : 'Loading event metadata...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if we have an error and no data
  if (ipfsError && !ipfsData && !graphEventData && !eventSlugData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-[var(--app-foreground)] mb-2">Event Not Found</h1>
          <p className="text-[var(--app-foreground-muted)] mb-4">
            {ipfsError || "Unable to load event data. The event may not exist or the data may be unavailable."}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg hover:bg-[var(--app-accent-hover)] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  const startUnix: number | undefined = typeof ipfsData?.startTime === 'number' ? ipfsData?.startTime : undefined;
  const endUnix: number | undefined = typeof ipfsData?.endTime === 'number' ? ipfsData?.endTime : undefined;

  function toDate(d?: string | number) {
    if (d === undefined) return undefined;
    if (typeof d === 'string') return new Date(d);
    // Heuristic: treat values < 10^12 as seconds, otherwise millis
    const secs = d < 1_000_000_000_000 ? d * 1000 : d;
    return new Date(secs);
  }

  const startDateObj = toDate(startISO ?? startUnix);
  const endDateObj = toDate(endISO ?? endUnix);

  const formattedDate = startDateObj
    ? startDateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : "December 15, 2024";
  const formattedTime = startDateObj && endDateObj
    ? `${startDateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - ${endDateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
    : "2:00 PM - 10:00 PM EST";

  // Loading UI while fetching IPFS
  if (ipfsHash && ipfsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--events-foreground)] bg-black/80">
        <div className="flex items-center space-x-3 text-sm">
          <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
          <span>Loading event data...</span>
        </div>
      </div>
    );
  }
  // Use real data from various sources, with IPFS data taking priority
  const event: EventDetails = {
    id: eventId || 'unknown',
    title: (ipfsData?.title as string) ||
      (eventSlugData?.title as string) ||
      (graphEventData?.eventId ? `Event #${graphEventData.eventId}` : "Event Details"),
    description:
      (ipfsData?.description as string) ||
      (eventSlugData?.description as string) ||
      "Event details will be available soon.",
    date: formattedDate,
    time: formattedTime,
    location: (ipfsData?.location as string) ||
      "Location TBD",
    coordinates: (ipfsData?.coordinates as { lat: number; lng: number }) ||
      (eventSlugData?.lat && eventSlugData?.lng ? { lat: eventSlugData.lat, lng: eventSlugData.lng } : { lat: 0, lng: 0 }),
    image: (ipfsData?.image as string) ||
      (eventSlugData?.avatarUrl as string) ||
      "/hero.png",
    category: (ipfsData?.category as string) ||
      (eventSlugData?.category as string) ||
      "General",
    maxParticipants: (ipfsData?.maxParticipants as number) ??
      (eventSlugData?.maxAttendees ? parseInt(eventSlugData.maxAttendees) : undefined) ??
      (graphEventData?.maxParticipants ? parseInt(graphEventData.maxParticipants) : undefined) ??
      100,
    currentParticipants: attendeesData ? (attendeesData as string[]).length : 0,
    isLive: (ipfsData?.isLive as boolean) ??
      (eventSlugData?.isLive as boolean) ??
      false,
    platforms: (ipfsData?.platforms as string[]) ||
      (eventSlugData?.platforms as string[]) ||
      ["Farcaster"],
    totalRewards: (ipfsData?.totalRewards as number) ?? 0,

    // ✅ Sessions & Agenda
    agenda: (ipfsData?.agenda as Record<string, unknown>[])?.map((a, idx) => ({
      id: (a.id as string) || `item-${idx}`,
      title: a.title as string,
      description: a.description as string,
      startTime: a.startTime as string,
      endTime: a.endTime as string,
      speakers: a.speakers as string[],
    })) || [],

    // ✅ Participants - use real attendees data
    participants: attendeesData ? (attendeesData as string[]).map((address, index) => ({
      id: address,
      name: `Participant ${index + 1}`,
      avatar: "/hero.png",
      role: "viewer" as const,
      bio: `Event participant with address ${address.slice(0, 6)}...${address.slice(-4)}`,
      contribution: 0
    })) : [],

    // ✅ Media - use real media data from IPFS if available
    media: (ipfsData?.media as Record<string, unknown>[])?.map((m, idx) => ({
      id: (m.id as string) || `media-${idx}`,
      type: ((m.type as string) === "video" ? "video" : "image") as "image" | "video",
      url: (m.url as string) || "/hero.png",
      title: (m.title as string) || "Event Media",
      uploadedBy: (m.uploadedBy as string) || "Event Team",
      uploadedAt: (m.uploadedAt as string) || "Recently",
      likes: (m.likes as number) || 0
    })) || [],

    // ✅ Rewards - use real rewards data from IPFS if available
    rewards: (ipfsData?.rewards as Record<string, unknown>[])?.map((r, idx) => ({
      id: (r.id as string) || `reward-${idx}`,
      name: (r.name as string) || "Event Reward",
      description: (r.description as string) || "Reward for participation",
      value: (r.value as number) || 0,
      currency: (r.currency as string) || "USD",
      totalPool: (r.totalPool as number) || 0,
      distributed: (r.distributed as number) || 0,
      icon: (r.icon as string) || "🎁"
    })) || [],

    // ✅ Sponsors & Partners - use real sponsors data from IPFS if available
    sponsors: (ipfsData?.sponsors as Record<string, unknown>[])?.map((s, idx) => ({
      name: (s.name as string) || `Sponsor ${idx + 1}`,
      logo: (s.logo as string) || "/hero.png",
      link: (s.link as string) || "#"
    })) || [],

    // ✅ Ticket Info - use real ticket data from IPFS or contract
    tickets: (ipfsData?.tickets as { available: boolean; types: { type: string; price: number; currency: string; perks?: string[] }[] }) ?? {
      available: graphEventData?.registrationFee ? parseFloat(graphEventData.registrationFee) > 0 : false,
      types: graphEventData?.registrationFee ? [{
        type: "Event Registration",
        price: parseFloat(graphEventData.registrationFee),
        currency: "ETH"
      }] : []
    },

    // ✅ Hosts - use real hosts data from IPFS if available
    hosts: (ipfsData?.hosts as Record<string, unknown>[])?.map((h: Record<string, unknown>) => ({
      name: h.name as string,
      avatar: (h.avatar as string) || "/hero.png",
      role: (h.role as string) || "Host",
      bio: h.bio as string,
      social: h.social as Record<string, string> || {},
    })) || [],

    // ✅ Social Links - use real social links from IPFS if available
    socialLinks: (ipfsData?.socialLinks as Record<string, string>) || {}
  };


  // const topContributors = [...event.participants]
  //   .sort((a, b) => b.contribution - a.contribution)
  //   .slice(0, 10);

  // const liveStreamers = event.participants.filter(p => p.isLive && p.role === "streamer");

  // const handleQuickAmount = (amount: string) => {
  //   if (amount === "Reset") {
  //     setBuyAmount("0.01");
  //   } else if (amount === "Max") {
  //     setBuyAmount("1"); // Assuming max is 1 ETH for simplicity
  //   } else {
  //     setBuyAmount(amount);
  //   }
  // };

  // const copyToClipboard = (text: string) => {
  //   navigator.clipboard.writeText(text).then(() => {
  //     alert("Contract address copied to clipboard!");
  //   }).catch(() => {
  //     alert("Failed to copy contract address.");
  //   });
  // };

  // Ticket helpers - use real ticket data from contract or fallback to IPFS data
  const ticketTypes = hasTickets ? tickets.map(ticket => {
    try {
      return {
        type: ticket.name || 'Unknown Ticket',
        price: parseFloat(ticket.price || '0') / 1e18, // Convert from wei to ETH
        currency: ticket.currency || 'ETH',
        quantity: parseInt(ticket.totalQuantity || '0'),
        perks: ticket.perks || []
      };
    } catch (error) {
      console.error('Error parsing ticket data:', error);
      return {
        type: 'Invalid Ticket',
        price: 0,
        currency: 'ETH',
        quantity: 0,
        perks: []
      };
    }
  }) : (event.tickets?.available ? (event.tickets?.types || []) : []);

  // Ensure selectedTicketIndex is within bounds
  const safeSelectedTicketIndex = Math.min(selectedTicketIndex, Math.max(0, ticketTypes.length - 1));
  const selectedTicket = ticketTypes[safeSelectedTicketIndex];
  const effectiveQty = ticketMode === "none" ? 0 : (ticketMode === "single" ? 1 : Math.max(1, ticketQuantity));
  const totalPrice = selectedTicket ? selectedTicket.price * effectiveQty : 0;
  // const canRegister = ticketMode === "none" || (event.tickets?.available && !!selectedTicket && effectiveQty > 0);
  const registerCta = ticketMode === "none" ? "RSVP" : "Get Tickets";




  //  function onBack(): void {
  //   window.history.back();
  // }

  // Prepare map data for EventsMap
  // Mapbox EventsMap dataset kept for future multi-event contexts if needed


  return (
    <div className="min-h-screen mt-12 text-[var(--events-foreground)] bg-background relative z-[20]">
      {/* Track view when page loads */}
      {eventId && <EventViewTracker eventId={eventId} />}
      {/* <StreamPublisher /> */}
      {/* Header */}
      {/* <div className="sticky top-0 z-40 bg-[var(--app-background)] border-b border-[var(--app-card-border)]">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--app-gray)] flex items-center justify-center">
              ←
            </div>
            Back to Events
          </button>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--app-card-border)] bg-[var(--app-card-bg)] hover:bg-[var(--app-gray)] transition-colors">
              <Heart className="w-4 h-4" />
              Save Event
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--app-card-border)] bg-[var(--app-card-bg)] hover:bg-[var(--app-gray)] transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div> */}

      {/* Hero Section */}
      <div className="relative h-[25rem] md:h-[25rem] mt-12 overflow-hidden">
        <div className="absolute mt-2 left-0">
          <Button variant="ghost" className="rounded-lg bg-transparent text-white cursor-pointer" onClick={() => router && router.back()}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Image
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover rounded-lg"
          width={1000}
          height={1000}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            {event.isLive && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE NOW
              </div>
            )}
            <span className="px-2 py-1 bg-[var(--events-accent)] text-white text-xs rounded-full">
              {event.category}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {event.title}
          </h1>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {event.date}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {event.time}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {event.location}
            </div>
            <ViewCount
              count={viewCount}
              isLoading={viewCountLoading}
              size="md"
              className="text-white/80"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 px-4 max-w-7xl mx-auto space-y-12">

        {/* Registration/Tickets Section */}
        <div className="border border-[var(--events-card-border)] rounded-xl border-none bg-transparent">
          <h2 className="text-xl font-semibold mb-4">
            {hasTickets ? "Purchase Tickets" : "Register"}
          </h2>
          {isRegistered !== undefined && isRegistered && (
            <div className="border border-[var(--events-card-border)] border-none bg-blue-500 mb-2">You are already registered for this event</div>
          )}

          {/* Show error if tickets failed to load */}
          {ticketsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800 text-sm">
                Error loading tickets: {ticketsError.message || 'Unknown error'}
              </div>
            </div>
          )}

          {/* Show tickets if available, otherwise show registration */}
          {!ticketsError && hasTickets ? (
            <>
              {/* Ticket types */}
              {ticketTypes.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-1 mb-0 bg-gray-300 dark:bg-gray-900 p-4 px-[0.2rem] pb-1 rounded-xl">
                    {ticketTypes.map((t, idx) => (
                      <button
                        type="button"
                        key={t.type}
                        onClick={() => setSelectedTicketIndex(idx)}
                        className={`text-left p-4 rounded-2xl transition-colors bg-white dark:bg-gray-800 border-none ${selectedTicketIndex === idx
                          ? "bg-[#edf6f9] dark:border-[var(--events-card-border)] dark:bg-gray-700 "
                          : "dark:border-[var(--events-card-border)] bg-transparent dark:bg-gray-800 "}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{t.type}</div>
                            {t.perks && t.perks.length > 0 && (
                              <div className="text-xs text-[var(--events-foreground-muted)] mt-1">
                                {t.perks.join(" • ")}
                              </div>
                            )}
                          </div>
                          <div className="text-right font-semibold">
                            {t.currency === "USD" ? "$" : ""}{t.price.toLocaleString()}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Quantity selector */}
                  {ticketMode === "multiple" && selectedTicket && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--events-foreground-muted)]">Quantity</span>
                      <div className="inline-flex items-center rounded-lg border border-[var(--events-card-border)]">
                        <button
                          type="button"
                          onClick={() => setTicketQuantity((q) => Math.max(1, q - 1))}
                          className="px-3 py-1.5 text-sm hover:bg-[var(--events-accent)]/10"
                        >
                          −
                        </button>
                        <div className="px-4 py-1.5 text-sm">{ticketQuantity}</div>
                        <button
                          type="button"
                          onClick={() => setTicketQuantity((q) => Math.min(10, q + 1))}
                          className="px-3 py-1.5 text-sm hover:bg-[var(--events-accent)]/10"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Purchase button */}
                  {selectedTicket && canPurchaseTickets && tickets.length > 0 && safeSelectedTicketIndex < tickets.length && (
                    <div className="flex items-center gap-1 mb-0 bg-gray-300 p-4 px-[0.2rem] rounded-xl pb-0">
                      <Transaction
                        chainId={chainId}
                        contracts={[
                          {
                            abi: ticketAbi.abi as Abi,
                            address: ticketAddress as `0x${string}`,
                            functionName: "purchaseTicket",
                            args: [
                              BigInt(tickets[safeSelectedTicketIndex].ticketId),
                              BigInt(ticketQuantity)
                            ],
                            value: BigInt(Math.floor((selectedTicket?.price || 0) * ticketQuantity * 1e18)), // Convert to wei
                          },
                        ]}
                        onStatus={(s) => {
                          setIsPurchasing(s.statusName === "transactionPending" || s.statusName === "buildingTransaction");
                          if (s.statusName === "success") {
                            setShowRegistrationSuccess(true);
                          }
                        }}
                      >
                        <TransactionButton
                          text={isPurchasing ? "Purchasing..." : `Purchase ${ticketQuantity} Ticket${ticketQuantity > 1 ? 's' : ''}`}
                          className="mb-0 p-2 font-medium rounded-xl"
                        />
                        <TransactionStatus>
                          <TransactionStatusLabel />
                          <TransactionStatusAction />
                        </TransactionStatus>
                      </Transaction>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-[var(--events-foreground-muted)]">No tickets available</div>
              )}
            </>
          ) : !ticketsError ? (
            /* Regular registration when no tickets */
            <div className="border border-[var(--events-card-border)] border-none bg-transparent mb-2">
              <div className="flex items-center gap-1 mb-0 bg-gray-300 p-4 px-[0.2rem] rounded-xl pb-0">
                {canTransact ? (
                  <Transaction
                    chainId={chainId}
                    contracts={[
                      {
                        abi: eventAbi.abi as Abi,
                        address: eventAddress as `0x${string}`,
                        functionName: "registerForEvent",
                        args: [BigInt(numericEventId || 1), "0x"],
                      },
                    ]}
                    onStatus={(s) => {
                      console.log('Registration transaction status:', s);
                      setIsRegistering(s.statusName === "transactionPending" || s.statusName === "buildingTransaction");
                      if (s.statusName === "success") {
                        setShowRegistrationSuccess(true);
                      }
                      if (s.statusName === "error") {
                        console.error('Registration transaction error:', s);
                      }
                    }}
                  >
                    <TransactionButton text={isRegistering ? "Registering..." : "Register for Event"} className="mb-0 p-2 font-medium rounded-xl" />
                    <TransactionStatus>
                      <TransactionStatusLabel />
                      <TransactionStatusAction />
                    </TransactionStatus>
                  </Transaction>
                ) : (
                  <></>
                )}
              </div>
            </div>
          ) : null}

          {/* Summary */}
          {/* <div className="mt-4 flex items-center justify-between px-4">
            <div className="text-sm text-[var(--events-foreground-muted)]">
              {ticketMode === "none" && "No ticket required (RSVP)"}
              {ticketMode !== "none" && selectedTicket && (
                <>
                  <span>{selectedTicket.type}</span>
                  {ticketMode === "multiple" && <span> × {effectiveQty}</span>}
                </>
              )}
            </div>
            <div className="text-base font-semibold">
              {ticketMode === "none" ? "Free" : (
                selectedTicket ? `${selectedTicket.currency === "USD" ? "$" : ""}${totalPrice.toLocaleString()}` : "—"
              )}
            </div>
          </div> */}
        </div>


        {/* Live Streamers */}
        {/* {liveStreamers.length > 0 && (
          <div className="border border-[var(--events-card-border)] rounded-xl p-4 sm:p-6 border-none bg-transparent">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Live Now
            </h2>
            <div className="gap-4 flex">
              {liveStreamers.map((streamer) => (
                <div key={streamer.id} className="flex flex-col items-center min-w-[72px]">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-red-500 shadow">
                    <img src={streamer.avatar} alt={streamer.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs mt-1">{streamer.name}</div>
                  <div className="text-[10px] text-[var(--events-foreground-muted)] flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {streamer.earnings}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* Overview Content - All Sections Combined */}
        <div className="space-y-4 sm:space-y-6">
          {/* Description */}
          <div className="border border-[var(--events-card-border)] rounded-xl border-none bg-transparent">
            <h2 className="text-xl font-semibold mb-2">About This Event</h2>
            <p className="text-[var(--events-foreground-muted)] leading-relaxed text-sm">
              {event.description}
            </p>
          </div>



          {/* Agenda Section */}
          <div className="border border-[var(--events-card-border)] rounded-xl border-none bg-transparent">
            <h2 className="text-xl font-semibold mb-4">Agenda</h2>
            <div className="text-[var(--events-foreground-muted)] leading-relaxed">
              {event.agenda.map((agenda) => (
                <div key={agenda.id}>
                  <h3 className="text-lg font-medium mb-2">{agenda.title}</h3>
                  <p className="text-sm text-[var(--events-foreground-muted)] mb-2">{agenda.description}</p>
                  <p className="text-sm text-[var(--events-foreground-muted)] mb-2">{agenda.startTime} - {agenda.endTime}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hosts Section */}
          {event.hosts && event.hosts.length > 0 && (
            <div className="border border-[var(--events-card-border)] rounded-xl border-none bg-transparent">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                Hosts
              </h2>
              <div className="space-y-2">
                {event.hosts.map((host, index) => (
                  <div key={index} className="flex items-start gap-4 p-2 border-none border-[var(--events-card-border)] rounded-lg">
                    <div className="flex-shrink-0">
                      <Avatar address={host.name as `0x${string}` || ""} style={{ width: "40px", height: "40px" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className=" font-medium text-[14px]">{host.name}</h3>
                        <ProfileSocials userAddress={host.name as `0x${string}` || ""} records={host.social} style={{}} />
                        {/* {host.social && (
                          <div className="flex items-center gap-2">
                          {host.social.twitter && (
                            <a
                            href={host.social.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--events-foreground-muted)] hover:text-[var(--events-foreground)] transition-colors"
                            >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            </a>
                            )}
                            {host.social.linkedin && (
                              <a
                              href={host.social.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--events-foreground-muted)] hover:text-[var(--events-foreground)] transition-colors"
                              >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                              </a>
                              )}
                              {host.social.website && (
                                <a
                                href={host.social.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--events-foreground-muted)] hover:text-[var(--events-foreground)] transition-colors"
                                >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                </svg>
                                </a>
                                )}
                                </div>
                                )} */}
                      </div>
                      <p className="text-xs text-[var(--events-accent)] font-medium mb-2">{host.role}</p>
                      <FollowersYouKnow connectedAddress={address as `0x${string}` || ""} lookupAddressOrName={host.name as `0x${string}` || ""} />

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Section */}
          <div className="border border-[var(--events-card-border)] rounded-xl border-none bg-transparent">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Location
            </h2>
            <div className="space-y-4">
              <div>
                {/* <h3 className="text-lg font-medium mb-2">{event.location}</h3> */}
                <div className="text-[var(--events-foreground-muted)] space-y-1">
                  <p>📍 {event.location}</p>
                  {/* <p>📅 {event.date}</p> */}
                  {/* <p>🕒 {event.time}</p> */}
                </div>
              </div>

              {/* Location display - map for offline, URL for online */}
              {event.location.startsWith('http') ? (
                <div className="bg-transparent border border-border rounded-lg text-center p-4">
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">Online Event</div>
                    <a
                      href={event.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Join Online Event
                    </a>
                    <div className="text-xs text-muted-foreground break-all">
                      {event.location}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-transparent border border-border rounded-lg text-center p-0">
                  <StaticLocationMap lat={event.coordinates.lat} lng={event.coordinates.lng} heightClass="h-64" />
                </div>
              )}

            </div>
          </div>
          {/* <EventCam setActiveTab={() => { }} /> */}

          {/* Participants Section */}
          <div className="border border-[var(--events-card-border)] rounded-xl border-none bg-transparent">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              All Participants ({Array.isArray(attendeesData) ? attendeesData.length : 0})
            </h2>
            <ParticipantsGrid
              addresses={
                Array.isArray(attendeesData)
                  ? attendeesData.map((att: Record<string, unknown>) => (att?.attendee as string) || (att?.wallet as string) || (att as unknown as string)).filter(Boolean) as string[]
                  : []
              }
              maxItems={4}
            />
          </div>


        </div>
      </div>

      {/* Event Management - Only show to event creator */}
      {
        isEventCreator && eventId && (
          <EventManagement
            eventId={eventId}
            defaultIpfsHash={ipfsHash || ""}
          />
        )
      }

      {/* Sticky Registration Button */}
      {
        !isRegistered &&
        (<div
          className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out bg-black/40 border-none ${isScrolling ? 'translate-y-full' : 'translate-y-0'
            }`}
        >
          <div className="bg-white/80 dark:bg-transparent backdrop-blur-sm border-t border-[var(--events-card-border)] p-4 border-none min-h-[6rem]">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--events-foreground)]">
                    {event.title}
                  </div>
                  <div className="text-xs text-[var(--events-foreground-muted)]">
                    {event.date} • {event.time}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-col">
                  <div className="text-right">
                    <div className="text-xs text-[var(--events-foreground-muted)]">{ticketMode === "none" ? "RSVP" : (selectedTicket ? selectedTicket.type : "Ticket")}{ticketMode === "multiple" && selectedTicket ? ` × ${effectiveQty}` : ""}</div>
                    <div className="text-base font-semibold">{ticketMode === "none" ? "Free" : (selectedTicket ? `${selectedTicket.currency === "USD" ? "$" : ""}${totalPrice.toLocaleString()}` : "—")}</div>
                  </div>
                  {/* <button className="px-4 py-2 text-sm font-medium text-[var(--events-foreground)] border border-[var(--events-card-border)] rounded-lg hover:bg-[var(--events-accent)]/10 transition-colors">
                  Share
                </button> */}
                  {isMounted && canTransact ? (
                    <Transaction
                      chainId={chainId}
                      contracts={[
                        {
                          abi: eventAbi.abi as Abi,
                          address: eventAddress as `0x${string}`,
                          functionName: "registerForEvent",
                          args: [BigInt(numericEventId || 0), "0x"],
                        },
                      ]}
                      onStatus={(s) => {
                        console.log('Sticky registration transaction status:', s);
                        setIsRegistering(s.statusName === "transactionPending" || s.statusName === "buildingTransaction");
                        if (s.statusName === "success") {
                          setShowRegistrationSuccess(true);
                        }
                        if (s.statusName === "error") {
                          console.error('Sticky registration transaction error:', s);
                        }
                      }}
                    >
                      <TransactionButton text={isRegistering ? (ticketMode === "none" ? "RSVP..." : "Processing...") : registerCta} className="bg-transparent hover:bg-transparent text-foreground dark:text-foreground p-0 underline text-sm font-medium cursor-pointer" />
                      <TransactionStatus>
                        <TransactionStatusLabel />
                        <TransactionStatusAction />
                      </TransactionStatus>
                    </Transaction>
                  ) : (
                    <button
                      onClick={() => setShowWalletModal(true)}
                      className="bg-transparent hover:bg-transparent text-foreground dark:text-foreground p-0 underline text-sm font-medium cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>)
      }

      {/* Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        className="bg-black shadow-lg"
      />

      {/* Registration Success Card */}
      {
        showRegistrationSuccess && (
          <RegistrationSuccessCard
            event={event}
            ticketType={selectedTicket?.type}
            quantity={effectiveQty}
            totalPrice={totalPrice}
            currency={selectedTicket?.currency || "USD"}
            onClose={() => setShowRegistrationSuccess(false)}
          />
        )
      }
    </div >
  );
}
