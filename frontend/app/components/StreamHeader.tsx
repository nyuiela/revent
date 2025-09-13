"use client";

import { useState } from "react";
import {
  Eye,
  X,
  Youtube,
  Twitch,
  Sun,
  Moon,
  Monitor,
  User,
  LogOut
} from "lucide-react";
import { WalletModal } from "@coinbase/onchainkit/wallet";
import { useTheme } from "next-themes";
import { useAccount, useDisconnect } from "wagmi";

type Platform = {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  live: boolean;
};

export default function StreamHeader() {
  const [showModal, setShowModal] = useState(false);
  const [showModalConnect, setShowModalConnect] = useState(false);
  const { theme, setTheme } = useTheme();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: "fc",
      name: "Farcaster",
      icon: <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">F</div>,
      connected: true,
      live: true
    },
    {
      id: "yt",
      name: "YouTube",
      icon: <Youtube className="w-4 h-4 text-red-600" />,
      connected: false,
      live: false
    },
    {
      id: "tw",
      name: "Twitch",
      icon: <Twitch className="w-4 h-4 text-purple-600" />,
      connected: false,
      live: false
    },
    {
      id: "x",
      name: "X",
      icon: <X className="w-4 h-4 text-black dark:text-white" />,
      connected: false,
      live: false
    },
  ]);

  const isAnyLive = platforms.some((p) => p.live);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'System';
  };

  return (
    <>
      <div className="flex items-center justify-between py-2 px-4">
        {/* Wallet connect compact pill */}
        <div className="flex items-center gap-2">

          {isConnected && address ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--app-card-bg)] border border-[var(--app-card-border)] text-sm">
              <User className="w-4 h-4 text-[var(--app-accent)]" />
              <span className="text-[var(--app-foreground)]">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <button
                onClick={() => disconnect()}
                className="ml-1 p-1 hover:bg-[var(--app-gray)] rounded transition-colors"
                title="Disconnect wallet"
              >
                <LogOut className="w-3 h-3 text-[var(--app-foreground-muted)]" />
              </button>
            </div>
          ) : (
            <>
              {/* <WalletModal isOpen={showModal} onClose={() => setShowModal(false)} /> */}
              {/* <NetworkSwitcher /> */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--app-card-bg)] border border-[var(--app-card-border)] text-sm cursor-pointer hover:bg-[var(--app-gray)] transition-colors"
                onClick={() => setShowModalConnect(true)}
              >
                {/* <button
                  className="ml-1 p-1 hover:bg-[var(--app-gray)] rounded transition-colors text-xs font-medium"
                  title="Connect wallet"
                > */}
                Connect Wallet
                {/* </button> */}
              </div>
              {/* <Wallet className="z-10">
                <ConnectWallet className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--app-card-bg)] border border-[var(--app-card-border)] text-sm cursor-pointer hover:bg-[var(--app-gray)] transition-colors *:text-foreground" />
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                    <Avatar />
                    <Name />
                    <Address />
                    <EthBalance />
                  </Identity>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet> */}

              <WalletModal isOpen={showModalConnect} onClose={() => { setShowModalConnect(false) }} className="bg-black shadow-lg" />
            </>
          )}
        </div>

        {/* Center section with theme toggle and streaming platforms */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 rounded-full border border-[var(--app-card-border)] bg-[var(--app-card-bg)] px-3 py-1.5 hover:bg-[var(--app-gray)] transition-colors"
          title={`Current theme: ${getThemeLabel()}. Click to cycle through themes.`}
        >
          {getThemeIcon()}
          <span className="text-xs text-[var(--app-foreground)]">{getThemeLabel()}</span>
        </button>
        {process.env.NEXT_PUBLIC_ENV === "development" && (
          <div className="flex items-center gap-2">
            {/* Theme toggle button */}

            {/* Streaming platforms + live status pill */}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-full border border-[var(--app-card-border)] bg-[var(--app-card-bg)] px-3 py-1.5 hover:bg-[var(--app-gray)] transition-colors"
            >
              <div className="flex -space-x-1">
                {platforms.slice(0, 3).map((p) => (
                  <span
                    key={p.id}
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ring-1 ring-white ${p.connected ? "opacity-100" : "opacity-40"}`}
                    title={`${p.name}${p.live ? " • live" : p.connected ? " • connected" : " • connect"}`}
                  >
                    {p.icon}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span className={`text-xs ${isAnyLive ? "text-red-500" : "text-[var(--app-foreground-muted)]"}`}>
                  {isAnyLive ? "LIVE" : "offline"}
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-transparent backdrop-blur-sm top-[-10rem] left-0">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md mx-auto border border-[var(--app-card-border)] rounded-t-2xl sm:rounded-2xl shadow-xl p-4 bg-background">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold">Connect streaming platforms</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-xl px-2 py-1 hover:bg-gray-100 rounded">✕</button>
            </div>

            <div className="space-y-2">
              {platforms.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-[var(--app-card-border)] p-3 bg-background">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 grid place-items-center text-base rounded-full bg-[var(--app-gray)]">
                      {p.icon}
                    </span>
                    <div className="text-sm">
                      <div className="font-medium text-foreground">{p.name}</div>
                      <div className="text-[10px] text-[var(--app-foreground-muted)]">
                        {p.live ? "live now" : p.connected ? "connected" : "not connected"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPlatforms((prev) =>
                        prev.map((x) =>
                          x.id === p.id ? { ...x, connected: !x.connected, live: x.live && !x.connected ? x.live : false } : x,
                        ),
                      )
                    }
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${p.connected
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-transparent hover:bg-gray-100"
                      }`}
                  >
                    {p.connected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-[11px] text-[var(--app-foreground-muted)]">
                Toggle a platform to connect; going live will reflect here.
              </div>
              <button
                type="button"
                className="text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-100 transition-colors"
                onClick={() => setShowModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


