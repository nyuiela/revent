import {
  ApprovalForAll as ApprovalForAllEvent,
  Initialized as InitializedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  TicketCreated as TicketCreatedEvent,
  TicketPurchased as TicketPurchasedEvent,
  TicketUpdated as TicketUpdatedEvent,
  TransferBatch as TransferBatchEvent,
  TransferSingle as TransferSingleEvent,
  URI as URIEvent,
  Unpaused as UnpausedEvent,
} from "../generated/TicketsV1/TicketsV1"
import {
  ApprovalForAll,
  Initialized,
  OwnershipTransferred,
  Paused,
  TicketCreated,
  TicketPurchased,
  TicketUpdated,
  TransferBatch,
  TransferSingle,
  URI,
  Unpaused,
} from "../generated/schema"

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account
  entity.operator = event.params.operator
  entity.approved = event.params.approved

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent,
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
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
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTicketCreated(event: TicketCreatedEvent): void {
  let entity = new TicketCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.ticketId = event.params.ticketId
  entity.eventId = event.params.eventId
  entity.creator = event.params.creator
  entity.name = event.params.name
  entity.ticketType = event.params.ticketType
  entity.price = event.params.price
  entity.currency = event.params.currency
  entity.totalQuantity = event.params.totalQuantity
  entity.perks = event.params.perks

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTicketPurchased(event: TicketPurchasedEvent): void {
  let entity = new TicketPurchased(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.ticketId = event.params.ticketId
  entity.eventId = event.params.eventId
  entity.buyer = event.params.buyer
  entity.quantity = event.params.quantity
  entity.totalPrice = event.params.totalPrice
  entity.currency = event.params.currency

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTicketUpdated(event: TicketUpdatedEvent): void {
  let entity = new TicketUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.ticketId = event.params.ticketId
  entity.name = event.params.name
  entity.ticketType = event.params.ticketType
  entity.price = event.params.price
  entity.currency = event.params.currency
  entity.totalQuantity = event.params.totalQuantity
  entity.perks = event.params.perks
  entity.isActive = event.params.isActive

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  let entity = new TransferBatch(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
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
    event.transaction.hash.concatI32(event.logIndex.toI32()),
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
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
