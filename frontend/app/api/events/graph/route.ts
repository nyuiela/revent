import { NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";

// Define Graph Protocol configuration for server-side use
// const url = 'https://api.studio.thegraph.com/query/87766/stream/version/latest';
const url = process.env.NEXT_PUBLIC_GRAPH_URL as string;
const headers = { Authorization: 'Bearer 6abc6de0d06cbf79f985314ef9647365' };

// Type definitions for Graph Protocol data
interface GraphEvent {
  id: string;
  eventId: string;
  creator: string;
  ipfsHash: string;
  startTime: string;
  endTime: string;
  maxAttendees: string;
  registrationFee: string;
  slug: string;
  blockNumber: string;
  blockTimestamp: string;
}

interface IPFSEventMetadata {
  title: string;
  description: string;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  image?: string;
  category?: string;
  platforms?: string[];
  username?: string;
}

// Function to fetch IPFS metadata
async function fetchIPFSMetadata(ipfsHash: string): Promise<IPFSEventMetadata | null> {
  try {
    // Remove ipfs:// prefix if present
    const cleanHash = ipfsHash.replace('ipfs://', '');
    // Use IPFS gateway to fetch metadata
    const response = await fetch(`https://ipfs.io/ipfs/${cleanHash}`);
    if (!response.ok) {
      console.warn(`Failed to fetch IPFS metadata for ${ipfsHash}:`, response.status);
      return null;
    }
    const metadata = await response.json();
    return metadata as IPFSEventMetadata;
  } catch (error) {
    console.warn(`Error fetching IPFS metadata for ${ipfsHash}:`, error);
    return null;
  }
}

// Function to determine if event is currently live
function isEventLive(startTime: string, endTime: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const start = parseInt(startTime);
  const end = parseInt(endTime);
  return now >= start && now <= end;
}

// Function to generate fallback data for events without IPFS metadata
function generateFallbackEvent(graphEvent: GraphEvent): {
  id: string;
  title: string;
  username: string;
  lat: number;
  lng: number;
  isLive: boolean;
  avatarUrl: string;
  platforms: string[];
  creator: string;
  startTime: string;
  endTime: string;
  maxAttendees: string;
  registrationFee: string;
  slug: string;
  blockTimestamp: string;
} {
  const isLive = isEventLive(graphEvent.startTime, graphEvent.endTime);

  return {
    id: graphEvent.eventId,
    title: `Event #${graphEvent.eventId}`,
    username: `user_${graphEvent.creator.slice(0, 6)}`,
    lat: 40.7189 + (Math.random() - 0.5) * 0.1, // Random location around Brooklyn
    lng: -73.959 + (Math.random() - 0.5) * 0.1,
    isLive,
    avatarUrl: "/icon.png", // Default avatar
    platforms: ["Farcaster"], // Default platform
    creator: graphEvent.creator,
    startTime: graphEvent.startTime,
    endTime: graphEvent.endTime,
    maxAttendees: graphEvent.maxAttendees,
    registrationFee: graphEvent.registrationFee,
    slug: graphEvent.slug,
    blockTimestamp: graphEvent.blockTimestamp,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    console.log(`Fetching events from The Graph Protocol - Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

    // Define the query as a string to avoid gql template literal issues
    const query = `{
      eventCreateds(first: ${limit}, skip: ${skip}, orderBy: blockTimestamp, orderDirection: desc) {
        id
        eventId
        creator
        ipfsHash
        startTime
        endTime
        maxAttendees
        registrationFee
        slug
        blockNumber
        blockTimestamp
      }
    }`;

    // Fetch events from The Graph Protocol using GraphQLClient
    const client = new GraphQLClient(url, { headers });
    const graphData = await client.request(query) as { eventCreateds?: GraphEvent[] };
    const graphEvents: GraphEvent[] = graphData.eventCreateds || [];

    // console.log(`Fetched ${graphEvents.length} events from The Graph Protocol:`, graphEvents);

    // Process events and fetch IPFS metadata
    const processedEvents = await Promise.all(
      graphEvents.map(async (graphEvent) => {
        try {
          // Fetch IPFS metadata
          const metadata = await fetchIPFSMetadata(graphEvent.ipfsHash);

          if (metadata) {
            // Use IPFS metadata if available
            const isLive = isEventLive(graphEvent.startTime, graphEvent.endTime);

            return {
              id: graphEvent.eventId,
              title: metadata.title || `Event #${graphEvent.eventId}`,
              username: metadata.username || `user_${graphEvent.creator.slice(0, 6)}`,
              lat: metadata.location?.lat || (40.7189 + (Math.random() - 0.5) * 0.1),
              lng: metadata.location?.lng || (-73.959 + (Math.random() - 0.5) * 0.1),
              isLive,
              avatarUrl: metadata.image || "/icon.png",
              platforms: metadata.platforms || ["Farcaster"],
              creator: graphEvent.creator,
              startTime: graphEvent.startTime,
              endTime: graphEvent.endTime,
              maxAttendees: graphEvent.maxAttendees,
              registrationFee: graphEvent.registrationFee,
              slug: graphEvent.slug,
              blockTimestamp: graphEvent.blockTimestamp,
              description: metadata.description,
              category: metadata.category,
              locationName: metadata.location?.name,
            };
          } else {
            // Use fallback data if IPFS metadata is not available
            return generateFallbackEvent(graphEvent);
          }
        } catch (error) {
          console.warn(`Error processing event ${graphEvent.eventId}:`, error);
          return generateFallbackEvent(graphEvent);
        }
      })
    );

    // Filter out any null/undefined events and sort by timestamp
    const validEvents = processedEvents.filter(event => event !== null);

    console.log(`Successfully processed ${validEvents.length} events`);

    // Check if there are more events (if we got less than requested, we're at the end)
    const hasMore = validEvents.length === limit;

    return NextResponse.json({
      events: validEvents,
      pagination: {
        page,
        limit,
        hasMore,
        total: validEvents.length
      },
      source: "graph_protocol"
    });

  } catch (error) {
    console.error("Error fetching events from The Graph Protocol:", error);

    // Return detailed error information for debugging
    return NextResponse.json({
      events: [],
      pagination: {
        page: 1,
        limit: 20,
        hasMore: false,
        total: 0
      },
      source: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      details: "Failed to fetch events from The Graph Protocol"
    });
  }
}
