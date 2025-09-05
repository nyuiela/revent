"use client";

import {
   Calendar,
   MapPin,
   Users,
   Eye,
   Clock,
} from "lucide-react";
import { useState, useEffect } from "react";



type EventParticipant = {
   id: string;
   name: string;
   avatar: string;
   bio?: string;
   role: "streamer" | "viewer" | "organizer";
   contribution: number;
   isLive?: boolean;
   platform?: string;
   tokenName?: string;
   tokenTicker?: string;
   tokenContract?: string;
   marketCap?: number;
   volume?: number;
   earnings?: number;
   volume24h?: number;
   earnings24h?: number;
   social?: {
      discord?: string;
      twitter?: string;
      website?: string;
      twitch?: string;
      youtube?: string;
      facebook?: string;
      instagram?: string;
      tiktok?: string;
      telegram?: string;
   },
};

type EventMedia = {
   id: string;
   type: "image" | "video";
   url: string;
   thumbnail?: string;
   title: string;
   uploadedBy: string;
   uploadedAt: string;
   likes: number;
};

type EventReward = {
   id: string;
   name: string;
   description: string;
   value: number;
   currency: string;
   totalPool: number;
   distributed: number;
   icon: string;
};

type EventAgenda = {
   id: string;
   title: string;
   description: string;
   startTime: string;
   endTime: string;
   speakers?: string[];
};

type EventDetails = {
   id: string;
   title: string;
   description: string;
   date: string;
   time: string;
   location: string;
   coordinates: { lat: number; lng: number };
   image: string;
   category: string;
   maxParticipants: number;
   currentParticipants: number;
   isLive: boolean;
   platforms: string[];
   totalRewards: number;
   participants: EventParticipant[];
   media: EventMedia[];
   rewards: EventReward[];
   agenda: EventAgenda[];
   hosts?: {
      name: string;
      avatar: string;
      role: string;
      bio?: string;
      social?: {
         twitter?: string;
         linkedin?: string;
         website?: string;
      };
   }[];
   sponsors?: {
      name: string;
      logo: string;
      link: string;
   }[],
   tickets?: {
      available: boolean;
      types: { type: string; price: number; currency: string; perks?: string[] }[];
   },
   socialLinks?: {
      twitter?: string;
      discord?: string;
      website?: string;
   };
};

type Props = {
   eventId: string;
   ipfsHash?: string; // e.g., ipfs://CID or CID
   onBack?: () => void;
};

export default function EventPage({ eventId, ipfsHash }: Props) {
   const [isScrolling, setIsScrolling] = useState(false);
   const [lastScrollY, setLastScrollY] = useState(0);

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

   function toDate(d?: string | number) {
      if (d === undefined) return undefined;
      if (typeof d === 'string') return new Date(d);
      // Heuristic: treat values < 10^12 as seconds, otherwise millis
      const secs = d < 1_000_000_000_000 ? d * 1000 : d;
      return new Date(secs);
   }


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
   // Mock data - merged with IPFS data when available
   const event: EventDetails = {
      id: eventId,
      title: ipfsData?.title || "Crypto Gaming Championship 2024",
      description:
         ipfsData?.description ||
         "The Crypto Gaming Championship 2024 is the premier global esports event powered by blockchain. Join pro gamers, streamers, and fans for an action-packed day of gameplay, NFT collectibles, and decentralized rewards. Watch live streams across Twitch, YouTube, and Farcaster, with real-time prize distribution via smart contracts. Compete, collect, and connect with the future of gaming!",
      date: formattedDate,
      time: formattedTime,
      location: ipfsData?.location || "Miami Beach Convention Center, FL",
      coordinates: { lat: 25.7617, lng: -80.1918 },
      image: ipfsData?.image || "/hero.png",
      category: ipfsData?.category || "Gaming & Esports",
      maxParticipants: ipfsData?.maxParticipants ?? 500,
      currentParticipants: 342,
      isLive: true,
      platforms: ipfsData?.platforms || ["Twitch", "YouTube", "Farcaster"],
      totalRewards: ipfsData?.totalRewards ?? 25000,

      // ✅ Sessions & Agenda
      agenda: (ipfsData?.agenda as any[])?.map((a, idx) => ({
         id: a.id || `item-${idx}`,
         title: a.title,
         description: a.description,
         startTime: a.startTime,
         endTime: a.endTime,
         speakers: a.speakers,
      })) || [
            {
               id: "session1",
               title: "Opening Ceremony & Keynote",
               description: "Kick-off with keynote from Blockchain Pro on the future of crypto gaming.",
               startTime: "2:00 PM",
               endTime: "3:00 PM",
               speakers: ["Blockchain Pro"]
            },
            {
               id: "session2",
               title: "Qualifier Matches",
               description: "Streamers face off in elimination rounds streamed live with interactive polls.",
               startTime: "3:00 PM",
               endTime: "6:00 PM",
               speakers: ["Alex Gaming", "Crypto Queen"]
            },
            {
               id: "session3",
               title: "Community Challenge",
               description: "Fans compete in live mini-games for on-chain rewards and NFTs.",
               startTime: "6:00 PM",
               endTime: "7:30 PM"
            },
            {
               id: "session4",
               title: "Grand Finals & Award Ceremony",
               description: "Final showdown of the top 2 teams, followed by prize distribution.",
               startTime: "8:00 PM",
               endTime: "10:00 PM"
            }
         ],

      // ✅ Participants
      participants: [
         {
            id: "1",
            name: "Alex Gaming",
            avatar: "/hero.png",
            role: "streamer",
            bio: "Top Twitch streamer known for strategy-based crypto games.",
            contribution: 1500,
            isLive: true,
            platform: "Twitch",
            tokenName: "lofi_deep_sleep",
            tokenTicker: "LOFI",
            tokenContract: "0x1234567890123456789012345678901234567890",
            marketCap: 1000000,
            volume: 12000,
            earnings: 500,
            volume24h: 8000,
            earnings24h: 300,
            social: {
               twitter: "https://x.com/alexgaming",
               twitch: "https://twitch.tv/alexgaming"
            }
         },
         {
            id: "2",
            name: "Crypto Queen",
            avatar: "/hero.png",
            role: "streamer",
            bio: "YouTube personality bringing crypto insights and esports commentary.",
            contribution: 1200,
            isLive: true,
            platform: "YouTube",
            tokenName: "crypto_queen_token",
            tokenTicker: "CQ",
            tokenContract: "0x9876543210987654321098765432109876543210",
            marketCap: 500000,
            volume: 5000,
            earnings: 200,
            volume24h: 3000,
            earnings24h: 100,
            social: {
               twitter: "https://x.com/cryptoqueen",
               youtube: "https://youtube.com/cryptoqueen"
            }
         },
         {
            id: "3",
            name: "Blockchain Pro",
            avatar: "/hero.png",
            role: "organizer",
            bio: "Industry veteran and co-founder of the Crypto Gaming Alliance.",
            contribution: 800
         },
         {
            id: "4",
            name: "Gamer123",
            avatar: "/hero.png",
            role: "viewer",
            bio: "Longtime esports fan and active NFT collector.",
            contribution: 450
         }
      ],

      // ✅ Media
      media: [
         {
            id: "1",
            type: "image",
            url: "/hero.png",
            title: "Event Setup",
            uploadedBy: "Event Team",
            uploadedAt: "2 hours ago",
            likes: 24
         },
         {
            id: "2",
            type: "video",
            url: "/hero.png",
            thumbnail: "/hero.png",
            title: "Opening Ceremony",
            uploadedBy: "Live Stream",
            uploadedAt: "1 hour ago",
            likes: 156
         }
      ],

      // ✅ Rewards
      rewards: [
         {
            id: "1",
            name: "Grand Prize",
            description: "First place in the championship",
            value: 10000,
            currency: "USD",
            totalPool: 10000,
            distributed: 0,
            icon: "🏆"
         },
         {
            id: "2",
            name: "Streamer Rewards",
            description: "Top performing streamers",
            value: 5000,
            currency: "USD",
            totalPool: 10000,
            distributed: 2500,
            icon: "🎥"
         },
         {
            id: "3",
            name: "Community Rewards",
            description: "Most engaged participants",
            value: 2500,
            currency: "USD",
            totalPool: 5000,
            distributed: 1200,
            icon: "👥"
         }
      ],

      // ✅ Sponsors & Partners (prefer IPFS if provided)
      sponsors: Array.isArray(ipfsData?.sponsors) ? ipfsData?.sponsors : [
         {
            name: "Yield Finance",
            logo: "/yield.png",
            link: "https://yield.xyz"
         },
         {
            name: "Polygon Labs",
            logo: "/polygon.png",
            link: "https://polygon.technology"
         }
      ],

      // ✅ Ticket Info (prefer IPFS metadata if present)
      tickets: ipfsData?.tickets ?? {
         available: true,
         types: [
            { type: "General Admission", price: 50, currency: "USD" },
            { type: "VIP", price: 200, currency: "USD", perks: ["Backstage access", "Exclusive NFT"] }
         ]
      },

      // ✅ Hosts (if ipfsHash present, only render IPFS hosts; else fallback to mock)
      hosts: ipfsHash
         ? (Array.isArray(ipfsData?.hosts)
            ? ipfsData.hosts.map((h: any) => ({
               name: h.name,
               avatar: h.avatar || "/hero.png",
               role: h.role || "Host",
               bio: h.bio,
               social: h.social || {},
            }))
            : [])
         : [
            {
               name: "Sarah Chen",
               avatar: "/hero.png",
               role: "Event Director & Co-Founder",
               bio: "Blockchain gaming enthusiast with 8+ years in esports. Former professional gamer and current advocate for Web3 gaming adoption.",
               social: {
                  twitter: "https://x.com/sarahchen",
                  linkedin: "https://linkedin.com/in/sarahchen",
                  website: "https://sarahchen.dev"
               }
            },
            {
               name: "Marcus Rodriguez",
               avatar: "/hero.png",
               role: "Technical Lead",
               bio: "Full-stack developer specializing in blockchain integration and smart contract development for gaming platforms.",
               social: {
                  twitter: "https://x.com/marcusrodriguez",
                  linkedin: "https://linkedin.com/in/marcusrodriguez"
               }
            },
            {
               name: "Crypto Gaming Alliance",
               avatar: "/hero.png",
               role: "Organizing Partner",
               bio: "Leading organization dedicated to advancing blockchain gaming and fostering community growth in the Web3 gaming space."
            }
         ],

      // ✅ Social Links (prefer IPFS)
      socialLinks: ipfsData?.socialLinks || {
         twitter: "https://x.com/cryptogamingchamps",
         discord: "https://discord.gg/cryptogaming",
         website: "https://cryptogamingchampionship.com"
      }
   };


   // const topContributors = [...event.participants]
   //   .sort((a, b) => b.contribution - a.contribution)
   //   .slice(0, 10);

   const liveStreamers = event.participants.filter(p => p.isLive && p.role === "streamer");

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

   // Ticket helpers
   const ticketTypes = event.tickets?.available ? (event.tickets?.types || []) : [];
   const selectedTicket = ticketTypes[selectedTicketIndex];
   const effectiveQty = ticketMode === "none" ? 0 : (ticketMode === "single" ? 1 : Math.max(1, ticketQuantity));
   const totalPrice = selectedTicket ? selectedTicket.price * effectiveQty : 0;
   const canRegister = ticketMode === "none" || (event.tickets?.available && !!selectedTicket && effectiveQty > 0);
   const registerCta = ticketMode === "none" ? "RSVP" : "Get Tickets";





   return (
      <div className="min-h-screen text-[var(--events-foreground)] bg-black/80 relative z-[20]">

         {/* Hero Section */}
         <div className="relative h-[25rem] md:h-[25rem] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
               src={event.image}
               alt={event.title}
               className="w-full h-full object-cover"
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
               </div>
            </div>
         </div>

         {/* Content */}
         <div className="p-0 max-w-7xl mx-auto space-y-0 pt-6 mt-4 bg-red-transparent">

            {/* Tickets Section */}
            <div className="border border-[var(--events-card-border)] rounded-xl p-6 py-0 border-none bg-transparent">
               <h2 className="text-xl font-semibold mb-4">Tickets</h2>

               {/* Mode selector */}
               {/* <div className="inline-flex items-center bg-black/70 text-white rounded-full p-1 mb-4">
              {(["none", "single", "multiple"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setTicketMode(mode);
                    if (mode === "none") {
                      setTicketQuantity(0);
                    } else if (mode === "single") {
                      setTicketQuantity(1);
                    }
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full transition-all ${ticketMode === mode ? "bg-white text-black" : "text-white"}`}
                >
                  {mode}
                </button>
              ))}
            </div> */}

               {ticketMode !== "none" && (
                  <>
                     {/* Ticket types */}
                     {ticketTypes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                           {ticketTypes.map((t, idx) => (
                              <button
                                 type="button"
                                 key={t.type}
                                 onClick={() => setSelectedTicketIndex(idx)}
                                 className={`text-left p-4 rounded-2xl border transition-colors bg-black/50 ${selectedTicketIndex === idx
                                    ? "border-[var(--events-accent)] bg-[var(--events-accent)]/10"
                                    : "border-[var(--events-card-border)] bg-transparent hover:border-[var(--events-accent)]/50"}`}
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
                     ) : (
                        <div className="text-sm text-[var(--events-foreground-muted)]">Tickets not available</div>
                     )}

                     {/* Quantity selector for multiple */}
                     {/* {ticketMode === "multiple" && selectedTicket && (
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
              )} */}
                  </>
               )}


               {/* Live Streamers */}
               {liveStreamers.length > 0 && (
                  <div className="border border-[var(--events-card-border)] rounded-xl p-6 border-none bg-transparent">
                     <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Live Now
                     </h2>
                     <div className="gap-4 flex">
                        {liveStreamers.map((streamer) => (
                           <div key={streamer.id} className="flex flex-col items-center min-w-[72px]">
                              <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-red-500 shadow">
                                 {/* eslint-disable-next-line @next/next/no-img-element */}
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
               )}

               {/* Overview Content - All Sections Combined */}
               <div className="space-y-2">
                  {/* Description */}
                  <div className="border border-[var(--events-card-border)] rounded-xl p-6 border-none bg-transparent">
                     <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                     <p className="text-[var(--events-foreground-muted)] leading-relaxed">
                        {event.description}
                     </p>
                  </div>


                  {/* Agenda Section */}
                  <div className="border border-[var(--events-card-border)] rounded-xl p-6 border-none bg-transparent">
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


               </div>
            </div>




         </div >
         );
}
