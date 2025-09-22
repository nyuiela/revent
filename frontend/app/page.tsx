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


export default function App() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  // const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [showWaitlist, setShowWaitlist] = useState(false);
  const router = useRouter();
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
