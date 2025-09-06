# IPFS Stream Viewer

A decentralized live stream viewer that can be hosted on IPFS and accessed via ENS names. This allows for censorship-resistant streaming interfaces that work with CID to ENS name resolution.

## 📁 Files Created

### 1. **stream-viewer.html** (Basic Version)

- Simple HTML interface for viewing live streams
- Mock ENS resolution for demonstration
- Basic video player with HLS support
- Responsive design

### 2. **stream-viewer-advanced.html** (Advanced Version)

- Full IPFS integration
- Real ENS resolution using ethers.js
- Fetches stream metadata from IPFS
- Advanced error handling and status display

### 3. **stream-metadata.json** (Sample Metadata)

- Example stream metadata structure
- Contains server URLs, protocols, and stream information
- Can be stored on IPFS and referenced by ENS names

### 4. **upload-to-ipfs.js** (Upload Script)

- Node.js script to upload HTML files to IPFS
- Creates both individual file CIDs and directory CIDs
- Provides gateway URLs for easy access

## 🚀 How to Use

### Step 1: Upload to IPFS

```bash
# Install dependencies
npm install ipfs-http-client

# Run the upload script
node scripts/upload-to-ipfs.js
```

This will output CIDs like:

```
✅ Uploaded stream-viewer.html
   CID: QmXxXxXx...
   IPFS URL: https://ipfs.io/ipfs/QmXxXxXx...
   Gateway URL: https://gateway.pinata.cloud/ipfs/QmXxXxXx...
```

### Step 2: Set Up ENS Resolution

1. **Get an ENS name** (e.g., `ethaccra.eth`)
2. **Set the content hash** to point to your IPFS CID
3. **Users can now access** via `ethaccra.eth` instead of the long CID

### Step 3: Access the Stream Viewer

Users can access your stream viewer by:

- **Direct IPFS URL**: `https://ipfs.io/ipfs/QmXxXxXx...`
- **Gateway URL**: `https://gateway.pinata.cloud/ipfs/QmXxXxXx...`
- **ENS Name**: `ethaccra.eth` (if configured)

## 🔧 Configuration

### Stream Metadata Structure

The `stream-metadata.json` file contains:

```json
{
  "name": "Stream Name",
  "streamKey": "ethaccra",
  "server": "http://207.180.247.72:8888",
  "protocols": {
    "hls": {
      "url": "http://207.180.247.72:8888/ethaccra/index.m3u8",
      "enabled": true
    },
    "webrtc": {
      "url": "http://207.180.247.72:8889/ethaccra/whip",
      "enabled": true
    }
  }
}
```

### ENS Configuration

To set up ENS resolution:

1. **Set content hash** in ENS resolver:

   ```javascript
   await resolver.setText("contenthash", "ipfs://QmXxXxXx...");
   ```

2. **Users can access** via ENS name:
   ```
   ethaccra.eth → resolves to → QmXxXxXx... → IPFS content
   ```

## 🌐 Features

### Basic Version

- ✅ Simple HTML5 video player
- ✅ HLS stream support
- ✅ Responsive design
- ✅ Mock ENS resolution
- ✅ Error handling

### Advanced Version

- ✅ Real IPFS integration
- ✅ ENS name resolution
- ✅ Stream metadata fetching
- ✅ Multiple protocol support (HLS, WebRTC, RTMP)
- ✅ Detailed stream information
- ✅ Metadata display

## 🔗 Integration with Your App

### 1. **Embed in Your App**

```html
<iframe
  src="https://gateway.pinata.cloud/ipfs/QmXxXxXx..."
  width="100%"
  height="600px"
  frameborder="0"
>
</iframe>
```

### 2. **Link to Stream Viewer**

```html
<a href="https://gateway.pinata.cloud/ipfs/QmXxXxXx..." target="_blank">
  Watch Live Stream
</a>
```

### 3. **Use ENS Names**

```html
<a href="https://ethaccra.eth" target="_blank"> Watch Live Stream </a>
```

## 🛠️ Customization

### Modify Stream Sources

Edit the `getStreamUrl()` function in the HTML files to point to your streaming servers.

### Add Authentication

Modify the metadata structure to include authentication requirements and update the viewer accordingly.

### Custom Styling

The CSS is embedded in the HTML files and can be customized for your brand.

## 📱 Mobile Support

Both HTML files are fully responsive and work on:

- Desktop browsers
- Mobile browsers
- Tablets
- Progressive Web Apps (PWA)

## 🔒 Security Considerations

- **HTTPS Required**: For camera/microphone access
- **CORS Configuration**: Ensure your streaming servers allow cross-origin requests
- **Content Validation**: Validate stream metadata before displaying
- **ENS Verification**: Verify ENS resolution before trusting content

## 🚀 Deployment Options

### 1. **IPFS Gateways**

- `https://ipfs.io/ipfs/`
- `https://gateway.pinata.cloud/ipfs/`
- `https://cloudflare-ipfs.com/ipfs/`

### 2. **ENS Names**

- `ethaccra.eth`
- `stream.eth`
- `live.eth`

### 3. **Custom Domains**

- Point your domain to IPFS gateway
- Use subdomains for different streams

## 📊 Analytics

Add analytics by including tracking scripts in the HTML files:

```html
<script>
  // Track stream views
  fetch("/api/analytics", {
    method: "POST",
    body: JSON.stringify({
      stream: "ethaccra",
      viewer: "ipfs-user",
      timestamp: Date.now(),
    }),
  });
</script>
```

## 🔄 Updates

To update the stream viewer:

1. **Modify HTML files**
2. **Re-upload to IPFS** (new CID generated)
3. **Update ENS content hash** to new CID
4. **Users automatically get updated version**

This creates a truly decentralized, censorship-resistant streaming interface that works with your existing streaming infrastructure!
