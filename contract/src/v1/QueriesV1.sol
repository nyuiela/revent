// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TicketsV1.sol";

abstract contract QueriesV1 is TicketsV1 {
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
}
