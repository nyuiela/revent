# Event Metadata System

This system generates ERC1155 compliant metadata for events created on the Revent platform.

## Overview

Each event gets a unique metadata file that follows the ERC1155 token metadata standard, making events discoverable and tradeable as NFTs.

## URLs

### Development

- Metadata: `http://localhost:3001/api/metadata/{eventId}`
- Example: `http://localhost:3001/api/metadata/1`

### Production

- Metadata: `https://revent.com/api/metadata/{eventId}`
- Example: `https://revent.com/api/metadata/1`

## API Endpoints

### GET /api/metadata/[eventId]

Returns ERC1155 compliant metadata for the specified event ID.

**Example Response:**

```json
{
  "name": "Web3 Developer Meetup",
  "description": "Join us for an exciting evening of Web3 development...",
  "image": "https://revent.com/images/event-image.jpg",
  "external_url": "https://revent.com/e/1",
  "attributes": [
    {
      "trait_type": "Event Type",
      "value": "Offline"
    },
    {
      "trait_type": "Category",
      "value": "Technology"
    },
    {
      "trait_type": "Start Date",
      "value": "2024-01-15",
      "display_type": "date"
    }
  ],
  "properties": {
    "eventId": "1",
    "slug": "web3-developer-meetup",
    "creator": "0x...",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Usage

### In Code

```typescript
import {
  generateEventMetadata,
  getEventMetadataUrl,
} from "@/lib/event-metadata";

// Generate metadata
const metadata = generateEventMetadata(eventId, formData);

// Get metadata URL
const metadataUrl = getEventMetadataUrl(eventId);
```

### Testing

Visit `/test-metadata` to test the metadata generation with sample data.

## Features

- **ERC1155 Compliant**: Follows OpenSea's metadata standard
- **Rich Attributes**: Includes event type, category, dates, location, hosts, tickets
- **IPFS Integration**: Automatically uploads to IPFS
- **Local Development**: Works with localhost in development
- **Production Ready**: Uses revent.com domain in production

## Metadata Structure

### Required Fields

- `name`: Event title
- `description`: Event description
- `image`: Event image URL
- `attributes`: Array of trait objects

### Optional Fields

- `external_url`: Link to event page
- `properties`: Additional metadata
- `animation_url`: Animated content URL
- `background_color`: Background color hex
- `youtube_url`: YouTube video URL

### Attributes Include

- Event Type (Online/Offline)
- Category
- Start Date/Time
- Duration
- Max Participants
- Location
- Status (Live/Upcoming)
- Ticket Information
- Host Information
- Agenda Items Count

## Integration

The metadata is automatically generated when:

1. An event is successfully created on the blockchain
2. The event is verified via The Graph Protocol
3. The metadata is uploaded to IPFS
4. The metadata URL is logged for reference

## Caching

Metadata responses are cached for 1 hour to improve performance:

```
Cache-Control: public, max-age=3600
```
