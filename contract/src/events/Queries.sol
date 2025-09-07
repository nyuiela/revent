// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Modifiers.sol";
import "./Types.sol";
import "../utils/counter.sol";

abstract contract EventQueries is EventModifiers {
    function getEvent(uint256 eventId) external view eventExists(eventId) returns (EventTypes.EventData memory) {
        return events[eventId];
    }

    function getCreatorEvents(address creator) external view returns (uint256[] memory) {
        return creatorEvents[creator];
    }

    function getEventAttendees(uint256 eventId) external view eventExists(eventId) returns (address[] memory) {
        return eventAttendees[eventId];
    }

    function getAttendee(uint256 eventId, address attendeeAddress) external view returns (EventTypes.AttendeeData memory) {
        return attendees[eventId][attendeeAddress];
    }

    function getTotalEvents() external view returns (uint256) {
        return Counters.current(_eventIds);
    }

    function isRegisteredForEvent(uint256 eventId, address attendeeAddress) external view returns (bool) {
        return attendees[eventId][attendeeAddress].attendeeAddress != address(0);
    }

    // Ticket queries
    function getEventTickets(uint256 eventId) external view eventExists(eventId) returns (uint256[] memory) {
        return eventTickets[eventId];
    }

    function getTicket(uint256 ticketId) external view returns (EventTypes.TicketData memory) {
        return tickets[ticketId];
    }

}


