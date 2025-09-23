"use client";

import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, X, QrCode, Share } from "lucide-react";
import Image from "next/image";
import Button from "@mui/material/Button";

interface QRCodeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string | number;
  eventTitle?: string;
}

export default function QRCodeBottomSheet({
  isOpen,
  onClose,
  slug,
  eventTitle = "Event Verification"
}: QRCodeBottomSheetProps) {
  const [qrValue, setQrValue] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate QR code data - this could be a verification URL or event ID
  useEffect(() => {
    if (isOpen && slug) {
      // You can customize this URL structure based on your needs
      const verificationUrl = `${window.location.origin}/${slug}/verify?code=123456`;
      setQrValue(verificationUrl);
    }
  }, [isOpen, slug]);

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
          downloadLink.download = `event-${slug}-qr-code.png`;
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
      <div className="relative bg-card rounded-t-3xl w-full max-w-md shadow-2xl transform transition-transform duration-300 ease-out">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-[var(--events-foreground-muted)] rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-[var(--events-foreground-muted)]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--events-accent)]/20 rounded-lg">
              {/* <QrCode className="w-8 h-8 text-[var(--events-accent)]" /> */}
              <Image src="/logo.png" alt="QR Code" className="w-10 h-10" width={32} height={32} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--events-foreground)]">
                Confirm Event Attendance
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
              className="bg-white"
            >
              {qrValue && (
                <QRCodeSVG
                  value={qrValue}
                  size={250}
                  level="M"
                  className="bg-transparent shadow-none w-full h-ful object-cover"
                  includeMargin={true}
                />
              )}
            </div>

            {/* Event Info */}
            <div className="w-full flex flex-col items-center justify-center gap-4">

              {/* Download Button */}
              <button
                onClick={downloadQRCode}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download QR Code
              </button>
              <Button onClick={() => navigator.clipboard.writeText(qrValue)} className="mt-4 text-background font-normal gap-2">
                <Share className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
          <div className="mt-4 text-[11px] text-muted-foreground text-center">powered by revent</div>
        </div>
      </div>
    </div>
  );
}
