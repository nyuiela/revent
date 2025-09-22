import React from 'react'
import EventPage from '../components/EventPage'

type Props = {
  params: Promise<{
    slug: string
  }>
}

// Helper function to detect if slug is actually a numeric eventId (for backward compatibility)
function isNumericEventId(slug: string): boolean {
  // Check if it's a pure number (eventId from contract)
  return /^\d+$/.test(slug);
}

// Helper function to detect if slug is an IPFS hash
function isIpfsHash(slug: string): boolean {
  // IPFS hashes typically start with 'Qm' (v0) or 'baf' (v1) or are 46+ characters
  return slug.startsWith('Qm') || slug.startsWith('baf') || slug.length >= 46;
}

// Function to fetch event by slug from The Graph Protocol
async function fetchEventBySlug(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/events/slug/${slug}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch event');
    }

    return data.event;
  } catch (error) {
    console.error('Error fetching event by slug from Graph Protocol:', error);
    return null;
  }
}

// Function to fetch event by eventId from The Graph Protocol (for backward compatibility)
async function fetchEventByEventId(eventId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/events/${eventId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch event');
    }

    return data.event;
  } catch (error) {
    console.error('Error fetching event by eventId from Graph Protocol:', error);
    return null;
  }
}

const EventDetailPage = async ({ params }: Props) => {
  const { slug } = await params

  // Check if this is actually a numeric eventId (backward compatibility)
  if (isNumericEventId(slug)) {
    console.log(`Numeric slug detected: ${slug}, treating as eventId for backward compatibility`);
    const graphEvent = await fetchEventByEventId(slug);

    if (graphEvent && graphEvent.ipfsHash) {
      // Use the IPFS hash from The Graph Protocol
      const ipfsHash = graphEvent.ipfsHash.startsWith('ipfs://')
        ? graphEvent.ipfsHash
        : `ipfs://${graphEvent.ipfsHash}`;

      console.log(`Found IPFS hash from Graph Protocol: ${ipfsHash}`);

      return (
        <EventPage
          eventId={slug}
          ipfsHash={ipfsHash}
          idType="eventId"
          graphEventData={graphEvent}
        />
      );
    } else {
      // Fallback to direct eventId if Graph Protocol lookup fails
      console.log(`Graph Protocol lookup failed for event ${slug}, falling back to direct eventId`);
      return (
        <EventPage
          eventId={slug}
          ipfsHash={undefined}
          idType="eventId"
        />
      );
    }
  }

  // Check if this is an IPFS hash
  if (isIpfsHash(slug)) {
    // This is an IPFS hash - use directly
    const ipfsHash = slug.startsWith('ipfs://') ? slug : `ipfs://${slug}`;
    return (
      <EventPage
        eventId={undefined}
        ipfsHash={ipfsHash}
        idType="ipfs"
      />
    );
  }

  // This is a slug - fetch from The Graph Protocol
  console.log(`Fetching event with slug: ${slug} from The Graph Protocol...`);
  const graphEvent = await fetchEventBySlug(slug);

  if (graphEvent && graphEvent.ipfsHash) {
    // Use the IPFS hash from The Graph Protocol
    const ipfsHash = graphEvent.ipfsHash.startsWith('ipfs://')
      ? graphEvent.ipfsHash
      : `ipfs://${graphEvent.ipfsHash}`;

    console.log(`Found IPFS hash from Graph Protocol: ${ipfsHash}`);

    return (
      <EventPage
        eventId={graphEvent.id}
        ipfsHash={ipfsHash}
        idType="slug"
        graphEventData={graphEvent}
      />
    );
  } else {
    // Event not found
    console.log(`Event with slug '${slug}' not found`);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Event Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The event with slug &quot;{slug}&quot; could not be found.
          </p>
        </div>
      </div>
    );
  }
}

export default EventDetailPage