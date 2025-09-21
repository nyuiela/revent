"use client";

import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, X, QrCode } from "lucide-react";

interface QRCodeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | number;
  eventTitle?: string;
}

export default function QRCodeBottomSheet({
  isOpen,
  onClose,
  eventId,
  eventTitle = "Event Verification"
}: QRCodeBottomSheetProps) {
  const [qrValue, setQrValue] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate QR code data - this could be a verification URL or event ID
  useEffect(() => {
    if (isOpen && eventId) {
      // You can customize this URL structure based on your needs
      const verificationUrl = `${window.location.origin}/verify/${eventId}`;
      setQrValue(verificationUrl);
    }
  }, [isOpen, eventId]);

  const downloadQRCode = () => {
    if (qrRef.current) {
      const svgElement = qrRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `event-${eventId}-qr-code.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="relative bg-[var(--events-card-bg)] rounded-t-3xl w-full max-w-md mx-4 shadow-2xl transform transition-transform duration-300 ease-out">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-[var(--events-foreground-muted)] rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--events-foreground-muted)]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--events-accent)]/20 rounded-lg">
              <QrCode className="w-5 h-5 text-[var(--events-accent)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--events-foreground)]">
                Event Verification QR
              </h3>
              <p className="text-sm text-[var(--events-foreground-muted)]">
                {eventTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--events-foreground-muted)]/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--events-foreground-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* QR Code Display */}
          <div className="flex flex-col items-center space-y-4">
            <div
              ref={qrRef}
              className="p-4 bg-white rounded-2xl shadow-lg"
            >
              {qrValue && (
                <QRCodeSVG
                  value={qrValue}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              )}
            </div>

            {/* Event Info */}
            <div className="text-center">
              <p className="text-sm text-[var(--events-foreground-muted)] mb-1">
                Event ID: {eventId}
              </p>
              <p className="text-xs text-[var(--events-foreground-muted)] max-w-xs break-all">
                {qrValue}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-[var(--events-accent)]/10 rounded-xl p-4 w-full">
              <h4 className="text-sm font-medium text-[var(--events-foreground)] mb-2">
                How to use:
              </h4>
              <ul className="text-xs text-[var(--events-foreground-muted)] space-y-1">
                <li>• Scan this QR code to verify event attendance</li>
                <li>• Share with attendees for easy check-in</li>
                <li>• Download the image for offline use</li>
              </ul>
            </div>

            {/* Download Button */}
            <button
              onClick={downloadQRCode}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[var(--events-accent)] text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
