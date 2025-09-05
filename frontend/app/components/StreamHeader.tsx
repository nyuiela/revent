"use client";

import { useState } from "react";
import {
   Eye,
   X,
   Sun,
   Moon,
   Monitor
} from "lucide-react";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useTheme } from "next-themes";

type Platform = {
   id: string;
   name: string;
   icon: React.ReactNode;
   connected: boolean;
   live: boolean;
};

export default function StreamHeader() {
   const [showModal, setShowModal] = useState(false);
   const { theme, setTheme } = useTheme();
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
               {/* <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--app-card-bg)] border border-[var(--app-card-border)] text-sm cursor-pointer hover:bg-[var(--app-gray)] transition-colors">
            <User className="w-4 h-4 text-[var(--app-accent)]" />
            <span className="text-[var(--app-foreground)]">Connect Wallet</span>
          </div> */}
               <ConnectWallet className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--app-card-bg)] border border-[var(--app-card-border)] text-sm cursor-pointer hover:bg-[var(--app-gray)] transition-colors *:text-foreground" />
            </div>

            {/* Center section with theme toggle and streaming platforms */}
            <div className="flex items-center gap-2">
               {/* Theme toggle button */}
               <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 rounded-full border border-[var(--app-card-border)] bg-[var(--app-card-bg)] px-3 py-1.5 hover:bg-[var(--app-gray)] transition-colors"
                  title={`Current theme: ${getThemeLabel()}. Click to cycle through themes.`}
               >
                  {getThemeIcon()}
                  <span className="text-xs text-[var(--app-foreground)]">{getThemeLabel()}</span>
               </button>
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
         </div>

      </>
   );
}


