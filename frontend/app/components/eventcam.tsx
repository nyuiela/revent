import { ReactNode, useState, useRef, useEffect, useCallback } from "react";
import { Button, Icon } from "./DemoComponents";
import { Html5QrcodeScanner } from "html5-qrcode";
// import onchainevent from "../../public/onchain.jpeg"
// import Image from "next/image";

type HomeProps = {
  setActiveTab: (tab: string) => void;
};

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({
  title,
  children,
  className = "",
  onClick,
}: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`bg-[var(--events-card-bg)] backdrop-blur-sm rounded-xl shadow-sm border border-[var(--events-card-border)] overflow-hidden transition-all hover:shadow-lg ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
    >
      {title && (
        <div className="px-5 py-3 border-b border-[var(--events-card-border)]">
          <h3 className="text-lg font-medium text-[var(--events-foreground)]">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// Event data type
type EventData = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  category: string;
  image?: string; // Using the specific image type
  price?: number;
  organizer: string;
};

// Mock event data
const mockEvent: EventData = {
  id: "evt-001",
  title: "Web3 Developer Meetup",
  description: "Join us for an exciting evening of networking, learning, and collaboration with fellow Web3 developers. We'll discuss the latest trends in blockchain development, share project ideas, and build connections for future collaborations.",
  date: "December 15, 2024",
  time: "6:00 PM - 9:00 PM",
  location: "Tech Hub Downtown, 123 Innovation Street",
  maxParticipants: 50,
  currentParticipants: 32,
  category: "Technology",
  organizer: "Web3 Community",
  // image: onchainevent,
  price: 0
};

export function EventCam({ }: HomeProps) {
  const [isParticipating, setIsParticipating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<PermissionState | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // const handleBackToHome = () => {
  //   setActiveTab("home");
  // };

  // Check camera permission
  const checkCameraPermission = async () => {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermission(permission.state);

        // Listen for permission changes
        permission.onchange = () => {
          setCameraPermission(permission.state);
        };

        return permission.state;
      }
      return 'prompt'; // Fallback for browsers without permissions API
    } catch (error) {
      console.log('Permission check failed:', error);
      return 'prompt';
    }
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      setPermissionError(null);
      setIsScanning(true);

      // Try to get user media to trigger permission request
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());

      setCameraPermission('granted');
      return true;
    } catch (error: unknown) {
      console.error('Camera permission denied:', error);
      let errorMessage = 'Camera access denied';

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device. Please check your device has a working camera.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported on this device or browser.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is in use by another application. Please close other apps using the camera.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera constraints not met. Please try again.';
        } else if (error.name === 'SecurityError') {
          errorMessage = 'Camera access blocked due to security restrictions. Please check your browser settings.';
        }
      }

      setPermissionError(errorMessage);
      setCameraPermission('denied');
      setIsScanning(false);
      return false;
    }
  };

  // QR Scanner functions
  const startScanner = async () => {
    setShowScanner(true);
    setScanResult(null);
    setPermissionError(null);

    // Check current permission status
    const currentPermission = await checkCameraPermission();

    if (currentPermission === 'denied') {
      setPermissionError('Camera access is blocked. Please enable it in your browser settings and try again.');
      setIsScanning(false);
      return;
    }

    if (currentPermission === 'prompt' || currentPermission === 'granted') {
      // Request permission if needed
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return;
      }
    }

    // Start scanning after permission is granted
    setIsScanning(true);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setShowScanner(false);
    setIsScanning(false);
    setPermissionError(null);
  };

  const handleScanSuccess = useCallback((decodedText: string) => {
    setScanResult(decodedText);
    setIsScanning(false);

    // Here you would validate the QR code content
    // For now, we'll assume any valid QR code confirms participation
    if (decodedText) {
      setIsParticipating(true);
      setShowConfirmation(true);
      stopScanner();
    }
  }, []);

  const handleScanError = (error: unknown) => {
    console.log("QR Scan error:", error);
    // Continue scanning on error
  };

  useEffect(() => {
    // Check camera permission on component mount
    checkCameraPermission();
  }, []);

  useEffect(() => {
    if (showScanner && scannerContainerRef.current && !scannerRef.current && cameraPermission === 'granted') {
      try {
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        scannerRef.current.render(handleScanSuccess, handleScanError);
      } catch (error) {
        console.error("Error initializing scanner:", error);
        setIsScanning(false);
        setPermissionError('Failed to initialize camera scanner');
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [showScanner, cameraPermission, handleScanSuccess]);

  return (
    <div className="px-4">

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 top-[-10rem]">
          <div className="bg-background rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Scan QR Code</h3>
              <button
                onClick={stopScanner}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Icon name="x" size="md" />
              </button>
            </div>

            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Point your camera at the event QR code to confirm participation
              </p>

              {/* Camera Permission Instructions */}
              <div className="bg-background border border-gray-600 rounded-lg p-3 text-left">
                <p className="text-xs text-gray-600 font-medium mb-2">📱 Camera Setup:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Allow camera access when prompted</li>
                  <li>• Hold device steady for best scanning</li>
                  <li>• Ensure QR code is well-lit and clear</li>
                  <li>• Use back camera on mobile devices</li>
                </ul>
              </div>
            </div>

            {/* Permission Error Display */}


            {/* Camera Permission Status */}
            {!permissionError && cameraPermission === 'prompt' && (
              <div className="mb-4 p-4 bg-background border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Icon name="camera" size="sm" className="text-blue-600" />
                  <p className="text-sm text-blue-800 font-medium">Camera Permission Required</p>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Please allow camera access when prompted to scan QR codes.
                </p>
                <button
                  onClick={requestCameraPermission}
                  className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Grant Camera Permission
                </button>
              </div>
            )}

            {/* Permission Requesting State */}
            {!permissionError && cameraPermission === 'prompt' && isScanning && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                  <p className="text-sm text-yellow-800 font-medium">Requesting Camera Permission</p>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Please respond to the camera permission prompt in your browser.
                </p>
              </div>
            )}

            {/* Scanner Container */}
            {!permissionError && cameraPermission === 'granted' && (
              <div
                id="qr-reader"
                ref={scannerContainerRef}
                className="w-full"
              ></div>
            )}

            {/* Loading State */}
            {isScanning && !permissionError && cameraPermission === 'granted' && (
              <div className="text-center mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--events-accent)] mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Initializing camera...</p>
              </div>
            )}

            {/* Scan Result */}
            {scanResult && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>QR Code detected!</strong> Processing participation...
                </p>
              </div>
            )}

            {/* Manual Entry Fallback */}
            {permissionError && (
              <div className="mt-4 p-4 bg-background border border-gray-600 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  Can&apos;t use camera? You can manually enter the event code:
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="XDW-ASD-ASU"
                    className="flex-1 px-3 py-2 border outline-none border-gray-600 rounded-lg text-sm uppercase bg-background text-foreground"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      // Handle manual code entry
                      setIsParticipating(true);
                      setShowConfirmation(true);
                      stopScanner();
                    }}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mint Button with QR Scanner */}
      <div className="space-y-3">
        {/* Camera Permission Status Indicator */}
        {cameraPermission && (
          <div className={`p-3 rounded-lg border text-sm ${cameraPermission === 'granted'
            ? 'bg-green-50 border-green-200 text-green-800'
            : cameraPermission === 'denied'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}>
            <div className="flex items-center space-x-2">
              <Icon
                name={cameraPermission === 'granted' ? 'check' : cameraPermission === 'denied' ? 'x' : 'camera'}
                size="sm"
                className={cameraPermission === 'granted' ? 'text-green-600' : cameraPermission === 'denied' ? 'text-red-600' : 'text-yellow-600'}
              />
              <span className="font-medium">
                {cameraPermission === 'granted'
                  ? 'Camera access granted'
                  : cameraPermission === 'denied'
                    ? 'Camera access blocked'
                    : 'Camera permission pending'
                }
              </span>
            </div>
            {cameraPermission === 'denied' && (
              <p className="text-xs mt-1 opacity-80">
                You&apos;ll need to enable camera access in your browser settings to scan QR codes.
              </p>
            )}
          </div>
        )}

        <Button
          className="w-full p-4 h-11"
          onClick={startScanner}
          icon={<Icon name="camera" size="sm" />}
          disabled={cameraPermission === 'denied'}
        >
          {isParticipating ? "Participation Confirmed" : "Scan QR to Confirm Participation"}
        </Button>
      </div>

      {/* Confirmation Message */}
      {showConfirmation && (
        <Card title="Participation Confirmed!" className="border-none shadow-none mt-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Icon name="check" size="lg" className="text-green-600" />
            </div>

            <div>
              <h3 className="text-lg font-medium text-[var(--events-foreground)] mb-2">
                You&apos;re all set!
              </h3>
              <p className="text-[var(--events-foreground-muted)]">
                Your participation in &quot;{mockEvent.title}&quot; has been confirmed and added to your profile.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-800">
                <div className="font-medium">Event Details:</div>
                <div>{mockEvent.date} at {mockEvent.time}</div>
                <div className="mt-1">Location: {mockEvent.location}</div>
              </div>
            </div>
            {/* 
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                className="flex-1"
              >
                View Event Details
              </Button>
              <Button
                onClick={handleBackToHome}
                className="flex-1"
                icon={<Icon name="home" size="sm" />}
              >
                Back to Profile
              </Button>
            </div> */}
          </div>
        </Card>
      )}
    </div>
  );
}
