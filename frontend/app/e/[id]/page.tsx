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

const EventDetailPage = async ({ params }: Props) => {
  const { id } = await params

  // Determine if this is an eventId or IPFS hash
  const isEventId = isNumericEventId(id);
  const isIpfs = isIpfsHash(id);

  if (isEventId) {
    // This is a numeric eventId from the contract
    return (
      <EventPage
        eventId={id}
        ipfsHash={undefined}
        idType="eventId"
      />
    );
  } else if (isIpfs) {
    // This is an IPFS hash
    const ipfsHash = id.startsWith('ipfs://') ? id : `ipfs://${id}`;
    return (
      <EventPage
        eventId={undefined}
        ipfsHash={ipfsHash}
        idType="ipfs"
      />
    );
  } else {
    // Fallback: treat as eventId but also try as IPFS
    return (
      <EventPage
        eventId={id}
        ipfsHash={`ipfs://${id}`}
        idType="unknown"
      />
    );
  }
}

export default EventDetailPage
