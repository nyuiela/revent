import { NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";

// Define Graph Protocol configuration for server-side use
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
  ipfsHash: string;
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
    ipfsHash: graphEvent.ipfsHash,
    blockTimestamp: graphEvent.blockTimestamp,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching event with slug: ${slug} from The Graph Protocol...`);

    // Define the query to find event by slug
    const query = `{
      eventCreateds(where: { slug: "${slug}" }, first: 1, orderBy: blockTimestamp, orderDirection: desc) {
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

    // Fetch event from The Graph Protocol using GraphQLClient
    const client = new GraphQLClient(url, { headers });
    const graphData = await client.request(query) as { eventCreateds?: GraphEvent[] };
    const graphEvents: GraphEvent[] = graphData.eventCreateds || [];

    if (graphEvents.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const graphEvent = graphEvents[0];

    try {
      // Fetch IPFS metadata
      const metadata = await fetchIPFSMetadata(graphEvent.ipfsHash);

      if (metadata) {
        // Use IPFS metadata if available
        const isLive = isEventLive(graphEvent.startTime, graphEvent.endTime);

        const event = {
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
          ipfsHash: graphEvent.ipfsHash,
          blockTimestamp: graphEvent.blockTimestamp,
          description: metadata.description,
          category: metadata.category,
          locationName: metadata.location?.name,
        };

        return NextResponse.json({
          event,
          source: "graph_protocol"
        });
      } else {
        // Use fallback data if IPFS metadata is not available
        const event = generateFallbackEvent(graphEvent);
        return NextResponse.json({
          event,
          source: "graph_protocol_fallback"
        });
      }
    } catch (error) {
      console.warn(`Error processing event ${graphEvent.eventId}:`, error);
      const event = generateFallbackEvent(graphEvent);
      return NextResponse.json({
        event,
        source: "graph_protocol_fallback"
      });
    }

  } catch (error) {
    console.error("Error fetching event by slug from The Graph Protocol:", error);

    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      details: "Failed to fetch event by slug from The Graph Protocol"
    }, { status: 500 });
  }
}
