"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventDetails } from "@/utils/types";
import Confetti from "./confetti";

export default function EventCreated({ event }: { event: EventDetails }) {
  const [showCongrats, setShowCongrats] = useState(true);

  // Auto-hide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCongrats(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!showCongrats) return null;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white/30 dark:bg-transparent backdrop-blur-sm rounded-xl shadow-sm border border-border fixed top-0 left-0 right-0 z-50">
      <Confetti />

      {/* Event Card */}
      <Card className="z-10 w-[350px] text-center shadow-xl bg-card border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">🎉 Congratulations!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">Your event <strong>{event.title}</strong> was created!</p>
          <p className="text-sm text-muted-foreground mt-2">
            Date: {event.date} | Time: {event.time}
          </p>
          <button
            onClick={() => setShowCongrats(false)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Continue
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
