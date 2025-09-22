
type EventFormData = {
  title: string;
  description: string;
  date: string;
  time: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  coordinates: { lat: number; lng: number };
  image: string;
  category: string;
  maxParticipants: number;
  isLive: boolean;
  platforms: string[];
  totalRewards: number;
  eventType: "Online" | "In-Person" | "Hybrid";
  slug?: string;
  hosts: {
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
  agenda: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    speakers?: string[];
  }[];
  sponsors: {
    name: string;
    logo: string;
    link: string;
  }[];
  tickets: {
    available: boolean;
    types: { type: string; price: number; currency: string; quantity: number; perks?: string[] }[];
  };
  socialLinks: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  tempHost?: {
    name: string;
    role: string;
  };
  tempAgenda?: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    speakers: string[];
  };
  tempTicket?: {
    type: string;
    price: number;
    currency: string;
    quantity: number;
    perks: string[];
  };
};

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
export type { EventFormData, EventDetails, EventParticipant, EventMedia, EventReward, EventAgenda };
