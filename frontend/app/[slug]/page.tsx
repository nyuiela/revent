import React from 'react'
import EventPage from '../components/EventPage'
import type { Metadata, ResolvingMetadata } from 'next'

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

// Helper used by generateMetadata to build per-event SEO
async function getEventForSEO(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revents.io';
    const res = await fetch(`${baseUrl}/api/events/slug/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.event ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventForSEO(slug)

  const site = 'https://revents.io'
  const url = `${site}/${slug}`
  const title = event?.title ? `${event.title} | Revent` : 'Event | Revent'
  const description = (event?.description || 'Discover and attend onchain events.').slice(0, 160)
  const image = event?.avatarUrl || `${site}/hero.png`

  return {
    title,
    description,
    metadataBase: new URL(site),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: event?.title || 'Event' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
    other: {
      'event:id': event?.id,
      'event:slug': slug,
    },
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
      <>
        <script
          type="application/ld+json"
          // Event JSON-LD for rich snippets
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Event',
              name: graphEvent.title,
              startDate: graphEvent.startTime ? new Date(parseInt(graphEvent.startTime) * 1000).toISOString() : undefined,
              endDate: graphEvent.endTime ? new Date(parseInt(graphEvent.endTime) * 1000).toISOString() : undefined,
              eventStatus: 'https://schema.org/EventScheduled',
              eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
              location: {
                '@type': 'Place',
                name: graphEvent.locationName || 'TBA',
                geo: graphEvent.lat && graphEvent.lng ? { '@type': 'GeoCoordinates', latitude: graphEvent.lat, longitude: graphEvent.lng } : undefined,
              },
              image: graphEvent.avatarUrl,
              description: graphEvent.description,
              organizer: { '@type': 'Organization', name: graphEvent.username || 'Revent Creator' },
              url: `https://revents.io/${slug}`,
              offers: {
                '@type': 'Offer',
                url: `https://revents.io/${slug}`,
                price: graphEvent.registrationFee?.replace(/[^0-9.]/g, '') || '0',
                priceCurrency: 'ETH',
                availability: 'https://schema.org/InStock',
              },
            }),
          }}
        />
        <EventPage
          eventId={graphEvent.id}
          ipfsHash={ipfsHash}
          idType="slug"
          graphEventData={graphEvent}
        />
      </>
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