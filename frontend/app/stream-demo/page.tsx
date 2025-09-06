import React from 'react';
import StreamPublisher from '../components/live-peer';

const StreamDemoPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Live Streaming Demo</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Default Configuration */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Default Configuration</h2>
            <p className="text-gray-600 mb-4">
              Uses the default WHIP endpoint for streaming.
            </p>
            <StreamPublisher />
          </div>

          {/* Custom Configuration */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Custom Configuration</h2>
            <p className="text-gray-600 mb-4">
              Example with custom WHIP URL and stream key.
            </p>
            <StreamPublisher
              whipUrl="http://your-server.com:8888/your-stream/whip"
              streamKey="your-stream-key-here"
            />
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Use</h3>
          <ul className="text-blue-700 space-y-2">
            <li>• Click &quot;Start Streaming&quot; to begin broadcasting your camera and microphone</li>
            <li>• The component will request camera and microphone permissions</li>
            <li>• Once connected, you&apos;ll see a &quot;Live&quot; status indicator</li>
            <li>• Click &quot;Stop Streaming&quot; to end the broadcast and release resources</li>
            <li>• The component supports both RTMP and WebRTC streaming via WHIP protocol</li>
          </ul>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Configuration Options</h3>
          <div className="text-yellow-700 space-y-2">
            <p><strong>whipUrl:</strong> The WHIP endpoint URL for your streaming server</p>
            <p><strong>streamKey:</strong> Optional authentication key for the stream</p>
            <p><strong>Default:</strong> Uses MediaMTX server at 207.180.247.72:8888</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamDemoPage;
