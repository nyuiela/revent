# IPFS Setup for Revents Token Metadata

This document explains how to set up IPFS groups for your Revents project with the custom domain `revents.io`.

## Overview

We have two IPFS groups:

1. **General IPFS Group**: For regular uploads (existing)
2. **Token Metadata Group**: For token metadata and images accessible via `revents.io`

## Setup Instructions

### 1. Pinata Configuration

#### Create Token Metadata Group in Pinata

1. Log into your Pinata dashboard
2. Go to **Pinning** → **Groups**
3. Create a new group called `token-metadata` or `revents-token-metadata`
4. Configure the group settings:
   - **Name**: `revents-token-metadata`
   - **Description**: `Token metadata and images for Revents events`
   - **Replication**: Set to your preferred regions

#### Update API Routes

The API routes are already configured to use your custom domain:

- `/api/ipfs/token-metadata` - For uploading token metadata
- `/api/ipfs/token-images` - For uploading token images

Both routes return URLs in the format: `https://revents.io/ipfs/{cid}`

### 2. Domain Configuration

#### Set up IPFS Gateway on revents.io

You need to configure your domain to serve IPFS content. Here are the options:

##### Option A: Pinata Custom Gateway (Recommended)

1. In Pinata dashboard, go to **Gateway** → **Custom Gateways**
2. Add a new custom gateway:
   - **Domain**: `revents.io`
   - **Subdomain**: `ipfs` (so URLs will be `revents.io/ipfs/...`)
3. Configure DNS:
   ```
   ipfs.revents.io CNAME gateway.pinata.cloud
   ```

##### Option B: Self-hosted IPFS Gateway

If you want to host your own gateway:

1. Set up an IPFS node
2. Configure nginx/apache to proxy `/ipfs/*` requests to your IPFS gateway
3. Example nginx config:
   ```nginx
   location /ipfs/ {
       proxy_pass http://localhost:8080/ipfs/;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

### 3. Environment Variables

Make sure you have the required environment variables:

```bash
PINATA_JWT=your_pinata_jwt_token
```

### 4. Usage

#### Upload Token Metadata

```typescript
import { uploadEventMetadataToIPFS } from "@/lib/event-metadata";

const result = await uploadEventMetadataToIPFS(eventId, formData);
// Returns: { success: true, cid: "...", uri: "https://revents.io/ipfs/..." }
```

#### Upload Token Images

```typescript
import { uploadTokenImageToIPFS } from "@/lib/event-metadata";

const result = await uploadTokenImageToIPFS(file);
// Returns: { success: true, cid: "...", uri: "https://revents.io/ipfs/..." }
```

### 5. URL Structure

After setup, your token metadata will be accessible at:

- **Metadata**: `https://revents.io/ipfs/{metadata_cid}`
- **Images**: `https://revents.io/ipfs/{image_cid}`
- **Logo**: `https://revents.io/logo.png` (if you pin it with that name)

### 6. Testing

Test your setup by:

1. Creating an event with an image
2. Check that the image URL uses `revents.io/ipfs/`
3. Verify the URL is accessible in a browser
4. Check that metadata URLs also use your domain

### 7. Benefits

- **Branded URLs**: All token metadata uses your domain
- **Reliability**: Dedicated IPFS group for token assets
- **Organization**: Separate groups for different content types
- **Customization**: Full control over gateway configuration

## Troubleshooting

### Common Issues

1. **404 on revents.io/ipfs/...**
   - Check DNS configuration
   - Verify custom gateway setup in Pinata
   - Ensure the CID exists in your IPFS group

2. **Upload failures**
   - Check PINATA_JWT environment variable
   - Verify API endpoint URLs
   - Check Pinata API limits

3. **Slow loading**
   - Consider adding more IPFS nodes to your group
   - Check replication settings
   - Use CDN if needed

### Monitoring

- Monitor your Pinata dashboard for upload success rates
- Check gateway response times
- Monitor DNS resolution for your custom domain
