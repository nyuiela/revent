import { NextRequest, NextResponse } from 'next/server';
import { generateEventMetadata } from '@/lib/event-metadata';
import { EventFormData } from '@/utils/types';

export async function GET(
  request: NextRequest,
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

    // For now, we'll return a placeholder metadata
    // In a real implementation, you would fetch the event data from your database
    // and generate the metadata dynamically

    // Auto-detect base URL
    let baseUrl: string;
    if (process.env.NODE_ENV === 'development') {
      const port = process.env.PORT || '3000';
      baseUrl = `http://localhost:${port}`;
    } else {
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revents.io';
    }

    // Placeholder event data - replace with actual database query
    const placeholderEventData = {
      title: `Event ${eventId}`,
      description: `This is a placeholder event with ID ${eventId}`,
      startDateTime: new Date().toISOString(),
      endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      location: 'TBD',
      coordinates: { lat: 0, lng: 0 },
      image: `${baseUrl}/images/default-event.png`,
      onlinePlatformLink: '',
      category: 'Other',
      maxParticipants: 100,
      isLive: false,
      platforms: [],
      totalRewards: 0,
      eventType: 'In-Person' as const,
      hosts: [],
      agenda: [],
      sponsors: [],
      tickets: {
        available: false,
        types: []
      },
      socialLinks: {},
      slug: eventId,
      // Required fields for EventFormData
      date: '',
      time: '',
      tempHost: { name: "", role: "" },
      tempAgenda: { title: "", description: "", startTime: "", endTime: "", speakers: [] },
      tempTicket: { type: "", price: 0, currency: "USD", quantity: 0, perks: [] }
    };

    const metadata = generateEventMetadata(eventId, placeholderEventData as EventFormData, baseUrl);

    return NextResponse.json(metadata, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating metadata:', error);
    return NextResponse.json(
      { error: 'Failed to generate metadata' },
      { status: 500 }
    );
  }
}
