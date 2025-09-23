"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EventDetails } from "@/utils/types";
import Confetti from "./confetti";
import { Ticket, Calendar, MapPin } from "lucide-react";

type RegistrationSuccessCardProps = {
  event: EventDetails;
  ticketType?: string;
  quantity?: number;
  totalPrice?: number;
  currency?: string;
  onClose?: () => void;
  ticketsCreated?: boolean;
};

export default function RegistrationSuccessCard({
  event,
  ticketType,
  quantity = 1,
  totalPrice = 0,
  currency = "USD",
  onClose,
  ticketsCreated = false
}: RegistrationSuccessCardProps) {
  const [showSuccess, setShowSuccess] = useState(true);

  // Auto-hide after 8 seconds (longer than event creation)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSuccess(false);
      onClose?.();
    }, 20000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!showSuccess) return null;

  const formatPrice = (price: number, curr: string) => {
    if (price === 0) return "Free";
    return curr === "USD" ? `$${price.toLocaleString()}` : `${price.toLocaleString()} ${curr}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white/30 dark:bg-transparent backdrop-blur-sm rounded-xl shadow-sm border border-border fixed top-0 left-0 right-0 z-50">
      <Confetti />

      {/* Success Card */}
      <Card className="z-10 w-[400px] text-center shadow-none border-none bg-transparent">
        {/* Event Image */}
        {event.image ? (
          <div className="w-full mb-3">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-40 object-cover rounded-xl border border-border"
            />
          </div>
        ) : null}
        {/* <CardHeader>
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Registration Successful!
          </CardTitle>
        </CardHeader> */}
        <CardContent className="space-y-4">
          {/* Event Info */}
          <div className="text-left bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">{event.title}</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {event.date} • {event.time}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {event.location}
              </div>
              {ticketsCreated && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Ticket className="w-4 h-4" />
                  Tickets created for this event
                </div>
              )}
            </div>
          </div>

          {/* Ticket Info */}
          {ticketType && (
            <div className="text-left bg-primary/30 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Ticket Details</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="text-foreground">{ticketType}</span>
                </div>
                {quantity > 1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="text-foreground">{quantity}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Total:</span>
                  <span className="text-primary">{formatPrice(totalPrice, currency)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          <p className="text-foreground">
            {ticketType
              ? `You've successfully purchased ${quantity > 1 ? `${quantity} tickets` : 'a ticket'} for this event!`
              : "You've successfully registered for this event!"
            }
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setShowSuccess(false);
                onClose?.();
              }}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Cast Ticket
            </button>
            <button
              onClick={() => {
                setShowSuccess(false);
                onClose?.();
              }}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
