import React from 'react'
import EventPage from '../components/EventPage'

type Props = {
   params: Promise<{
      slug: string
   }>
}

// Helper function to detect if slug is a numeric eventId (for backward compatibility)
function isNumericEventId(slug: string): boolean {
   // Check if it's a pure number (eventId from contract)
   return /^\d+$/.test(slug);
}

// Helper function to detect if slug is an IPFS hash
function isIpfsHash(slug: string): boolean {
   // IPFS hashes typically start with 'Qm' (v0) or 'baf' (v1) or are 46+ characters
   return slug.startsWith('Qm') || slug.startsWith('baf') || slug.length >= 46;
}

// Helper function to detect if slug is an 8-character alphanumeric string (new slug format)
function isSlug(slug: string): boolean {
   // 8-character alphanumeric string
   return /^[a-z0-9]{8}$/.test(slug);
}

// Function to fetch event from The Graph Protocol and extract IPFS hash
async function fetchEventFromGraph(eventId: string) {
   try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/events/${eventId}`);
      const data = await response.json();

      if (!response.ok) {
         throw new Error(data.error || 'Failed to fetch event');
      }

      return data.event;
   } catch (error) {
      console.error('Error fetching event from Graph Protocol:', error);
      return null;
   }
}

// Function to find event by slug from all events
async function findEventBySlug(slug: string) {
   try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/events`);
      const data = await response.json();

      if (!response.ok) {
         throw new Error(data.error || 'Failed to fetch events');
      }

      // Find event with matching slug
      const event = data.events.find((e: any) => e.slug === slug);
      return event;
   } catch (error) {
      console.error('Error finding event by slug:', error);
      return null;
   }
}

const EventDetailPage = async ({ params }: Props) => {
   const { slug } = await params

   // Determine the type of identifier we have
   const isEventId = isNumericEventId(slug);
   const isIpfs = isIpfsHash(slug);
   const isNewSlug = isSlug(slug);

   if (isNewSlug) {
      // This is a new slug format - find the event by slug
      console.log(`Looking up event by slug: ${slug}`);
      const event = await findEventBySlug(slug);

      if (event) {
         console.log(`Found event by slug: ${event.title} (ID: ${event.id})`);
         
         // If we have an eventId, fetch from Graph Protocol for IPFS hash
         if (event.id) {
            const graphEvent = await fetchEventFromGraph(event.id);
            
            if (graphEvent && graphEvent.ipfsHash) {
               const ipfsHash = graphEvent.ipfsHash.startsWith('ipfs://')
                  ? graphEvent.ipfsHash
                  : `ipfs://${graphEvent.ipfsHash}`;

               return (
                  <EventPage
                     eventId={event.id}
                     ipfsHash={ipfsHash}
                     idType="slug"
                     graphEventData={graphEvent}
                  />
               );
            }
         }

         // Fallback to direct event data if no Graph Protocol data
         return (
            <EventPage
               eventId={event.id}
               ipfsHash={undefined}
               idType="slug"
               eventSlugData={event}
            />
         );
      } else {
         // Slug not found, return 404
         return (
            <div className="min-h-screen flex items-center justify-center">
               <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
                  <p className="text-gray-600">The event with slug "{slug}" could not be found.</p>
               </div>
            </div>
         );
      }
   } else if (isEventId) {
      // This is a numeric eventId - fetch from The Graph Protocol first (backward compatibility)
      console.log(`Fetching event ${slug} from The Graph Protocol...`);
      const graphEvent = await fetchEventFromGraph(slug);

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
   } else if (isIpfs) {
      // This is an IPFS hash - use directly
      const ipfsHash = slug.startsWith('ipfs://') ? slug : `ipfs://${slug}`;
      return (
         <EventPage
            eventId={undefined}
            ipfsHash={ipfsHash}
            idType="ipfs"
         />
      );
   } else {
      // Unknown format - try as slug first, then fallback to old methods
      console.log(`Unknown slug format: ${slug}, trying as slug first`);
      
      const event = await findEventBySlug(slug);
      if (event) {
         // Found by slug
         return (
            <EventPage
               eventId={event.id}
               ipfsHash={undefined}
               idType="slug"
               eventSlugData={event}
            />
         );
      }

      // Try as eventId
      const graphEvent = await fetchEventFromGraph(slug);
      if (graphEvent && graphEvent.ipfsHash) {
         const ipfsHash = graphEvent.ipfsHash.startsWith('ipfs://')
            ? graphEvent.ipfsHash
            : `ipfs://${graphEvent.ipfsHash}`;

         return (
            <EventPage
               eventId={slug}
               ipfsHash={ipfsHash}
               idType="unknown"
               graphEventData={graphEvent}
            />
         );
      } else {
         // Try as IPFS hash
         return (
            <EventPage
               eventId={undefined}
               ipfsHash={`ipfs://${slug}`}
               idType="unknown"
            />
         );
      }
   }
}

export default EventDetailPage
