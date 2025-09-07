// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../utils/counter.sol";
import "./Modifiers.sol";
import "./Events.sol";
import "./Types.sol";

abstract contract EventTickets is ReentrancyGuard, EventModifiers {
    using Counters for Counters.Counter;

    function addTicket(
        uint256 eventId,
        string memory name,
        string memory ticketType,
        uint256 price,
        string memory currency,
        uint256 totalQuantity,
        string[] memory perks
    ) external eventExists(eventId) onlyEventCreator(eventId) returns (uint256) {
        _ticketIds.increment();
        uint256 ticketId = _ticketIds.current();

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

        emit EventEvents.TicketAdded(eventId, ticketId, name, ticketType, price, currency, totalQuantity);
        return ticketId;
    }

    function updateTicket(
        uint256 eventId,
        uint256 ticketId,
        string memory name,
        string memory ticketType,
        uint256 price,
        string memory currency,
        uint256 totalQuantity,
        bool isActive
    ) external eventExists(eventId) onlyEventCreator(eventId) {
        EventTypes.TicketData storage t = tickets[ticketId];
        require(t.eventId == eventId, "Ticket not for event");
        require(totalQuantity == 0 || totalQuantity >= t.soldQuantity, "Total < sold");

        t.name = name;
        t.ticketType = ticketType;
        t.price = price;
        t.currency = currency;
        t.totalQuantity = totalQuantity;
        t.isActive = isActive;
        t.updatedAt = block.timestamp;

        emit EventEvents.TicketUpdated(eventId, ticketId, name, ticketType, price, currency, totalQuantity, isActive);
    }

    function removeTicket(uint256 eventId, uint256 ticketId) external eventExists(eventId) onlyEventCreator(eventId) {
        EventTypes.TicketData storage t = tickets[ticketId];
        require(t.eventId == eventId, "Ticket not for event");
        t.isActive = false;
        t.updatedAt = block.timestamp;
        emit EventEvents.TicketRemoved(eventId, ticketId);
    }

    function buyTicket(uint256 eventId, uint256 ticketId)
        external
        payable
        nonReentrant
        eventExists(eventId)
        eventIsActive(eventId)
    {
        EventTypes.TicketData storage t = tickets[ticketId];
        require(t.eventId == eventId, "Invalid ticket");
        require(t.isActive, "Ticket inactive");
        if (t.totalQuantity != 0) {
            require(t.soldQuantity < t.totalQuantity, "Sold out");
        }

        uint256 price = t.price; // 0 => free
        if (price == 0) {
            require(msg.value == 0, "No payment for free ticket");
        } else {
            require(msg.value == price, "Incorrect price");
            uint256 platformFeeAmount = (msg.value * platformFee) / 10000;
            uint256 creatorAmount = msg.value - platformFeeAmount;
            address recipient = feeRecipient == address(0) ? _owner() : feeRecipient;
            payable(recipient).transfer(platformFeeAmount);
            payable(events[eventId].creator).transfer(creatorAmount);
        }

        t.soldQuantity += 1;
        purchasedTicketCounts[eventId][msg.sender] += 1;

        // Auto-register attendee if not registered
        if (attendees[eventId][msg.sender].attendeeAddress == address(0)) {
            // mimic registerForEvent but free
            string memory code = _generateConfirmationCode(eventId, msg.sender);
            attendees[eventId][msg.sender] = EventTypes.AttendeeData({
                attendeeAddress: msg.sender,
                eventId: eventId,
                confirmationCode: code,
                isConfirmed: false,
                hasAttended: false,
                registeredAt: block.timestamp,
                confirmedAt: 0
            });
            events[eventId].currentAttendees++;
            eventAttendees[eventId].push(msg.sender);
        }

        emit EventEvents.TicketPurchased(eventId, ticketId, msg.sender, price);
    }

    function _generateConfirmationCode(uint256 eventId, address attendee) internal virtual returns (string memory);
    function _owner() internal view virtual returns (address);
}



