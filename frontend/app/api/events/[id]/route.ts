import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';

// Graph Protocol configuration (using the same config as the app)
const url = 'https://api.studio.thegraph.com/query/87766/stream/version/latest';
const headers = {
  'Authorization': 'Bearer 6abc6de0d06cbf79f985314ef9647365',
  'Content-Type': 'application/json',
};

// GraphQL query to fetch a specific event by ID
const eventByIdQuery = `
  query GetEventById($eventId: String!) {
    eventCreateds(where: { eventId: $eventId }) {
      id
      eventId
      creator
      ipfsHash
      startTime
      endTime
      maxAttendees
      registrationFee
      blockNumber
      blockTimestamp
    }
  }
`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`Fetching event ${id} from The Graph Protocol...`);

    // Create GraphQL client
    const client = new GraphQLClient(url, { headers });

    // Fetch event by ID
    const data = await client.request(eventByIdQuery, { eventId: id }) as { eventCreateds?: Record<string, unknown>[] };
    const events = data.eventCreateds || [];

    if (events.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = events[0];
    console.log(`Found event:`, event);

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        eventId: event.eventId,
        creator: event.creator,
        ipfsHash: event.ipfsHash,
        startTime: event.startTime,
        endTime: event.endTime,
        maxParticipants: event.maxAttendees,
        registrationFee: event.registrationFee,
        blockTimestamp: event.blockTimestamp,
        blockNumber: event.blockNumber,
      }
    });

  } catch (error) {
    console.error('Error fetching event from The Graph Protocol:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event from The Graph Protocol' },
      { status: 500 }
    );
  }
}
