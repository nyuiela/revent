"use client"
import { MapPin, Home } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

const Footer = () => {
  const router = useRouter()
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
      }, 250)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current)
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (

    <footer className={`pt-4 flex justify-center items-center w-full bg-transparent border-none flex-col fixed bottom-0 transition-transform duration-300 ease-out will-change-transform ${isHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
      {/* <StreamHeader /> */}
      {/* <div className="w-full flex justify-start px-4 p-2 items-center bg-transparent border-none">
        Menu
      </div> */}
      <div className="px-4 flex justify-center items-center border-none border-gray-00 bg-gray-000 w-[90%] p-2 gap-4 overflow-x-auto mx-10 bg-transparent ">

        <div className="h-10 w-fit px-4 flex justify-center items-center border-[1px] border-gray-300 rounded-full bg-gray-000  bg-background dark:border-gray-500 shrink-0 gap-2 shadow-xl" onClick={() => router.push('/')}>
          <Home className="w-4 h-4" />
          Home
        </div>
        {/* <div className="h-10 w-fit px-4 flex justify-center items-center border-[1px] border-gray-300 rounded-full bg-gray-000  bg-transparent dark:border-gray-500 shrink-0 gap-2">
          <Video className="w-4 h-4" />
          Go live
        </div> */}
        <Link href="/e" className="h-10 w-fit px-4 flex justify-center items-center border-[1px] border-gray-300 rounded-full bg-gray-000  bg-background dark:border-gray-500 shrink-0 gap-2 shadow-xl">
          <MapPin className="w-4 h-4" />
          Events
        </Link>
        {/* <div className="h-10 w-fit px-4 flex justify-center items-center border-[1px] border-gray-300 rounded-full bg-gray-000  bg-transparent dark:border-gray-500 shrink-0 gap-2">
          <Users className="w-4 h-4" />
          Streamers
        </div>
        <div className="h-10 w-fit px-4 flex justify-center items-center border-[1px] border-gray-300 rounded-full bg-gray-000  bg-transparent dark:border-gray-500 shrink-0 gap-2">
          <Calendar className="w-4 h-4" />
          Schedule
        </div>
        <div className="h-10 w-fit px-4 flex justify-center items-center border-[1px] border-gray-300 rounded-full bg-gray-000  bg-transparent dark:border-gray-500 shrink-0 gap-2">
          <Star className="w-4 h-4" />
          Featured
        </div>
        <div className="h-10 w-fit px-4 flex justify-center items-center border-[1px] border-gray-300 rounded-full bg-gray-000  bg-transparent dark:border-gray-500 shrink-0 gap-2">
          <Heart className="w-4 h-4" />
          Favorites
        </div> */}
      </div>
      {/* <Button
      variant="ghost"
      size="sm"
      className="text-[var(--ock-text-foreground-muted)] text-xs"
      onClick={() => openUrl("https://base.org/builders/minikit")}
    >
      Built on Base with MiniKit
    </Button> */}
    </footer>
  )
}

export default Footer