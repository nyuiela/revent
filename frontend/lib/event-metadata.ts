import { EventFormData } from "@/utils/types";
import { generateTokenId, generateTokenIdFromEventId } from "./token-id-generator";

/**
 * ERC1155 Token Metadata Standard
 * https://docs.opensea.io/docs/metadata-standards
 */
export interface ERC1155Metadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  properties?: {
    [key: string]: unknown;
  };
  animation_url?: string;
  background_color?: string;
  youtube_url?: string;
}

/**
 * Generate ERC1155 compliant metadata for an event
 */
export function generateEventMetadata(
  eventId: string,
  formData: EventFormData,
  baseUrl?: string
): ERC1155Metadata {
  // Auto-detect base URL if not provided
  if (!baseUrl) {
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      baseUrl = window.location.origin;
    } else if (process.env.NODE_ENV === 'development') {
      // Server-side development: use localhost with dynamic port
      const port = process.env.PORT || '3000';
      baseUrl = `http://localhost:${port}`;
    } else {
      // Production
      baseUrl = 'https://revent.com';
    }
  }
  const startDate = new Date(formData.startDateTime);
  const endDate = new Date(formData.endDateTime);

  // Generate the metadata URL (for reference)
  // const metadataUrl = `${baseUrl}/metadata/${eventId}.json`;

  // Generate the event page URL using slug if available, otherwise fallback to eventId
  const eventUrl = `${baseUrl}/${formData.slug || eventId}`;

  // Generate attributes for the event
  const attributes = [
    {
      trait_type: "Event Type",
      value: formData.eventType === "online" ? "Online" : "Offline"
    },
    {
      trait_type: "Category",
      value: formData.category
    },
    {
      trait_type: "Start Date",
      value: startDate.toISOString().split('T')[0],
      display_type: "date"
    },
    {
      trait_type: "Start Time",
      value: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      trait_type: "Duration",
      value: `${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))} hours`
    },
    {
      trait_type: "Max Participants",
      value: formData.maxParticipants
    },
    {
      trait_type: "Location",
      value: formData.location
    },
    {
      trait_type: "Status",
      value: formData.isLive ? "Live" : "Upcoming"
    }
  ];

  // Add ticket information if available
  if (formData.tickets.available && formData.tickets.types.length > 0) {
    attributes.push({
      trait_type: "Ticket Types",
      value: formData.tickets.types.length
    });

    formData.tickets.types.forEach((ticket, index) => {
      attributes.push({
        trait_type: `Ticket ${index + 1}`,
        value: `${ticket.type} - ${ticket.currency} ${ticket.price}`
      });
    });
  }

  // Add hosts information
  if (formData.hosts.length > 0) {
    attributes.push({
      trait_type: "Hosts",
      value: formData.hosts.length
    });

    formData.hosts.forEach((host, index) => {
      attributes.push({
        trait_type: `Host ${index + 1}`,
        value: host.name
      });
    });
  }

  // Add agenda information
  if (formData.agenda.length > 0) {
    attributes.push({
      trait_type: "Agenda Items",
      value: formData.agenda.length
    });
  }

  // Generate properties for additional metadata
  const properties = {
    eventId,
    slug: formData.slug || eventId,
    creator: "0x0000000000000000000000000000000000000000", // Will be filled by contract
    created_at: new Date().toISOString(),
    coordinates: formData.coordinates,
    platforms: formData.platforms,
    social_links: formData.socialLinks,
    agenda: formData.agenda.map(item => ({
      id: `agenda-${formData.agenda.indexOf(item)}`,
      title: item.title,
      description: item.description,
      startTime: item.startTime,
      endTime: item.endTime,
      speakers: item.speakers || []
    })),
    hosts: formData.hosts.map(host => ({
      name: host.name,
      role: host.role,
      avatar: host.avatar,
      bio: host.bio,
      social: host.social || {}
    })),
    sponsors: formData.sponsors || [],
    tickets: formData.tickets
  };

  return {
    name: formData.title,
    description: formData.description,
    image: formData.image || `${baseUrl}/images/default-event.png`,
    external_url: eventUrl,
    attributes,
    properties,
    animation_url: formData.image, // Use the same image as animation
    background_color: "000000", // Black background
    youtube_url: (formData.socialLinks as { youtube?: string })?.youtube || undefined
  };
}

/**
 * Generate metadata file content as JSON string
 */
export function generateEventMetadataJSON(
  eventId: string,
  formData: EventFormData,
  baseUrl?: string
): string {
  const metadata = generateEventMetadata(eventId, formData, baseUrl);
  return JSON.stringify(metadata, null, 2);
}

/**
 * Generate metadata file name
 */
export function getEventMetadataFileName(eventId: string): string {
  return `${eventId}.json`;
}

/**
 * Generate metadata URL
 */
export function getEventMetadataUrl(eventId: string, baseUrl?: string): string {
  // Auto-detect base URL if not provided
  if (!baseUrl) {
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      baseUrl = window.location.origin;
    } else if (process.env.NODE_ENV === 'development') {
      // Server-side development: use localhost with dynamic port
      const port = process.env.PORT || '3000';
      baseUrl = `http://localhost:${port}`;
    } else {
      // Production
      baseUrl = 'https://revent.com';
    }
  }
  return `${baseUrl}/api/metadata/${eventId}`;
}

/**
 * Upload event metadata to IPFS
 */
export async function uploadEventMetadataToIPFS(
  eventId: string,
  formData: EventFormData,
  baseUrl?: string
): Promise<{ success: boolean; metadataUrl?: string; error?: string }> {
  try {
    const metadata = generateEventMetadata(eventId, formData, baseUrl);
    // const metadataJSON = JSON.stringify(metadata, null, 2);

    // Upload to IPFS
    const response = await fetch('/api/ipfs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `event-metadata-${eventId}`,
        content: metadata
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('IPFS upload failed:', errorText);
      throw new Error('Failed to upload event metadata to IPFS');
    }

    const { uri } = await response.json();

    return {
      success: true,
      metadataUrl: uri
    };
  } catch (error) {
    console.error('Error uploading event metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Upload token metadata to IPFS using 64-char hex token ID
 */
export async function uploadTokenMetadataToIPFS(
  tokenId: string,
  metadata: ERC1155Metadata
): Promise<{ success: boolean; metadataUri?: string; cid?: string; error?: string }> {
  try {
    // Validate token ID format
    if (!/^[0-9a-fA-F]{64}$/.test(tokenId)) {
      throw new Error('Token ID must be a 64-character hexadecimal string');
    }

    const response = await fetch('/api/ipfs/token-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenId,
        metadata
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload token metadata to IPFS: ${errorText}`);
    }

    const result = await response.json();
    return {
      success: true,
      metadataUri: result.metadataUri,
      cid: result.cid
    };
  } catch (error) {
    console.error('Error uploading token metadata to IPFS:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Generate token metadata and upload to IPFS
 * Creates a 64-char hex token ID from the event ID and uploads the metadata
 */
export async function generateAndUploadTokenMetadata(
  eventId: string,
  formData: EventFormData,
  baseUrl?: string
): Promise<{
  success: boolean;
  tokenId?: string;
  metadataUri?: string;
  cid?: string;
  error?: string
}> {
  try {
    // Generate token ID from event ID (sequential numbering)
    const tokenId = generateTokenIdFromEventId(eventId);

    // Generate metadata
    const metadata = generateEventMetadata(eventId, formData, baseUrl);

    // Upload to IPFS
    const uploadResult = await uploadTokenMetadataToIPFS(tokenId, metadata);

    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error };
    }

    return {
      success: true,
      tokenId,
      metadataUri: uploadResult.metadataUri,
      cid: uploadResult.cid
    };
  } catch (error) {
    console.error('Error generating and uploading token metadata:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
