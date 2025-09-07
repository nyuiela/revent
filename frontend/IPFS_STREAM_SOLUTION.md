# IPFS Stream Solution

This document explains how to solve the problem of loading video streams through IPFS-hosted HTML files.

## The Problem

When you store an HTML file on IPFS that contains a video stream, you encounter several issues:

1. **Static Content**: IPFS stores static files, so the HTML can't dynamically fetch stream URLs
2. **CORS Restrictions**: IPFS gateways may block requests to external streaming servers
3. **Network Isolation**: The iframe/video element can't reach the MediaMTX server from IPFS
4. **URL Embedding**: The stream URL needs to be embedded directly into the HTML file

## The Solution

We've created a **Dynamic Stream Interface** that embeds the stream URL directly into the HTML file before uploading to IPFS.

### Files Created

1. **`stream-iframe-dynamic.html`** - Dynamic stream interface that accepts stream URLs
2. **`/api/ipfs/stream-dynamic/route.ts`** - API endpoint to upload dynamic stream interface
3. **Updated test page** - Includes dynamic stream upload functionality

## How It Works

### 1. Dynamic Stream Interface

The `stream-iframe-dynamic.html` file:

- Accepts stream URLs via URL parameters (`?url=STREAM_URL`)
- Has a fallback default stream URL embedded in the code
- Automatically loads the stream when the page loads
- Handles MediaMTX URL conversion (adds `/index.m3u8` for HLS)

### 2. API Endpoint

The `/api/ipfs/stream-dynamic` endpoint:

- Takes a `streamUrl` parameter
- Embeds the stream URL directly into the HTML file
- Creates a unique filename based on the stream URL
- Uploads the modified HTML to IPFS
- Returns the CID and gateway URLs

### 3. Usage

#### Method 1: Direct API Call

```bash
curl -X POST "http://localhost:3000/api/ipfs/stream-dynamic?streamUrl=http://207.180.247.72:8889/ethAccra"
```

#### Method 2: Using the Test Page

1. Open `http://localhost:3000/ipfs-upload-test.html`
2. Enter your stream URL in the "Upload Dynamic Stream Interface" section
3. Click "Upload Dynamic Stream Interface"
4. Get your CID and gateway URLs

#### Method 3: JavaScript Integration

```javascript
const response = await fetch(
  `/api/ipfs/stream-dynamic?streamUrl=${encodeURIComponent(streamUrl)}`,
  {
    method: "POST",
  },
);

const data = await response.json();
console.log("CID:", data.cid);
console.log("IPFS URL:", data.ipfsUrl);
```

## API Response Format

```json
{
  "success": true,
  "cid": "QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
  "ipfsUrl": "https://ipfs.io/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
  "gatewayUrls": [
    "https://ipfs.io/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
    "https://gateway.pinata.cloud/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
    "https://cloudflare-ipfs.com/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
    "https://dweb.link/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx"
  ],
  "fileName": "ethaccra-stream-ABC123.html",
  "streamUrl": "http://207.180.247.72:8889/ethAccra",
  "size": 12345,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "usage": {
    "directAccess": "https://ipfs.io/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
    "withCustomUrl": "https://ipfs.io/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx?url=http://207.180.247.72:8889/ethAccra",
    "embedCode": "<iframe src=\"https://ipfs.io/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx\" width=\"800\" height=\"450\" allowfullscreen></iframe>"
  }
}
```

## Access Methods

### 1. Direct Access

```
https://ipfs.io/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
```

Uses the embedded stream URL.

### 2. With Custom URL Parameter

```
https://ipfs.io/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx?url=http://your-custom-stream-url
```

Overrides the embedded stream URL with a custom one.

### 3. Embed in Other Websites

```html
<iframe
  src="https://ipfs.io/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx"
  width="800"
  height="450"
  allowfullscreen
>
</iframe>
```

## Features

### ✅ **Embedded Stream URL**

- Stream URL is embedded directly in the HTML file
- No external API calls needed
- Works offline once loaded

### ✅ **URL Parameter Override**

- Can override embedded URL with `?url=` parameter
- Flexible for different stream sources
- Maintains backward compatibility

### ✅ **MediaMTX Compatibility**

- Automatically converts MediaMTX URLs to HLS format
- Adds `/index.m3u8` for proper streaming
- Handles both port 8888 and 8889

### ✅ **Multiple Gateway Support**

- Returns multiple IPFS gateway URLs
- Redundancy for better availability
- Works across different IPFS networks

### ✅ **Unique Filenames**

- Creates unique filenames based on stream URL
- Prevents conflicts between different streams
- Easy to identify stream sources

## Integration with ENS

Once you have the CID, you can:

1. **Store in ENS**: Map a human-readable name to the CID
2. **Access via ENS**: Use ENS resolution to get the IPFS URL
3. **Update Streams**: Create new CIDs when stream URLs change

Example ENS integration:

```javascript
// Store CID in ENS
const ensName = "ethaccra.nyuiela.eth";
const cid = "QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx";

// Access via ENS
const streamUrl = `https://ipfs.io/ipfs/${cid}`;
```

## Testing

### 1. Test the Dynamic Interface Locally

```
http://localhost:3000/stream-iframe-dynamic.html?url=http://207.180.247.72:8889/ethAccra
```

### 2. Test the API Endpoint

```
http://localhost:3000/ipfs-upload-test.html
```

### 3. Test IPFS Access

After uploading, test the IPFS URL:

```
https://ipfs.io/ipfs/YOUR_CID_HERE
```

## Environment Setup

Add to your `.env` file:

```bash
IPFS_AUTH=your_ipfs_auth_token_here
IPFS_URL=https://ipfs.infura.io:5001/api/v0
```

## Troubleshooting

### Stream Not Loading

1. **Check MediaMTX Configuration**: Ensure HLS is enabled
2. **Verify Stream URL**: Test the stream URL directly
3. **Check CORS**: Ensure MediaMTX allows cross-origin requests
4. **Test IPFS Gateway**: Try different IPFS gateways

### IPFS Upload Fails

1. **Check Authentication**: Verify IPFS_AUTH is set correctly
2. **Check Network**: Ensure internet connection is stable
3. **Try Different Gateway**: Use alternative IPFS gateways
4. **Check File Size**: Ensure file isn't too large

### CORS Issues

1. **Configure MediaMTX**: Add CORS headers to MediaMTX
2. **Use HTTPS**: Ensure both IPFS and stream use HTTPS
3. **Check Browser**: Some browsers have stricter CORS policies

## Benefits

1. **Decentralized**: Stream interface is stored on IPFS
2. **Censorship Resistant**: Can't be taken down easily
3. **Global Access**: Available through multiple IPFS gateways
4. **Version Control**: Each stream URL gets a unique CID
5. **Easy Integration**: Simple iframe embedding
6. **Flexible**: Can override stream URLs via parameters

This solution effectively bridges the gap between IPFS static content and dynamic streaming, allowing you to host stream interfaces on IPFS while maintaining access to live streaming content.
