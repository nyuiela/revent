// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {EventModifiersV1} from "./ModifiersV1.sol";
import {EventEvents} from "./Events.sol";
import {EventTypes} from "../structs/Types.sol";
import {Counters} from "../utils/counter.sol";
contract TicketsV1 is EventModifiersV1  {
    function __TicketsV1_init() internal onlyInitializing {}

    function createTicket(
        uint256 eventId,
        string memory name,
        string memory ticketType,
        uint256 price,
        string memory currency,
        uint256 totalQuantity,
        string[] memory perks
    ) external eventExists(eventId) onlyEventCreator(eventId) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(ticketType).length > 0, "Ticket type cannot be empty");
        require(price >= 0, "Price cannot be negative");
        require(totalQuantity > 0, "Total quantity must be greater than 0");

        Counters.increment(_ticketIds);
        uint256 ticketId = Counters.current(_ticketIds);

        tickets[ticketId] = EventTypes.TicketData({
            ticketId: ticketId,
            eventId: eventId,
            name: name,
            ticketType: ticketType,
            price: price,
            currency: currency,
            totalQuantity: totalQuantity,
            soldQuantity: 0,
            perks: perks,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        eventTickets[eventId].push(ticketId);

        // If this is a paid ticket and event is VIP, create escrow
        if (price > 0 && events[eventId].isVIP && escrows[eventId].createdAt == 0) {
            uint256 expectedAmount = price * totalQuantity;
            createEscrow(eventId, expectedAmount);
        }

        emit EventEvents.TicketAdded(
            eventId,
            ticketId,
            name,
            ticketType,
            price,
            currency,
            totalQuantity
        );
    }

    function purchaseTicket(
        uint256 ticketId,
        uint256 quantity
    ) external payable nonReentrant {
        require(
            ticketId > 0 && ticketId <= Counters.current(_ticketIds),
            "Invalid ticket ID"
        );
        require(quantity > 0, "Quantity must be greater than 0");

        EventTypes.TicketData storage ticket = tickets[ticketId];
        require(ticket.isActive, "Ticket is not active");
        require(
            ticket.soldQuantity + quantity <= ticket.totalQuantity,
            "Not enough tickets available"
        );

        uint256 totalPrice = ticket.price * quantity;
        require(msg.value >= totalPrice, "Insufficient payment");

        ticket.soldQuantity += quantity;
        purchasedTicketCounts[ticket.eventId][msg.sender] += quantity;

        // Handle payment based on ticket type
        if (ticket.price > 0) {
            // Paid ticket - use escrow system
            if (events[ticket.eventId].isVIP) {
                // Deposit into escrow for VIP events
                depositFundsWithAmount(ticket.eventId, totalPrice);
            } else {
                // Direct payment for non-VIP events
                uint256 platformFeeAmount = (totalPrice * platformFee) / 10000;
                uint256 creatorAmount = totalPrice - platformFeeAmount;

                address recipient = feeRecipient == address(0) ? owner() : feeRecipient;
                payable(recipient).transfer(platformFeeAmount);
                payable(events[ticket.eventId].creator).transfer(creatorAmount);
            }
        }
        // Free tickets (price = 0) don't require payment handling

        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        emit EventEvents.TicketPurchased(
            ticket.eventId,
            ticketId,
            msg.sender,
            totalPrice
        );
    }

    function updateTicket(
        uint256 ticketId,
        string memory name,
        string memory ticketType,
        uint256 price,
        string memory currency,
        uint256 totalQuantity,
        string[] memory perks,
        bool isActive
    ) external {
        require(
            ticketId > 0 && ticketId <= Counters.current(_ticketIds),
            "Invalid ticket ID"
        );
        require(
            events[tickets[ticketId].eventId].creator == msg.sender,
            "Not ticket creator"
        );

        EventTypes.TicketData storage ticket = tickets[ticketId];
        require(
            ticket.soldQuantity <= totalQuantity,
            "Cannot reduce quantity below sold amount"
        );

        ticket.name = name;
        ticket.ticketType = ticketType;
        ticket.price = price;
        ticket.currency = currency;
        ticket.totalQuantity = totalQuantity;
        ticket.perks = perks;
        ticket.isActive = isActive;
        ticket.updatedAt = block.timestamp;
    }

    function getEventTickets(
        uint256 eventId
    ) external view virtual returns (uint256[] memory) {
        return eventTickets[eventId];
    }

    function getTicket(
        uint256 ticketId
    ) external view virtual returns (EventTypes.TicketData memory) {
        require(
            ticketId > 0 && ticketId <= Counters.current(_ticketIds),
            "Invalid ticket ID"
        );
        return tickets[ticketId];
    }

    function getPurchasedTicketCount(
        uint256 eventId,
        address buyer
    ) external view returns (uint256) {
        return purchasedTicketCounts[eventId][buyer];
    }
}
