"use client"
import { Heart, Star, Calendar, MapPin, Users, Video, Home } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

const Footer = () => {
   const router = useRouter()
   return (

      <footer className="pt-4 flex justify-center items-center w-full bg-transparent border-none flex-col">
         {/* <StreamHeader /> */}
         <div className="w-full flex justify-start px-4 p-2 items-center bg-transparent border-none">
            Menu
         </div>
         <div className="px-4 flex justify-center items-center border-none border-gray-00 bg-gray-000 w-[90%] p-2 gap-4 overflow-x-auto mx-10 bg-transparent">

            <div className="h-10 w-fit px-4 flex justify-center items-center border-[1px] border-gray-300 rounded-full bg-gray-000  bg-transparent dark:border-gray-500 shrink-0 gap-2" onClick={() => router.push('/')}>
               <Home className="w-4 h-4" />
               Home
            </div>
            <div className="h-10 w-fit px-4 flex justify-center items-center border-[1px] border-gray-300 rounded-full bg-gray-000  bg-transparent dark:border-gray-500 shrink-0 gap-2">
               <Video className="w-4 h-4" />
               Go live
            </div>
            <Link href="/e" className="h-10 w-fit px-4 flex justify-center items-center border-[1px] border-gray-300 rounded-full bg-gray-000  bg-transparent dark:border-gray-500 shrink-0 gap-2">
               <MapPin className="w-4 h-4" />
               Events
            </Link>
            <div className="h-10 w-fit px-4 flex justify-center items-center border-[1px] border-gray-300 rounded-full bg-gray-000  bg-transparent dark:border-gray-500 shrink-0 gap-2">
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
            </div>
         </div>
      </footer>
   )
}

export default Footer