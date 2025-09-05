import React from 'react'
import EventPage from '../../components/EventPage'

type Props = {
   params: Promise<{
      id: string
   }>
}

// Helper function to detect if ID is a numeric eventId or IPFS hash
function isNumericEventId(id: string): boolean {
   // Check if it's a pure number (eventId from contract)
   return /^\d+$/.test(id);
}

// Helper function to detect if ID is an IPFS hash
function isIpfsHash(id: string): boolean {
   // IPFS hashes typically start with 'Qm' (v0) or 'baf' (v1) or are 46+ characters
   return id.startsWith('Qm') || id.startsWith('baf') || id.length >= 46;
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

const EventDetailPage = async ({ params }: Props) => {
   const { id } = await params

   // Determine if this is an eventId or IPFS hash
   const isEventId = isNumericEventId(id);
   const isIpfs = isIpfsHash(id);

   if (isEventId) {
      // This is a numeric eventId - fetch from The Graph Protocol first
      console.log(`Fetching event ${id} from The Graph Protocol...`);
      const graphEvent = await fetchEventFromGraph(id);

      if (graphEvent && graphEvent.ipfsHash) {
         // Use the IPFS hash from The Graph Protocol
         const ipfsHash = graphEvent.ipfsHash.startsWith('ipfs://')
            ? graphEvent.ipfsHash
            : `ipfs://${graphEvent.ipfsHash}`;

         console.log(`Found IPFS hash from Graph Protocol: ${ipfsHash}`);

         return (
            <EventPage
               eventId={id}
               ipfsHash={ipfsHash}
               idType="eventId"
               graphEventData={graphEvent}
            />
         );
      } else {
         // Fallback to direct eventId if Graph Protocol lookup fails
         console.log(`Graph Protocol lookup failed for event ${id}, falling back to direct eventId`);
         return (
            <EventPage
               eventId={id}
               ipfsHash={undefined}
               idType="eventId"
            />
         );
      }
   } else if (isIpfs) {
      // This is an IPFS hash - use directly
      const ipfsHash = id.startsWith('ipfs://') ? id : `ipfs://${id}`;
      return (
         <EventPage
            eventId={undefined}
            ipfsHash={ipfsHash}
            idType="ipfs"
         />
      );
   } else {
      // Fallback: try as eventId first, then as IPFS
      console.log(`Unknown ID format: ${id}, trying as eventId first`);
      const graphEvent = await fetchEventFromGraph(id);

      if (graphEvent && graphEvent.ipfsHash) {
         const ipfsHash = graphEvent.ipfsHash.startsWith('ipfs://')
            ? graphEvent.ipfsHash
            : `ipfs://${graphEvent.ipfsHash}`;

         return (
            <EventPage
               eventId={id}
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
               ipfsHash={`ipfs://${id}`}
               idType="unknown"
            />
         );
      }
   }
}

export default EventDetailPage
