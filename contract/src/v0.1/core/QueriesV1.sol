// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// import "./TicketsV1.sol";
import "./ModifiersV1.sol";
import "./Events.sol";
import "./ModifiersV1.sol";

contract QueriesV1 is EventModifiersV1 {
    function getEvent(uint256 eventId) external view returns (EventTypes.EventData memory) {
        require(events[eventId].eventId != 0, "Event does not exist");
        return events[eventId];
    }

    function getEventAttendees(uint256 eventId) external view returns (address[] memory) {
        require(events[eventId].eventId != 0, "Event does not exist");
        return eventAttendees[eventId];
    }

    function getAttendeeData(uint256 eventId, address attendee) external view returns (EventTypes.AttendeeData memory) {
        require(events[eventId].eventId != 0, "Event does not exist");
        return attendees[eventId][attendee];
    }

    function getCreatorEvents(address creator) external view returns (uint256[] memory) {
        return creatorEvents[creator];
    }

    function getEventCount() external view returns (uint256) {
        return Counters.current(_eventIds);
    }

    function getAttendeeCount(uint256 eventId) external view returns (uint256) {
        require(events[eventId].eventId != 0, "Event does not exist");
        return eventAttendees[eventId].length;
    }

    function isAttendee(uint256 eventId, address attendee) external view returns (bool) {
        require(events[eventId].eventId != 0, "Event does not exist");
        return attendees[eventId][attendee].attendeeAddress != address(0);
    }

    function isEventActive(uint256 eventId) external view returns (bool) {
        require(events[eventId].eventId != 0, "Event does not exist");
        return events[eventId].isActive;
    }

    function isEventLive(uint256 eventId) external view returns (bool) {
        require(events[eventId].eventId != 0, "Event does not exist");
        return events[eventId].isLive;
    }

    function getEventStatus(uint256 eventId) external view returns (EventTypes.EventStatus) {
        require(events[eventId].eventId != 0, "Event does not exist");
        return events[eventId].status;
    }

    function getPlatformFee() external view returns (uint256) {
        return platformFee;
    }

    function getFeeRecipient() external view returns (address) {
        return feeRecipient;
    }

    function getRegistrationFeeLimits() external view returns (uint256, uint256) {
        return (minRegistrationFee, maxRegistrationFee);
    }

    function getTrustedForwarder() external view returns (address) {
        return trustedForwarderAddr;
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
    function getEventTickets(uint256 eventId) external view virtual eventExists(eventId) returns (uint256[] memory) {
        return eventTickets[eventId];
    }

    function getTicket(uint256 ticketId) external view virtual returns (EventTypes.TicketData memory) {
        return tickets[ticketId];
    }

}
 