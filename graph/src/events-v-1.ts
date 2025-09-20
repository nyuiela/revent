import {
  ApprovalForAll as ApprovalForAllEvent,
  AttendeeAttended as AttendeeAttendedEvent,
  AttendeeConfirmed as AttendeeConfirmedEvent,
  AttendeeRegistered as AttendeeRegisteredEvent,
  EventCreated as EventCreatedEvent,
  EventStatusChanged as EventStatusChangedEvent,
  EventUpdated as EventUpdatedEvent,
  Initialized as InitializedEvent,
  ModuleUpdated as ModuleUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  TransferBatch as TransferBatchEvent,
  TransferSingle as TransferSingleEvent,
  URI as URIEvent,
  Unpaused as UnpausedEvent
} from "../generated/EventsV1/EventsV1"
import {
  ApprovalForAll,
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
  TransferBatch,
  TransferSingle,
  URI,
  Unpaused
} from "../generated/schema"

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account
  entity.operator = event.params.operator
  entity.approved = event.params.approved

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAttendeeAttended(event: AttendeeAttendedEvent): void {
  let entity = new AttendeeAttended(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.eventId = event.params.eventId
  entity.attendee = event.params.attendee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAttendeeConfirmed(event: AttendeeConfirmedEvent): void {
  let entity = new AttendeeConfirmed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.eventId = event.params.eventId
  entity.attendee = event.params.attendee
  entity.confirmationCode = event.params.confirmationCode

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAttendeeRegistered(event: AttendeeRegisteredEvent): void {
  let entity = new AttendeeRegistered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.eventId = event.params.eventId
  entity.attendee = event.params.attendee
  entity.confirmationCode = event.params.confirmationCode
  entity.fee = event.params.fee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleEventCreated(event: EventCreatedEvent): void {
  let entity = new EventCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.eventId = event.params.eventId
  entity.creator = event.params.creator
  entity.ipfsHash = event.params.ipfsHash
  entity.startTime = event.params.startTime
  entity.endTime = event.params.endTime
  entity.maxAttendees = event.params.maxAttendees
  entity.registrationFee = event.params.registrationFee
  entity.slug = event.params.slug

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleEventStatusChanged(event: EventStatusChangedEvent): void {
  let entity = new EventStatusChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.eventId = event.params.eventId
  entity.oldStatus = event.params.oldStatus
  entity.newStatus = event.params.newStatus

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleEventUpdated(event: EventUpdatedEvent): void {
  let entity = new EventUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.eventId = event.params.eventId
  entity.ipfsHash = event.params.ipfsHash
  entity.startTime = event.params.startTime
  entity.endTime = event.params.endTime
  entity.maxAttendees = event.params.maxAttendees

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleModuleUpdated(event: ModuleUpdatedEvent): void {
  let entity = new ModuleUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.moduleType = event.params.moduleType
  entity.oldModule = event.params.oldModule
  entity.newModule = event.params.newModule

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new Paused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  let entity = new TransferBatch(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.operator = event.params.operator
  entity.from = event.params.from
  entity.to = event.params.to
  entity.ids = event.params.ids
  entity.values = event.params.values

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransferSingle(event: TransferSingleEvent): void {
  let entity = new TransferSingle(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.operator = event.params.operator
  entity.from = event.params.from
  entity.to = event.params.to
  entity.internal_id = event.params.id
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleURI(event: URIEvent): void {
  let entity = new URI(event.transaction.hash.concatI32(event.logIndex.toI32()))
  entity.value = event.params.value
  entity.internal_id = event.params.id

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new Unpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
