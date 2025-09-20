import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Initialized,
  OwnershipTransferred,
  Paused,
  TicketCreated,
  TicketPurchased,
  TicketUpdated,
  Unpaused
} from "../generated/TicketsV1/TicketsV1"

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

export function createTicketCreatedEvent(
  ticketId: BigInt,
  eventId: BigInt,
  creator: Address,
  name: string,
  ticketType: string,
  price: BigInt,
  currency: string,
  totalQuantity: BigInt,
  perks: Array<string>
): TicketCreated {
  let ticketCreatedEvent = changetype<TicketCreated>(newMockEvent())

  ticketCreatedEvent.parameters = new Array()

  ticketCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "ticketId",
      ethereum.Value.fromUnsignedBigInt(ticketId)
    )
  )
  ticketCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "eventId",
      ethereum.Value.fromUnsignedBigInt(eventId)
    )
  )
  ticketCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  ticketCreatedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  ticketCreatedEvent.parameters.push(
    new ethereum.EventParam("ticketType", ethereum.Value.fromString(ticketType))
  )
  ticketCreatedEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )
  ticketCreatedEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromString(currency))
  )
  ticketCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "totalQuantity",
      ethereum.Value.fromUnsignedBigInt(totalQuantity)
    )
  )
  ticketCreatedEvent.parameters.push(
    new ethereum.EventParam("perks", ethereum.Value.fromStringArray(perks))
  )

  return ticketCreatedEvent
}

export function createTicketPurchasedEvent(
  ticketId: BigInt,
  eventId: BigInt,
  buyer: Address,
  quantity: BigInt,
  totalPrice: BigInt,
  currency: string
): TicketPurchased {
  let ticketPurchasedEvent = changetype<TicketPurchased>(newMockEvent())

  ticketPurchasedEvent.parameters = new Array()

  ticketPurchasedEvent.parameters.push(
    new ethereum.EventParam(
      "ticketId",
      ethereum.Value.fromUnsignedBigInt(ticketId)
    )
  )
  ticketPurchasedEvent.parameters.push(
    new ethereum.EventParam(
      "eventId",
      ethereum.Value.fromUnsignedBigInt(eventId)
    )
  )
  ticketPurchasedEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  ticketPurchasedEvent.parameters.push(
    new ethereum.EventParam(
      "quantity",
      ethereum.Value.fromUnsignedBigInt(quantity)
    )
  )
  ticketPurchasedEvent.parameters.push(
    new ethereum.EventParam(
      "totalPrice",
      ethereum.Value.fromUnsignedBigInt(totalPrice)
    )
  )
  ticketPurchasedEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromString(currency))
  )

  return ticketPurchasedEvent
}

export function createTicketUpdatedEvent(
  ticketId: BigInt,
  name: string,
  ticketType: string,
  price: BigInt,
  currency: string,
  totalQuantity: BigInt,
  perks: Array<string>,
  isActive: boolean
): TicketUpdated {
  let ticketUpdatedEvent = changetype<TicketUpdated>(newMockEvent())

  ticketUpdatedEvent.parameters = new Array()

  ticketUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "ticketId",
      ethereum.Value.fromUnsignedBigInt(ticketId)
    )
  )
  ticketUpdatedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  ticketUpdatedEvent.parameters.push(
    new ethereum.EventParam("ticketType", ethereum.Value.fromString(ticketType))
  )
  ticketUpdatedEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )
  ticketUpdatedEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromString(currency))
  )
  ticketUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "totalQuantity",
      ethereum.Value.fromUnsignedBigInt(totalQuantity)
    )
  )
  ticketUpdatedEvent.parameters.push(
    new ethereum.EventParam("perks", ethereum.Value.fromStringArray(perks))
  )
  ticketUpdatedEvent.parameters.push(
    new ethereum.EventParam("isActive", ethereum.Value.fromBoolean(isActive))
  )

  return ticketUpdatedEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}
