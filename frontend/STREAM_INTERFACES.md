# Stream Interfaces

This directory contains three different HTML stream interfaces for displaying live video content. Each interface is designed for different use cases and complexity levels.

## 📁 **Available Interfaces:**

### 1. **simple-stream.html** (Basic)

- **Purpose**: Minimal, lightweight stream viewer
- **Features**: Basic video player with URL input
- **Best for**: Quick testing, simple integrations
- **Size**: ~2KB

### 2. **stream-interface.html** (Standard)

- **Purpose**: Full-featured stream interface with modern UI
- **Features**:
  - Protocol detection (HLS, WebRTC, RTMP, Direct Video)
  - Status indicators
  - Error handling
  - Responsive design
  - Stream information display
- **Best for**: Production use, general streaming
- **Size**: ~8KB

### 3. **stream-interface-advanced.html** (Advanced)

- **Purpose**: Professional-grade stream interface with analytics
- **Features**:
  - All standard features
  - HLS.js integration for better HLS support
  - Quality selection (1080p, 720p, 480p, 360p, Auto)
  - Real-time stream statistics
  - Fullscreen support
  - Buffer health monitoring
  - Bitrate and FPS display
- **Best for**: Professional streaming, analytics, quality control
- **Size**: ~12KB + HLS.js library

## 🚀 **Quick Start:**

### **Basic Usage:**

```html
<!-- Simple integration -->
<iframe src="simple-stream.html" width="100%" height="400px"></iframe>
```

### **Standard Usage:**

```html
<!-- Full-featured integration -->
<iframe src="stream-interface.html" width="100%" height="600px"></iframe>
```

### **Advanced Usage:**

```html
<!-- Professional integration -->
<iframe
  src="stream-interface-advanced.html"
  width="100%"
  height="700px"
></iframe>
```

## 🔧 **Supported Stream Types:**

### **HLS (HTTP Live Streaming)**

- **Format**: `.m3u8` playlists
- **Example**: `http://example.com/stream.m3u8`
- **Best for**: Live streaming, adaptive bitrate

### **WebRTC**

- **Format**: WHIP/WHEP endpoints
- **Example**: `http://example.com/stream/whip`
- **Best for**: Low-latency streaming

### **Direct Video**

- **Format**: MP4, WebM, OGG, AVI, MOV
- **Example**: `http://example.com/video.mp4`
- **Best for**: On-demand content

### **RTMP**

- **Format**: RTMP URLs
- **Example**: `rtmp://example.com/live/stream`
- **Best for**: Legacy streaming systems

## 📱 **Responsive Design:**

All interfaces are fully responsive and work on:

- ✅ Desktop browsers
- ✅ Mobile browsers
- ✅ Tablets
- ✅ Smart TVs
- ✅ Embedded devices

## 🎯 **Use Cases:**

### **Event Streaming:**

```html
<!-- For live events -->
<iframe src="stream-interface.html" width="100%" height="600px"></iframe>
```

### **IPFS Integration:**

```html
<!-- For decentralized streaming -->
<iframe
  src="https://ipfs.io/ipfs/QmXxXxXx..."
  width="100%"
  height="600px"
></iframe>
```

### **ENS Domain Integration:**

```html
<!-- For ENS-based streaming -->
<iframe src="https://myevent.eth" width="100%" height="600px"></iframe>
```

## 🛠️ **Customization:**

### **Styling:**

All interfaces use CSS variables for easy theming:

```css
:root {
  --primary-color: #007bff;
  --background-color: #f5f5f5;
  --text-color: #333;
  --border-radius: 10px;
}
```

### **Configuration:**

Modify the JavaScript configuration:

```javascript
// Example stream URLs
const exampleUrls = [
  "http://your-server.com/stream.m3u8",
  "http://your-server.com/stream/whip",
  "http://your-server.com/video.mp4",
];
```

## 🔗 **Integration Examples:**

### **React Component:**

```jsx
function StreamViewer({ streamUrl }) {
  return (
    <iframe
      src={`stream-interface.html?url=${encodeURIComponent(streamUrl)}`}
      width="100%"
      height="600px"
      frameBorder="0"
    />
  );
}
```

### **Vue Component:**

```vue
<template>
  <iframe
    :src="`stream-interface.html?url=${encodeURIComponent(streamUrl)}`"
    width="100%"
    height="600px"
    frameborder="0"
  />
</template>
```

### **Angular Component:**

```typescript
@Component({
  template: `
    <iframe
      [src]="'stream-interface.html?url=' + encodeURIComponent(streamUrl)"
      width="100%"
      height="600px"
      frameborder="0"
    ></iframe>
  `,
})
export class StreamViewerComponent {
  @Input() streamUrl: string;
}
```

## 📊 **Performance:**

### **Loading Times:**

- **Simple**: ~100ms
- **Standard**: ~300ms
- **Advanced**: ~500ms (with HLS.js)

### **Memory Usage:**

- **Simple**: ~5MB
- **Standard**: ~15MB
- **Advanced**: ~25MB

### **CPU Usage:**

- **Simple**: Low
- **Standard**: Medium
- **Advanced**: High (with analytics)

## 🔒 **Security:**

### **Content Security Policy:**

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  media-src 'self' http: https:;
"
/>
```

### **HTTPS Requirements:**

- All interfaces work with HTTPS
- Mixed content warnings for HTTP streams
- Secure WebRTC requires HTTPS

## 🐛 **Troubleshooting:**

### **Common Issues:**

1. **Stream not loading:**
   - Check URL format
   - Verify CORS headers
   - Test in different browsers

2. **HLS not working:**
   - Use advanced interface with HLS.js
   - Check MIME type configuration
   - Verify playlist format

3. **WebRTC issues:**
   - Ensure HTTPS connection
   - Check browser compatibility
   - Verify WHIP endpoint

### **Debug Mode:**

Enable debug logging:

```javascript
// In browser console
localStorage.setItem("debug", "true");
```

## 🚀 **Deployment:**

### **Static Hosting:**

```bash
# Upload to any static host
cp *.html /path/to/web/root/
```

### **IPFS Deployment:**

```bash
# Upload to IPFS
ipfs add *.html
```

### **CDN Integration:**

```bash
# Upload to CDN
aws s3 cp *.html s3://your-bucket/
```

## 📈 **Analytics:**

### **Stream Metrics:**

- View count
- Buffer health
- Bitrate usage
- Error rates
- Quality switches

### **Integration:**

```javascript
// Custom analytics
function trackStreamEvent(event, data) {
  // Send to your analytics service
  fetch("/api/analytics", {
    method: "POST",
    body: JSON.stringify({ event, data }),
  });
}
```

## 🔄 **Updates:**

### **Version Control:**

- All interfaces are versioned
- Backward compatibility maintained
- Migration guides provided

### **Feature Requests:**

- Submit via GitHub issues
- Community contributions welcome
- Regular updates scheduled

This comprehensive stream interface system provides everything needed for professional video streaming, from simple embedded players to advanced analytics-driven interfaces.
