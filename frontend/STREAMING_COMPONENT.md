# Live Streaming Component

A React component for streaming user camera and microphone feed to RTMP/WebRTC servers using the WHIP (WebRTC-HTTP Ingestion Protocol) standard.

## Features

- ✅ **WebRTC Streaming**: Uses simple-peer for WebRTC connections
- ✅ **WHIP Protocol**: Compatible with MediaMTX and other WHIP-compatible servers
- ✅ **Real-time Status**: Shows connection status (Offline, Connecting, Live, Error)
- ✅ **Error Handling**: Comprehensive error handling for media access and network issues
- ✅ **Resource Management**: Proper cleanup of streams and connections
- ✅ **Customizable**: Configurable WHIP URL and stream key
- ✅ **Responsive UI**: Modern, responsive interface with loading states

## Usage

### Basic Usage

```tsx
import StreamPublisher from "./components/live-peer";

function MyPage() {
  return (
    <div>
      <h1>Live Stream</h1>
      <StreamPublisher />
    </div>
  );
}
```

### Advanced Usage with Custom Configuration

```tsx
import StreamPublisher from "./components/live-peer";

function MyPage() {
  return (
    <div>
      <h1>Custom Stream</h1>
      <StreamPublisher
        whipUrl="http://your-server.com:8888/your-stream/whip"
        streamKey="your-authentication-key"
      />
    </div>
  );
}
```

## Props

| Prop        | Type     | Default                                      | Description                                |
| ----------- | -------- | -------------------------------------------- | ------------------------------------------ |
| `whipUrl`   | `string` | `"http://207.180.247.72:8888/ethaccra/whip"` | WHIP endpoint URL for streaming server     |
| `streamKey` | `string` | `undefined`                                  | Optional authentication key for the stream |

## Component States

The component manages several states internally:

- **idle**: Not streaming, ready to start
- **connecting**: Requesting media access and establishing connection
- **connected**: Successfully streaming (shows "Live" indicator)
- **error**: An error occurred (shows error message)

## Browser Permissions

The component will request the following permissions:

- **Camera access**: For video streaming
- **Microphone access**: For audio streaming

Users must grant these permissions for streaming to work.

## Server Requirements

Your streaming server must support the WHIP protocol. Popular options include:

- **MediaMTX** (formerly rtsp-simple-server)
- **GStreamer** with WHIP plugin
- **Custom WHIP-compatible servers**

### WHIP Endpoint Format

The WHIP endpoint should accept POST requests with:

- **Content-Type**: `application/sdp`
- **Body**: SDP offer from WebRTC peer
- **Response**: SDP answer for WebRTC peer

## Error Handling

The component handles various error scenarios:

1. **Media Access Denied**: User denied camera/microphone permissions
2. **Network Errors**: Failed to connect to WHIP server
3. **Server Errors**: WHIP server returned error response
4. **WebRTC Errors**: Peer connection failures

All errors are displayed to the user with descriptive messages.

## Resource Cleanup

The component properly cleans up resources when:

- User clicks "Stop Streaming"
- Component unmounts
- An error occurs
- Connection is lost

This prevents memory leaks and ensures camera/microphone are released.

## Demo Page

Visit `/stream-demo` to see the component in action with different configurations.

## Dependencies

- `simple-peer`: WebRTC peer-to-peer connections
- `@types/simple-peer`: TypeScript definitions
- React 18+ with hooks support

## Browser Support

- Chrome/Chromium 80+
- Firefox 75+
- Safari 14+
- Edge 80+

Requires WebRTC and MediaDevices API support.

## Security Considerations

- Always use HTTPS in production
- Validate stream keys on the server side
- Consider implementing authentication for WHIP endpoints
- Be aware of CORS policies for cross-origin requests

## Troubleshooting

### Common Issues

1. **"Failed to access camera/microphone"**
   - Check browser permissions
   - Ensure HTTPS is used (required for media access)
   - Verify camera/microphone are not in use by other applications

2. **"Failed to connect to server"**
   - Verify WHIP URL is correct
   - Check server is running and accessible
   - Ensure CORS is configured properly

3. **"Streaming error"**
   - Check WebRTC connectivity
   - Verify server supports WHIP protocol
   - Check network firewall settings

### Debug Mode

Enable browser developer tools to see detailed console logs for debugging connection issues.
