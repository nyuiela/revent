"use client";

import { useState } from "react";
import { X, Mail, CheckCircle } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onJoinWaitlist: (email: string) => Promise<void>;
};

export default function WaitlistModal({ isOpen, onClose, onJoinWaitlist }: Props) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      await onJoinWaitlist(email.trim());
      setIsSubmitted(true);
    } catch {
      setError("Failed to join waitlist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-auto bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-2xl shadow-xl p-6 m-4 bg-background">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[var(--app-accent)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--app-foreground)] mb-2">
                Join the Waitlist
              </h2>
              <p className="text-sm text-[var(--app-foreground-muted)]">
                Be among the first to experience the future of live streaming.
                Get notified when we launch.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--app-foreground)] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 rounded-lg border border-[var(--app-card-border)] bg-[var(--app-background)] text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isSubmitting ? "Joining..." : "Join Waitlist"}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-xs text-[var(--app-foreground-muted)]">
                By joining, you agree to receive updates about our launch.
                <br />
                We respect your privacy and won&apos;t spam you.
              </p>
            </div>
          </>
        ) : (
          /* Success state */
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--app-foreground)] mb-2">
              Welcome to the Waitlist!
            </h2>
            <p className="text-sm text-[var(--app-foreground-muted)] mb-6">
              You&apos;ve successfully joined our waitlist. We&apos;ll notify you as soon as we launch.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
