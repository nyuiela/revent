import { NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";

// Define Graph Protocol configuration for server-side use
const url = "https://api.studio.thegraph.com/query/87766/revent/version/latest";
const headers = { Authorization: 'Bearer 6abc6de0d06cbf79f985314ef9647365' };

// Type definitions for transaction events
interface TransactionEvent {
  id: string;
  eventId: string;
  attendee?: string;
  txHash: string;
  blockNumber: string;
  blockTimestamp: string;
  eventType: 'EventCreated' | 'AttendeeRegistered' | 'AttendeeConfirmed' | 'AttendeeAttended' | 'TicketCreated' | 'TicketPurchased' | 'EventUpdated' | 'EventStatusChanged';
  amount?: string;
  ticketType?: string;
  ticketId?: string;
}

interface Event {
  id: string;
  eventId: string;
  title: string;
  avatarUrl: string;
  creator: string;
  transactionCount: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  try {

    if (!address) {
      return NextResponse.json(
        { error: 'Creator address is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching transaction events for creator: ${address} from The Graph Protocol...`);

    // Query for all transaction events related to events created by the user
    const query = `{
      eventCreateds(where: { creator: "${address.toLowerCase()}" }) {
        eventId
      }
      attendeeRegistereds(where: { eventId_in: [1] }) {
        id
        eventId
        attendee
        transactionHash
        blockNumber
        blockTimestamp
      }
      attendeeConfirmeds(where: { eventId_in: [] }) {
        id
        eventId
        attendee
        transactionHash
        blockNumber
        blockTimestamp
      }
      attendeeAttendeds(where: { eventId_in: [] }) {
        id
        eventId
        attendee
        transactionHash
        blockNumber
        blockTimestamp
      }
      ticketCreateds(where: { eventId_in: [] }) {
        id
        eventId
        ticketId
        creator
        transactionHash
        blockNumber
        blockTimestamp
      }
      ticketPurchaseds(where: { eventId_in: [] }) {
        id
        eventId
        ticketId
        buyer
        transactionHash
        blockNumber
        blockTimestamp
      }
      eventUpdateds(where: { eventId_in: [] }) {
        id
        eventId
        transactionHash
        blockNumber
        blockTimestamp
      }
      eventStatusChangeds(where: { eventId_in: [] }) {
        id
        eventId
        transactionHash
        blockNumber
        blockTimestamp
      }
    }`;

    const client = new GraphQLClient(url, { headers });
    const data = await client.request(query) as any;

    // Get event IDs created by this user
    const userEventIds = data.eventCreateds?.map((e: any) => e.eventId) || [];

    if (userEventIds.length === 0) {
      return NextResponse.json({
        events: [],
        transactions: [],
        creator: address,
        source: "graph_protocol"
      });
    }

    // Re-query with the actual event IDs
    const transactionQuery = `{
      attendeeRegistereds(where: { eventId_in: [${userEventIds.map((id: string) => `"${id}"`).join(',')}] }, orderBy: blockTimestamp, orderDirection: desc) {
        id
        eventId
        attendee
        transactionHash
        blockNumber
        blockTimestamp
      }
      attendeeConfirmeds(where: { eventId_in: [${userEventIds.map((id: string) => `"${id}"`).join(',')}] }, orderBy: blockTimestamp, orderDirection: desc) {
        id
        eventId
        attendee
        transactionHash
        blockNumber
        blockTimestamp
      }
      attendeeAttendeds(where: { eventId_in: [${userEventIds.map((id: string) => `"${id}"`).join(',')}] }, orderBy: blockTimestamp, orderDirection: desc) {
        id
        eventId
        attendee
        transactionHash
        blockNumber
        blockTimestamp
      }
      ticketCreateds(where: { eventId_in: [${userEventIds.map((id: string) => `"${id}"`).join(',')}] }, orderBy: blockTimestamp, orderDirection: desc) {
        id
        eventId
        ticketId
        creator
        transactionHash
        blockNumber
        blockTimestamp
      }
      ticketPurchaseds(where: { eventId_in: [${userEventIds.map((id: string) => `"${id}"`).join(',')}] }, orderBy: blockTimestamp, orderDirection: desc) {
        id
        eventId
        ticketId
        buyer
        transactionHash
        blockNumber
        blockTimestamp
      }
      eventUpdateds(where: { eventId_in: [${userEventIds.map((id: string) => `"${id}"`).join(',')}] }, orderBy: blockTimestamp, orderDirection: desc) {
        id
        eventId
        transactionHash
        blockNumber
        blockTimestamp
      }
      eventStatusChangeds(where: { eventId_in: [${userEventIds.map((id: string) => `"${id}"`).join(',')}] }, orderBy: blockTimestamp, orderDirection: desc) {
        id
        eventId
        transactionHash
        blockNumber
        blockTimestamp
      }
    }`;

    const transactionData = await client.request(transactionQuery) as any;

    // Process and combine all transaction events
    const allTransactions: TransactionEvent[] = [];

    // Process each event type
    transactionData.attendeeRegistereds?.forEach((tx: any) => {
      allTransactions.push({
        id: tx.id,
        eventId: tx.eventId,
        attendee: tx.attendee,
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
        blockTimestamp: tx.blockTimestamp,
        eventType: 'AttendeeRegistered',
      });
    });

    transactionData.attendeeConfirmeds?.forEach((tx: any) => {
      allTransactions.push({
        id: tx.id,
        eventId: tx.eventId,
        attendee: tx.attendee,
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
        blockTimestamp: tx.blockTimestamp,
        eventType: 'AttendeeConfirmed',
      });
    });

    transactionData.attendeeAttendeds?.forEach((tx: any) => {
      allTransactions.push({
        id: tx.id,
        eventId: tx.eventId,
        attendee: tx.attendee,
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
        blockTimestamp: tx.blockTimestamp,
        eventType: 'AttendeeAttended'
      });
    });

    transactionData.ticketCreateds?.forEach((tx: any) => {
      allTransactions.push({
        id: tx.id,
        eventId: tx.eventId,
        ticketId: tx.ticketId,
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
        blockTimestamp: tx.blockTimestamp,
        eventType: 'TicketCreated'
      });
    });

    transactionData.ticketPurchaseds?.forEach((tx: any) => {
      allTransactions.push({
        id: tx.id,
        eventId: tx.eventId,
        ticketId: tx.ticketId,
        attendee: tx.buyer,
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
        blockTimestamp: tx.blockTimestamp,
        eventType: 'TicketPurchased'
      });
    });

    transactionData.eventUpdateds?.forEach((tx: any) => {
      allTransactions.push({
        id: tx.id,
        eventId: tx.eventId,
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
        blockTimestamp: tx.blockTimestamp,
        eventType: 'EventUpdated'
      });
    });

    transactionData.eventStatusChangeds?.forEach((tx: any) => {
      allTransactions.push({
        id: tx.id,
        eventId: tx.eventId,
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
        blockTimestamp: tx.blockTimestamp,
        eventType: 'EventStatusChanged'
      });
    });

    // Sort transactions by timestamp (newest first)
    allTransactions.sort((a, b) => parseInt(b.blockTimestamp) - parseInt(a.blockTimestamp));

    // Get event details for dropdown
    const eventMap = new Map<string, Event>();
    userEventIds.forEach((eventId: string) => {
      eventMap.set(eventId, {
        id: eventId,
        eventId,
        title: `Event #${eventId}`,
        avatarUrl: "/icon.png",
        creator: address,
        transactionCount: allTransactions.filter(tx => tx.eventId === eventId).length
      });
    });

    const events = Array.from(eventMap.values());

    console.log(`Successfully processed ${allTransactions.length} transactions for ${events.length} events`);

    return NextResponse.json({
      events,
      transactions: allTransactions,
      creator: address,
      source: "graph_protocol"
    });

  } catch (error) {
    console.error("Error fetching transaction events from The Graph Protocol:", error);
    return NextResponse.json({
      events: [],
      transactions: [],
      creator: address,
      source: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
