"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ShowBannerOptions = {
  persist?: boolean;
  durationMs?: number;
};

type BannerToastContextType = {
  message: string | null;
  showBanner: (message: string, options?: number | ShowBannerOptions) => void;
  showBannerPersistent: (message: string) => void;
  showBannerTimed: (message: string, durationMs?: number) => void;
  hideBanner: () => void;
};

const BannerToastContext = createContext<BannerToastContextType | undefined>(undefined);

export const useBannerToast = () => {
  const ctx = useContext(BannerToastContext);
  if (!ctx) throw new Error("useBannerToast must be used within BannerToastProvider");
  return ctx;
};

export const BannerToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const hideBanner = useCallback(() => {
    setMessage(null);
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const showBanner = useCallback((msg: string, options: number | ShowBannerOptions = { durationMs: 2500 }) => {
    setMessage(msg);
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    // Backwards compat: number => durationMs
    const resolved: ShowBannerOptions = typeof options === 'number' ? { durationMs: options } : (options || {});
    const persist = Boolean(resolved.persist);
    const duration = typeof resolved.durationMs === 'number' ? resolved.durationMs : 2500;
    if (!persist && duration > 0) {
      hideTimerRef.current = window.setTimeout(() => {
        setMessage(null);
        hideTimerRef.current = null;
      }, duration);
    }
  }, []);

  const showBannerPersistent = useCallback((msg: string) => {
    showBanner(msg, { persist: true });
  }, [showBanner]);

  const showBannerTimed = useCallback((msg: string, durationMs: number = 2500) => {
    showBanner(msg, { persist: false, durationMs });
  }, [showBanner]);

  const value = useMemo(() => ({ message, showBanner, showBannerPersistent, showBannerTimed, hideBanner }), [message, showBanner, showBannerPersistent, showBannerTimed, hideBanner]);

  return (
    <BannerToastContext.Provider value={value}>
      {children}
      <BannerToast message={message} onClose={hideBanner} />
    </BannerToastContext.Provider>
  );
};

const BannerToast = ({ message, onClose }: { message: string | null; onClose: () => void }) => {
  if (!message) return null;
  return (
    <div className="fixed left-0 right-0 bottom-20 z-50 flex justify-center px-4">
      <div className="max-w-xs w-fit bg-emerald-600 dark:bg-foreground text-background rounded-2xl text-[11px] px-4 py-2 shadow-xl border border-border/30 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2">
          <span className="truncate">{message}</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 text-background/80 hover:text-background"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannerToastProvider;


