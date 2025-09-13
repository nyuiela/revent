"use client";

import React, { useRef, useState, useCallback } from "react";
import Peer from "simple-peer";

interface StreamPublisherProps {
  whipUrl?: string;
  streamKey?: string;
}

export default function StreamPublisher({
  whipUrl = "http://207.180.247.72:8889/ethaccra/whip",
  streamKey
}: StreamPublisherProps) {

  // Helper function to try different URL formats
  const getWhipUrls = (baseUrl: string) => {
    const urls = [baseUrl];

    // Try different WHIP endpoint formats (focus on valid MediaMTX endpoints)
    if (baseUrl.endsWith('/whip')) {
      // If it already ends with /whip, try without it
      urls.push(baseUrl.replace('/whip', ''));
    } else {
      // If it doesn't end with /whip, add it
      urls.push(`${baseUrl}/whip`);
    }

    return urls;
  };
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setStreamStatus('idle');
  }, []);

  const startStreaming = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setStreamStatus('connecting');

      // 1. Capture camera + mic
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 2. Create WebRTC peer with the stream
      // Try different peer configurations for WHIP compatibility
      const peerConfigs = [
        // Configuration 1: No data channel (WHIP standard)
        {
          initiator: true,
          trickle: false,
          stream: stream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        },
        // Configuration 2: Disabled data channel
        {
          initiator: true,
          trickle: false,
          stream: stream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        },
        // Configuration 3: Minimal data channel config
        {
          initiator: true,
          trickle: false,
          stream: stream,
          channelConfig: {
            ordered: false,
            maxRetransmits: 0
          },
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        }
      ];

      // Try the first configuration (no data channel)
      let peer = new Peer(peerConfigs[0]);
      let currentConfigIndex = 0;

      peerRef.current = peer;

      // 3. Setup peer event handlers
      const setupPeerEvents = (peerInstance: Peer.Instance) => {
        peerInstance.on("signal", async (offer: { sdp: string }) => {
          try {
            console.log("Sending SDP offer to:", whipUrl);
            console.log("SDP offer:", offer.sdp.substring(0, 200) + "...");

            // Try different content types that MediaMTX might accept
            // Order by most likely to work with MediaMTX
            const contentTypes = [
              "application/sdp",           // Standard WHIP
              "text/plain",               // Some MediaMTX configs prefer this
              "application/webrtc-sdp",   // Alternative WebRTC format
              "application/vnd.webrtc.sdp", // Vendor-specific format
              "application/octet-stream"  // Fallback for some servers
            ];

            // Try different URL formats
            const urlsToTry = getWhipUrls(whipUrl);
            console.log("URLs to try:", urlsToTry);

            // First, test basic connectivity to the server
            try {
              const baseUrl = whipUrl.replace(/\/whip$/, '');
              console.log("Testing connectivity to:", baseUrl);
              const connectivityTest = await fetch(baseUrl, { method: "GET" });
              console.log("Connectivity test result:", connectivityTest.status, connectivityTest.statusText);
            } catch (err) {
              console.log("Connectivity test failed:", err);
            }

            let response: Response | null = null;
            let lastError: Error | null = null;
            let successfulConfig: { url: string; contentType: string } | null = null;

            // Try each URL with each content type
            for (const url of urlsToTry) {
              for (const contentType of contentTypes) {
                try {
                  console.log(`Trying URL: ${url} with content type: ${contentType}`);

                  response = await fetch(url, {
                    method: "POST",
                    headers: {
                      "Content-Type": contentType,
                      "Accept": "application/sdp",
                      ...(streamKey && { "Authorization": `Bearer ${streamKey}` })
                    },
                    body: offer.sdp
                  });

                  if (response.ok) {
                    console.log(`Success with URL: ${url} and content type: ${contentType}`);
                    successfulConfig = { url, contentType };
                    break;
                  } else {
                    console.log(`Failed with ${url} and ${contentType}: ${response.status} ${response.statusText}`);
                    const errorText = await response.text();
                    console.log(`Error details: ${errorText}`);

                    // Check if it's the "unsupported media" error and we can try a different peer config
                    if (errorText.includes('unsupported media') && currentConfigIndex < peerConfigs.length - 1) {
                      console.log(`Trying different peer configuration...`);
                      currentConfigIndex++;

                      // Destroy current peer and create new one with different config
                      peer.destroy();
                      peer = new Peer(peerConfigs[currentConfigIndex]);
                      peerRef.current = peer;

                      // Re-setup event handlers for new peer
                      setupPeerEvents(peer);

                      // Retry the signal
                      return; // Exit this attempt and let the new peer generate a new signal
                    }

                    lastError = new Error(`Server responded with ${response.status}: ${response.statusText}. Details: ${errorText}`);
                  }
                } catch (err) {
                  console.log(`Network error with ${url} and ${contentType}:`, err);
                  lastError = err instanceof Error ? err : new Error('Network error');
                }
              }

              if (response && response.ok) {
                break; // Success, stop trying other URLs
              }
            }

            if (!response || !response.ok) {
              throw lastError || new Error('All URL and content type combinations failed');
            }

            console.log("Response status:", response.status);
            console.log("Response headers:", Object.fromEntries(response.headers.entries()));
            console.log("Successful configuration:", successfulConfig);

            const answer = await response.text();
            console.log("Received SDP answer:", answer.substring(0, 200) + "...");
            peer.signal({ type: "answer", sdp: answer });
          } catch (err) {
            console.error("Error sending offer:", err);
            setError(`Failed to connect to server: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setStreamStatus('error');
            cleanup();
          }
        });

        peerInstance.on("connect", () => {
          console.log("Connected to streaming server!");
          setIsStreaming(true);
          setStreamStatus('connected');
          setIsLoading(false);
        });

        peerInstance.on("error", (err: Error) => {
          console.error("Peer error:", err);
          setError(`Streaming error: ${err.message}`);
          setStreamStatus('error');
          setIsLoading(false);
          cleanup();
        });

        peerInstance.on("close", () => {
          console.log("Stream connection closed");
          setIsStreaming(false);
          setStreamStatus('idle');
          cleanup();
        });
      };

      // Setup initial peer events
      setupPeerEvents(peer);

    } catch (err) {
      console.error("Error starting stream:", err);
      setError(`Failed to access camera/microphone: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStreamStatus('error');
      setIsLoading(false);
      cleanup();
    }
  }, [whipUrl, streamKey, cleanup]);

  const stopStreaming = useCallback(() => {
    cleanup();
    setIsLoading(false);
  }, [cleanup]);

  const getStatusColor = () => {
    switch (streamStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (streamStatus) {
      case 'connected': return 'Live';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Offline';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 rounded-lg">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-96 h-72 rounded-lg shadow-md bg-black"
        />
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor()} bg-white/90`}>
          {getStatusText()}
        </div>
      </div>

      {error && (
        <div className="w-96 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex space-x-3">
        {!isStreaming ? (
          <button
            onClick={startStreaming}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Starting...</span>
              </>
            ) : (
              <span>Start Streaming</span>
            )}
          </button>
        ) : (
          <button
            onClick={stopStreaming}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
          >
            <span>Stop Streaming</span>
          </button>
        )}
      </div>

      <div className="text-sm text-gray-600 text-center max-w-md">
        <p>Stream to: <code className="bg-gray-200 px-1 rounded">{whipUrl}</code></p>
        {streamKey && <p>Stream Key: <code className="bg-gray-200 px-1 rounded">{streamKey}</code></p>}
      </div>
    </div>
  );
}
