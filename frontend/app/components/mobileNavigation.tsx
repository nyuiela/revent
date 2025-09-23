"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AppIcons } from "@/lib/assets";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { CalendarDays, Gift, Home, WalletCards } from "lucide-react";

interface TabProps {
  name: string;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  path: string;
  isActive: boolean;
  setActiveTab: (tab: string) => void;
}

function Tab({ name, activeIcon, inactiveIcon, path, isActive, setActiveTab }: TabProps) {

  return (
    <div
      // href={path}
      className={`h-10 relative shrink-0 w-[62.5px] flex flex-col items-center justify-center ${name === "Create" ? "w-[80px] absolute bottom-[1rem] bg-foreground rounded-full p-4 h-12 flex items-center justify-center shadow-2xl border-t-4 border-white dark:border-gray-800" : ""}`}
      onClick={() => setActiveTab(name)}
    >
      {name === "Create" && <div className="absolute text-background font-bold">Create</div>}
      {name !== "Create" && <div className="absolute aspect-[24/24] bottom-[41.25%] top-[-1.25%] translate-x-[-50%]" style={{ left: "calc(50% - 0.25px)" }}>
        {/* <Image
          src={isActive ? activeIcon : inactiveIcon}
          alt={name}
          width={24}
          height={24}
          className={cn(
            "transition-colors",
            isActive ? "text-foreground" : "text-foreground-muted"
          )}
        /> */}
        {isActive ? activeIcon : inactiveIcon}
      </div>}

      {name !== "Create" && <div className="absolute font-nunito-sans inset-[70%_-1.04%_-5%_-1.04%] leading-[0] text-[10px] text-center">
        <p className={cn(
          "leading-[normal] font-medium",
          isActive
            ? "text-foreground"
            : "text-muted-foreground"
        )}>
          {name}
        </p>
      </div>}
    </div>
  );
}

export function MobileNavigation({ setActiveTab, sActiveTab }: { setActiveTab: (tab: string) => void, sActiveTab: string }) {
  const pathname = usePathname();
  const [isHidden, setIsHidden] = useState(false)
  const hideTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsHidden(true)
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current)
      }
      hideTimeoutRef.current = window.setTimeout(() => {
        setIsHidden(false)
      }, 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current)
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const menuItems = [
    {
      name: "Home",
      // activeIcon: AppIcons.homeActive,
      activeIcon: <Home className="text-foreground" color="#000" />,
      // inactiveIcon: AppIcons.homeInactive,
      inactiveIcon: <Home className="text-foreground-muted" fill="transparent" color="#9CA3AF" />,
      path: "/",
    },
    {
      name: "Events",
      activeIcon: <CalendarDays fill="transparent" className="bg-transparent" color="#000" />,
      inactiveIcon: <CalendarDays className="text-foreground-muted" fill="transparent" color="#9CA3AF" />,
      path: "/events",
    },
    {
      name: "Create",
      activeIcon: AppIcons.betActive,
      inactiveIcon: AppIcons.betInactive,
      path: "/create",
    },
    {
      name: "Earn",
      activeIcon: <Gift className="bg-transparent" color="#000" />,
      inactiveIcon: <Gift className="text-foreground-muted" fill="transparent" color="#9CA3AF" />,
      path: "/earn",
    },
    {
      name: "Wallet",
      activeIcon: <WalletCards className="bg-transparent" color="#000" />,
      inactiveIcon: <WalletCards className="text-foreground-muted" fill="transparent" color="#9CA3AF" />,
      // inactiveIcon: AppIcons.walletInactive,
      path: "/profile",
    },
  ];

  // ${isHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto p-0 shadow-2xl bg-background border-t border-border
     `}>
      <div className="relative backdrop-blur-[20px] backdrop-filter bg-muted">
        <div className="flex items-start justify-between px-4 py-2">
          {menuItems.map((item) => {
            const isActive = sActiveTab === item.name;
            return (
              <Tab
                key={item.name}
                name={item.name}
                activeIcon={item.activeIcon}
                inactiveIcon={item.inactiveIcon}
                path={item.path}
                isActive={isActive}
                setActiveTab={() => {
                  setActiveTab(item.name)
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}