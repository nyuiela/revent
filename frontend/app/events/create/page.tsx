'use client'
import CreateEventForm from '@/app/components/CreateEventForm'
import CreateEventBottomSheet from '@/components/CreateEventBottomSheet'
import React, { useState } from 'react'



const CreateEventPage = () => {
  // return <CreateEventForm />
  const [open, setOpen] = useState(true);
  return <CreateEventBottomSheet open={open} onOpenChange={setOpen} />
}

export default CreateEventPage
