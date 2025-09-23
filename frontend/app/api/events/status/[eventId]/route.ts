import { NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";

// Define Graph Protocol configuration for server-side use
const url = process.env.NEXT_PUBLIC_GRAPH_URL as string;
const headers = { Authorization: 'Bearer 6abc6de0d06cbf79f985314ef9647365' };

// Event status enum from smart contract
enum EventStatus {
  DRAFT = 0,
  PUBLISHED = 1,
  LIVE = 2,
  COMPLETED = 3,
  CANCELLED = 4
}

// Type definitions for Graph Protocol data
interface EventStatusChanged {
  id: string;
  eventId: string;
  oldStatus: string;
  newStatus: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface EventStatusResponse {
  eventId: string;
  currentStatus: string;
  statusName: string;
  lastChanged: string;
  transactionHash: string;
}

// Function to get status name from enum value
function getStatusName(statusValue: string): string {
  const statusNum = parseInt(statusValue);
  switch (statusNum) {
    case EventStatus.DRAFT:
      return "DRAFT";
    case EventStatus.PUBLISHED:
      return "PUBLISHED";
    case EventStatus.LIVE:
      return "LIVE";
    case EventStatus.COMPLETED:
      return "COMPLETED";
    case EventStatus.CANCELLED:
      return "CANCELLED";
    default:
      return "UNKNOWN";
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching event status for event ID: ${eventId} from The Graph Protocol...`);

    // Define the query to find the latest status change for this event
    const query = `{
      eventStatusChangeds(
        where: { eventId: "${eventId}" }
        first: 1
        orderBy: blockTimestamp
        orderDirection: desc
      ) {
        id
        eventId
        oldStatus
        newStatus
        blockNumber
        blockTimestamp
        transactionHash
      }
    }`;

    // Fetch status from The Graph Protocol using GraphQLClient
    const client = new GraphQLClient(url, { headers });
    const graphData = await client.request(query) as { eventStatusChangeds?: EventStatusChanged[] };
    const statusChanges: EventStatusChanged[] = graphData.eventStatusChangeds || [];

    if (statusChanges.length === 0) {
      // No status changes found, assume DRAFT status
      return NextResponse.json({
        eventId,
        currentStatus: "0", // DRAFT
        statusName: "DRAFT",
        lastChanged: null,
        transactionHash: null,
        source: "default_draft"
      });
    }

    const latestStatusChange = statusChanges[0];
    const currentStatus = latestStatusChange.newStatus;
    const statusName = getStatusName(currentStatus);

    const response: EventStatusResponse = {
      eventId,
      currentStatus,
      statusName,
      lastChanged: latestStatusChange.blockTimestamp,
      transactionHash: latestStatusChange.transactionHash
    };

    return NextResponse.json({
      ...response,
      source: "graph_protocol"
    });

  } catch (error) {
    console.error("Error fetching event status from The Graph Protocol:", error);

    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      details: "Failed to fetch event status from The Graph Protocol"
    }, { status: 500 });
  }
}
