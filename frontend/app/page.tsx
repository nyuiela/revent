"use client";

import {
  useMiniKit,
} from "@coinbase/onchainkit/minikit";
import { useEffect, useState } from "react";
import { Features } from "./components/DemoComponents";
import StreamHome from "./components/StreamHome";
import WaitlistModal from "./components/WaitlistModal";
// import Footer from "./components/footer";
import { MobileNavigation } from "./components/mobileNavigation";
import EventsPage from "./events/page";
import EarnPage from "./earn/page";
import ProfilePage from "./profile/page";
import { useRouter } from "next/navigation";
import { useBannerToast } from "@/contexts/BannerToastContext";



export default function App() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  // const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [showWaitlist, setShowWaitlist] = useState(false);
  const router = useRouter();
  const { showBannerPersistent, hideBanner } = useBannerToast();
  showBannerPersistent("Beta launch");
  // hideBanner();
  // const addFrame = useAddFrame();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Check if user is first-time visitor
  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedStream");
    if (!hasVisited) {
      setShowWaitlist(true);
    }
  }, []);

  // const handleAddFrame = useCallback(async () => {
  //   const frameAdded = await addFrame();
  //   setFrameAdded(Boolean(frameAdded));
  // }, [addFrame]);

  const handleCloseWaitlist = () => {
    setShowWaitlist(false);
    // Mark user as having visited even if they don't join
    localStorage.setItem("hasVisitedStream", "true");
  };

  // const saveFrameButton = useMemo(() => {
  //   if (context && !context.client.added) {
  //     return (
  //       <Button
  //         variant="ghost"
  //         size="sm"
  //         onClick={handleAddFrame}
  //         className="text-[var(--app-accent)] p-4"
  //         icon={<Icon name="plus" size="sm" />}
  //       >
  //         Save Frame
  //       </Button>
  //     );
  //   }

  //   if (frameAdded) {
  //     return (
  //       <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
  //         <Icon name="check" size="sm" className="text-[#0052FF]" />
  //         <span>Saved</span>
  //       </div>
  //     );
  //   }

  //   return null;
  // }, [context, frameAdded, handleAddFrame]);
  useEffect(() => {
    if (activeTab === "Create") {
      router.push("/events/create");
    }
  }, [activeTab, router]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Revent",
            "description": "Discover, create, and attend onchain events. Earn tokens by participating in blockchain events, streaming, and contributing to the decentralized ecosystem.",
            "url": "https://revents.io",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "creator": {
              "@type": "Organization",
              "name": "Revent Team",
              "url": "https://revents.io"
            },
            "featureList": [
              "Create onchain events",
              "Discover blockchain events",
              "Earn token rewards",
              "Event streaming",
              "NFT attendance verification",
              "Decentralized event management"
            ],
            "screenshot": "https://revents.io/hero.png",
            "softwareVersion": "1.0",
            "datePublished": "2024-01-01",
            "dateModified": new Date().toISOString(),
            "inLanguage": "en-US",
            "isAccessibleForFree": true,
            "browserRequirements": "Requires JavaScript. Requires HTML5.",
            "softwareRequirements": "Any modern web browser",
            "permissions": "camera, microphone (for event streaming)"
          })
        }}
      />

      {/* <div className="w-fit max-w-xs mx-auto p-2 fixed bottom-20 left-0 right-0 z-50 bg-emerald-500 rounded-2xl text-[11px] px-4">
        hello world
      </div> */}

      <div className="w-full max-w-md mx-auto p-0 ">
        <header className="flex justify-between items-center mb-0 h-0">
          <div>
            <div className="flex items-center space-x-2">
              {/* Wallet connect moved to StreamHeader */}
            </div>
          </div>
          {/* <div>{saveFrameButton}</div> */}
        </header>

        <main className="flex-1">
          {activeTab === "Home" && <StreamHome />}
          {activeTab === "Events" && <EventsPage />}
          {activeTab === "Wallet" && <ProfilePage />}
          {activeTab === "Earn" && <EarnPage />}
          {/* {activeTab === "Create" && <div onClick={() => router.push("/create")}>Create</div>} */}
          {/* {activeTab === "Earn" && <EarnPage />} */}
        </main>
      </div>
      {/* <Footer /> */}
      <MobileNavigation setActiveTab={setActiveTab} sActiveTab={activeTab} />
      {showWaitlist && (
        <WaitlistModal
          isOpen={showWaitlist}
          onClose={handleCloseWaitlist}
        />
      )}
    </div>
  );
}
