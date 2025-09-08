
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

export type { EventFormData };