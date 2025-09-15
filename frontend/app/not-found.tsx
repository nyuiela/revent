"use client"
import React from 'react'
import notFoundImage from '../public/not-found.svg'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
const NotFound = () => {
  const router = useRouter()
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <Image src={notFoundImage} alt="notFound" />
      <h1 className='text-2xl font-bold'>Page Not Found</h1>
      <p className='text-sm text-gray-500'>The page you are looking for does not exist.</p>
      <button className='bg-blue-500 text-white px-4 py-2 rounded-md' onClick={() => router.back()}>Go Back</button>
    </div>

  )
}

export default NotFound