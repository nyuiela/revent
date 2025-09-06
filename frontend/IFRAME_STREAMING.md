# Iframe Streaming Guide

This guide explains how to load MediaMTX streams in iframes and the considerations involved.

## Files Created

1. **`stream-iframe.html`** - Main iframe viewer with controls
2. **`stream-embed.html`** - Embeddable stream player
3. **`test-hls.html`** - HLS stream testing utility

## How to Use Iframe Streaming

### Method 1: Direct URL in Iframe

```html
<iframe
  src="http://207.180.247.72:8888/ethAccra/index.m3u8"
  width="800"
  height="450"
  allowfullscreen
>
</iframe>
```

### Method 2: Using the Embed Page (Recommended)

```html
<iframe
  src="stream-embed.html?url=http://207.180.247.72:8888/ethAccra"
  width="800"
  height="450"
  allowfullscreen
  sandbox="allow-same-origin allow-scripts"
>
</iframe>
```

### Method 3: Using the Full Iframe Viewer

```html
<iframe src="stream-iframe.html" width="100%" height="600" allowfullscreen>
</iframe>
```

## Important Considerations

### 1. CORS (Cross-Origin Resource Sharing)

MediaMTX servers need to allow iframe embedding:

```yaml
# In mediamtx.yml
hlsAllowOrigin: "*"
```

### 2. Iframe Sandbox Attributes

For security, use appropriate sandbox attributes:

```html
<!-- Standard streaming -->
<iframe sandbox="allow-same-origin allow-scripts"></iframe>

<!-- With fullscreen support -->
<iframe sandbox="allow-same-origin allow-scripts allow-presentation"></iframe>

<!-- No restrictions (less secure) -->
<iframe sandbox=""></iframe>
```

### 3. HTTPS vs HTTP

- **HTTPS pages** can only embed HTTPS iframes
- **HTTP pages** can embed both HTTP and HTTPS iframes
- MediaMTX streams are typically HTTP, so ensure your page is also HTTP

### 4. Browser Compatibility

| Browser       | HLS Support | Iframe Support |
| ------------- | ----------- | -------------- |
| Chrome        | Native      | ✅             |
| Firefox       | Native      | ✅             |
| Safari        | Native      | ✅             |
| Edge          | Native      | ✅             |
| Mobile Safari | Native      | ✅             |
| Chrome Mobile | Native      | ✅             |

## MediaMTX Configuration for Iframe Support

```yaml
# Enable HLS
hls: yes
hlsAddress: :8888
hlsVariant: mpegts
hlsSegmentCount: 7
hlsSegmentDuration: 1s
hlsAllowOrigin: "*"

# Enable WebRTC (for WHIP streams)
webrtc: yes
webrtcAddress: :8889
webrtcEncryption: no
```

## Docker Command with Iframe Support

```bash
docker run --rm -it \
-e MTX_HLS=yes \
-e MTX_HLS_ADDRESS=:8888 \
-e MTX_HLS_VARIANT=mpegts \
-e MTX_HLS_SEGMENTCOUNT=7 \
-e MTX_HLS_SEGMENTDURATION=1s \
-e MTX_HLS_ALLOWORIGIN="*" \
-e MTX_WHIP=yes \
-e MTX_WHIP_ADDRESS=:8889 \
-e MTX_WHIP_ENCRYPT=no \
-p 8888:8888 \
-p 8889:8889 \
bluenviron/mediamtx
```

## Testing Your Setup

1. **Test HLS Stream:**

   ```
   http://your-server:8888/ethAccra/index.m3u8
   ```

2. **Test in Browser:**

   ```
   http://your-frontend/stream-iframe.html
   ```

3. **Test Embed:**
   ```
   http://your-frontend/stream-embed.html?url=http://your-server:8888/ethAccra
   ```

## Troubleshooting

### Stream Not Loading in Iframe

1. **Check CORS headers:**

   ```bash
   curl -I http://207.180.247.72:8888/ethAccra/index.m3u8
   ```

2. **Check iframe sandbox:**
   - Ensure `allow-same-origin` is included
   - Add `allow-scripts` for JavaScript

3. **Check browser console:**
   - Look for CORS errors
   - Check for mixed content warnings

### Mixed Content Issues

If your page is HTTPS but stream is HTTP:

```html
<!-- This will be blocked -->
<iframe src="http://207.180.247.72:8888/ethAccra/index.m3u8"></iframe>

<!-- Use HTTPS or make your page HTTP -->
<iframe src="https://your-https-server:8888/ethAccra/index.m3u8"></iframe>
```

### Stream Format Issues

1. **HLS streams** work best in iframes
2. **WebRTC streams** may not work in iframes due to security restrictions
3. **RTMP streams** cannot be embedded directly in iframes

## Advanced Features

### Fullscreen Support

```html
<iframe
  allowfullscreen
  sandbox="allow-same-origin allow-scripts allow-presentation"
>
</iframe>
```

### Responsive Iframe

```css
.iframe-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
}

.iframe-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

### Communication with Parent Window

```javascript
// In iframe
window.parent.postMessage("streamLoaded", "*");

// In parent
window.addEventListener("message", (event) => {
  if (event.data === "streamLoaded") {
    console.log("Stream loaded in iframe");
  }
});
```

## Security Considerations

1. **Use sandbox attributes** to limit iframe capabilities
2. **Validate URLs** before embedding
3. **Use HTTPS** when possible
4. **Implement CSP** (Content Security Policy) headers
5. **Monitor for XSS** attacks through iframe content

## Performance Tips

1. **Lazy load iframes** when they come into view
2. **Use appropriate dimensions** to avoid layout shifts
3. **Implement loading states** for better UX
4. **Cache stream URLs** when possible
5. **Use CDN** for iframe content when possible
