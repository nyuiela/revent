import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  AttendeeAttended,
  AttendeeConfirmed,
  AttendeeRegistered,
  EventCreated,
  EventStatusChanged,
  EventUpdated,
  Initialized,
  ModuleUpdated,
  OwnershipTransferred,
  Paused,
  Unpaused
} from "../generated/EventsV1/EventsV1"

export function createAttendeeAttendedEvent(
  eventId: BigInt,
  attendee: Address
): AttendeeAttended {
  let attendeeAttendedEvent = changetype<AttendeeAttended>(newMockEvent())

  attendeeAttendedEvent.parameters = new Array()

  attendeeAttendedEvent.parameters.push(
    new ethereum.EventParam(
      "eventId",
      ethereum.Value.fromUnsignedBigInt(eventId)
    )
  )
  attendeeAttendedEvent.parameters.push(
    new ethereum.EventParam("attendee", ethereum.Value.fromAddress(attendee))
  )

  return attendeeAttendedEvent
}

export function createAttendeeConfirmedEvent(
  eventId: BigInt,
  attendee: Address,
  confirmationCode: string
): AttendeeConfirmed {
  let attendeeConfirmedEvent = changetype<AttendeeConfirmed>(newMockEvent())

  attendeeConfirmedEvent.parameters = new Array()

  attendeeConfirmedEvent.parameters.push(
    new ethereum.EventParam(
      "eventId",
      ethereum.Value.fromUnsignedBigInt(eventId)
    )
  )
  attendeeConfirmedEvent.parameters.push(
    new ethereum.EventParam("attendee", ethereum.Value.fromAddress(attendee))
  )
  attendeeConfirmedEvent.parameters.push(
    new ethereum.EventParam(
      "confirmationCode",
      ethereum.Value.fromString(confirmationCode)
    )
  )

  return attendeeConfirmedEvent
}

export function createAttendeeRegisteredEvent(
  eventId: BigInt,
  attendee: Address,
  confirmationCode: string,
  fee: BigInt
): AttendeeRegistered {
  let attendeeRegisteredEvent = changetype<AttendeeRegistered>(newMockEvent())

  attendeeRegisteredEvent.parameters = new Array()

  attendeeRegisteredEvent.parameters.push(
    new ethereum.EventParam(
      "eventId",
      ethereum.Value.fromUnsignedBigInt(eventId)
    )
  )
  attendeeRegisteredEvent.parameters.push(
    new ethereum.EventParam("attendee", ethereum.Value.fromAddress(attendee))
  )
  attendeeRegisteredEvent.parameters.push(
    new ethereum.EventParam(
      "confirmationCode",
      ethereum.Value.fromString(confirmationCode)
    )
  )
  attendeeRegisteredEvent.parameters.push(
    new ethereum.EventParam("fee", ethereum.Value.fromUnsignedBigInt(fee))
  )

  return attendeeRegisteredEvent
}

export function createEventCreatedEvent(
  eventId: BigInt,
  creator: Address,
  ipfsHash: string,
  startTime: BigInt,
  endTime: BigInt,
  maxAttendees: BigInt,
  registrationFee: BigInt
): EventCreated {
  let eventCreatedEvent = changetype<EventCreated>(newMockEvent())

  eventCreatedEvent.parameters = new Array()

  eventCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "eventId",
      ethereum.Value.fromUnsignedBigInt(eventId)
    )
  )
  eventCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  eventCreatedEvent.parameters.push(
    new ethereum.EventParam("ipfsHash", ethereum.Value.fromString(ipfsHash))
  )
  eventCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "startTime",
      ethereum.Value.fromUnsignedBigInt(startTime)
    )
  )
  eventCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "endTime",
      ethereum.Value.fromUnsignedBigInt(endTime)
    )
  )
  eventCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "maxAttendees",
      ethereum.Value.fromUnsignedBigInt(maxAttendees)
    )
  )
  eventCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "registrationFee",
      ethereum.Value.fromUnsignedBigInt(registrationFee)
    )
  )

  return eventCreatedEvent
}

export function createEventStatusChangedEvent(
  eventId: BigInt,
  oldStatus: i32,
  newStatus: i32
): EventStatusChanged {
  let eventStatusChangedEvent = changetype<EventStatusChanged>(newMockEvent())

  eventStatusChangedEvent.parameters = new Array()

  eventStatusChangedEvent.parameters.push(
    new ethereum.EventParam(
      "eventId",
      ethereum.Value.fromUnsignedBigInt(eventId)
    )
  )
  eventStatusChangedEvent.parameters.push(
    new ethereum.EventParam(
      "oldStatus",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(oldStatus))
    )
  )
  eventStatusChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newStatus",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newStatus))
    )
  )

  return eventStatusChangedEvent
}

export function createEventUpdatedEvent(
  eventId: BigInt,
  ipfsHash: string,
  startTime: BigInt,
  endTime: BigInt,
  maxAttendees: BigInt
): EventUpdated {
  let eventUpdatedEvent = changetype<EventUpdated>(newMockEvent())

  eventUpdatedEvent.parameters = new Array()

  eventUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "eventId",
      ethereum.Value.fromUnsignedBigInt(eventId)
    )
  )
  eventUpdatedEvent.parameters.push(
    new ethereum.EventParam("ipfsHash", ethereum.Value.fromString(ipfsHash))
  )
  eventUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "startTime",
      ethereum.Value.fromUnsignedBigInt(startTime)
    )
  )
  eventUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "endTime",
      ethereum.Value.fromUnsignedBigInt(endTime)
    )
  )
  eventUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "maxAttendees",
      ethereum.Value.fromUnsignedBigInt(maxAttendees)
    )
  )

  return eventUpdatedEvent
}

export function createInitializedEvent(version: BigInt): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )

  return initializedEvent
}

export function createModuleUpdatedEvent(
  moduleType: string,
  oldModule: Address,
  newModule: Address
): ModuleUpdated {
  let moduleUpdatedEvent = changetype<ModuleUpdated>(newMockEvent())

  moduleUpdatedEvent.parameters = new Array()

  moduleUpdatedEvent.parameters.push(
    new ethereum.EventParam("moduleType", ethereum.Value.fromString(moduleType))
  )
  moduleUpdatedEvent.parameters.push(
    new ethereum.EventParam("oldModule", ethereum.Value.fromAddress(oldModule))
  )
  moduleUpdatedEvent.parameters.push(
    new ethereum.EventParam("newModule", ethereum.Value.fromAddress(newModule))
  )

  return moduleUpdatedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPausedEvent(account: Address): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return pausedEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}
