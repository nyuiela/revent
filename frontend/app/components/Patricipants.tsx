import { EventParticipant } from '@/utils/types'
import React from 'react'

const Patricipants = ({ participants }: { participants: EventParticipant[] }) => {
  return (
    <div>
      {participants.map((participant) => (
        <div className='w-full p-4 px-1 pt-2 pb-0 border-none' key={participant.id}>{participant.name}</div>
      ))}
    </div>
  )
}

export default Patricipants