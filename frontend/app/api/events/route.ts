import { NextResponse } from "next/server";

export async function GET() {
  const events = [
    // Brooklyn area - high density cluster
    {
      id: "e1",
      title: "Artists & Fleas",
      username: "remiere",
      slug: "artists01",
      lat: 40.7189,
      lng: -73.959,
      isLive: true,
      avatarUrl: "/icon.png",
      platforms: ["Farcaster"],
    },
    {
      id: "e2",
      title: "Devoción Coffee",
      username: "mochi",
      slug: "devocion2",
      lat: 40.7225,
      lng: -73.9538,
      isLive: true,
      avatarUrl: "/logo.png",
      platforms: ["YouTube", "Farcaster"],
    },
    {
      id: "e3",
      title: "Domino Park",
      username: "sauced",
      slug: "domino03",
      lat: 40.718,
      lng: -73.967,
      isLive: false,
      avatarUrl: "/splash.svg",
      platforms: [],
    },
    {
      id: "e4",
      title: "Brooklyn Bridge Walk",
      username: "cityexplorer",
      slug: "bridge04",
      lat: 40.7061,
      lng: -73.9969,
      isLive: true,
      avatarUrl: "/hero.png",
      platforms: ["Twitch", "Farcaster"],
    },
    {
      id: "e5",
      title: "DUMBO Art Walk",
      username: "artlover",
      slug: "dumbo05",
      lat: 40.7033,
      lng: -73.9867,
      isLive: false,
      avatarUrl: "/screenshot.png",
      platforms: ["Farcaster"],
    },
    {
      id: "e6",
      title: "Brooklyn Heights Promenade",
      username: "nycnight",
      slug: "heights6",
      lat: 40.6996,
      lng: -73.9937,
      isLive: true,
      avatarUrl: "/icon.svg",
      platforms: ["YouTube"],
    },

    // Manhattan area - medium density cluster
    {
      id: "e7",
      title: "Central Park Picnic",
      username: "naturelover",
      slug: "central7",
      lat: 40.7829,
      lng: -73.9654,
      isLive: false,
      avatarUrl: "/logo.png",
      platforms: ["Farcaster"],
    },
    {
      id: "e8",
      title: "Times Square Lights",
      username: "urbanhiker",
      slug: "timesq08",
      lat: 40.7580,
      lng: -73.9855,
      isLive: true,
      avatarUrl: "/splash.svg",
      platforms: ["Twitch", "YouTube"],
    },
    {
      id: "e9",
      title: "High Line Walk",
      username: "cityguide",
      slug: "highln09",
      lat: 40.7484,
      lng: -74.0047,
      isLive: false,
      avatarUrl: "/hero.png",
      platforms: ["Farcaster"],
    },

    // Queens area - low density cluster
    {
      id: "e10",
      title: "Gantry Plaza State Park",
      username: "queenslocal",
      slug: "gantry10",
      lat: 40.7421,
      lng: -73.9577,
      isLive: false,
      avatarUrl: "/screenshot.png",
      platforms: [],
    },

    // Bronx area - single event
    {
      id: "e11",
      title: "Bronx Zoo Adventure",
      username: "wildlife",
      slug: "bronx11",
      lat: 40.8506,
      lng: -73.8770,
      isLive: true,
      avatarUrl: "/icon.png",
      platforms: ["YouTube"],
    },
  ];

  return NextResponse.json({ events });
}


