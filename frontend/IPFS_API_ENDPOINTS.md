# IPFS API Endpoints

This document describes the API endpoints for uploading stream files to IPFS and retrieving their CIDs.

## Endpoints

### 1. Upload Stream Iframe to IPFS

**Endpoint:** `POST /api/ipfs/stream-iframe`

**Description:** Uploads the `stream-iframe.html` file to IPFS and returns the CID.

**Request:**

```bash
curl -X POST http://localhost:3000/api/ipfs/stream-iframe
```

**Response:**

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
  "fileName": "stream-iframe.html",
  "size": 12345,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Get Stream Iframe File Info

**Endpoint:** `GET /api/ipfs/stream-iframe`

**Description:** Returns information about the `stream-iframe.html` file without uploading to IPFS.

**Request:**

```bash
curl http://localhost:3000/api/ipfs/stream-iframe
```

**Response:**

```json
{
  "success": true,
  "fileName": "stream-iframe.html",
  "size": 12345,
  "lastModified": "2024-01-01T00:00:00.000Z",
  "content": "<!doctype html>...",
  "message": "Use POST method to upload to IPFS and get CID"
}
```

### 3. Upload All Stream Files to IPFS

**Endpoint:** `POST /api/ipfs/stream-files`

**Description:** Uploads all stream-related HTML files to IPFS.

**Request:**

```bash
curl -X POST http://localhost:3000/api/ipfs/stream-files
```

**Response:**

```json
{
  "success": true,
  "uploadedFiles": [
    {
      "fileName": "stream-iframe.html",
      "cid": "QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
      "ipfsUrl": "https://ipfs.io/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
      "gatewayUrls": [...],
      "size": 12345
    },
    {
      "fileName": "stream-embed.html",
      "cid": "QmYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYy",
      "ipfsUrl": "https://ipfs.io/ipfs/QmYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYy",
      "gatewayUrls": [...],
      "size": 6789
    }
  ],
  "totalFiles": 2,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Uploaded 2 stream files to IPFS"
}
```

### 4. Upload Specific Stream File

**Endpoint:** `POST /api/ipfs/stream-files?file=<filename>`

**Description:** Uploads a specific stream file to IPFS.

**Request:**

```bash
curl -X POST "http://localhost:3000/api/ipfs/stream-files?file=stream-embed.html"
```

**Available Files:**

- `stream-iframe.html`
- `stream-embed.html`
- `stream-interface.html`
- `stream-interface-advanced.html`
- `simple-stream.html`
- `test-hls.html`

**Response:**

```json
{
  "success": true,
  "uploadedFiles": [
    {
      "fileName": "stream-embed.html",
      "cid": "QmYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYy",
      "ipfsUrl": "https://ipfs.io/ipfs/QmYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYy",
      "gatewayUrls": [...],
      "size": 6789
    }
  ],
  "totalFiles": 1,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Uploaded stream-embed.html to IPFS"
}
```

### 5. Get All Stream Files Info

**Endpoint:** `GET /api/ipfs/stream-files`

**Description:** Returns information about all stream files without uploading to IPFS.

**Request:**

```bash
curl http://localhost:3000/api/ipfs/stream-files
```

**Response:**

```json
{
  "success": true,
  "files": [
    {
      "fileName": "stream-iframe.html",
      "size": 12345,
      "lastModified": "2024-01-01T00:00:00.000Z",
      "exists": true
    },
    {
      "fileName": "stream-embed.html",
      "size": 6789,
      "lastModified": "2024-01-01T00:00:00.000Z",
      "exists": true
    }
  ],
  "totalFiles": 2,
  "availableFiles": [
    "stream-iframe.html",
    "stream-embed.html",
    "stream-interface.html",
    "stream-interface-advanced.html",
    "simple-stream.html",
    "test-hls.html"
  ],
  "message": "Use POST method to upload files to IPFS and get CIDs"
}
```

## Environment Variables

The API endpoints use the following environment variables:

```bash
# IPFS configuration
IPFS_AUTH=your_ipfs_auth_token_here
IPFS_URL=https://ipfs.infura.io:5001/api/v0
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

Common error scenarios:

- **404**: File not found
- **500**: IPFS upload failed or server error

## Testing

Use the test page to interact with these endpoints:

```
http://localhost:3000/ipfs-upload-test.html
```

## Usage Examples

### JavaScript/Fetch

```javascript
// Upload stream iframe
const response = await fetch("/api/ipfs/stream-iframe", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
});

const data = await response.json();
console.log("CID:", data.cid);
console.log("IPFS URL:", data.ipfsUrl);
```

### cURL

```bash
# Upload stream iframe
curl -X POST http://localhost:3000/api/ipfs/stream-iframe

# Upload specific file
curl -X POST "http://localhost:3000/api/ipfs/stream-files?file=stream-embed.html"

# Get file info
curl http://localhost:3000/api/ipfs/stream-iframe
```

## Integration with ENS

Once you have the CID, you can:

1. **Store the CID in ENS** for easy access
2. **Use the gateway URLs** to access the stream interface
3. **Embed the IPFS URL** in other applications

Example ENS integration:

```javascript
// Store CID in ENS
const ensName = "ethaccra.nyuiela.eth";
const cid = "QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx";

// Access via ENS
const streamUrl = `https://ipfs.io/ipfs/${cid}`;
```

## Gateway URLs

The API returns multiple gateway URLs for redundancy:

- **ipfs.io**: Primary IPFS gateway
- **gateway.pinata.cloud**: Pinata gateway
- **cloudflare-ipfs.com**: Cloudflare gateway
- **dweb.link**: Protocol Labs gateway

Use any of these URLs to access your uploaded stream interface.
