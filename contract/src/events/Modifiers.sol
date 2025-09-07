// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Storage.sol";

abstract contract EventModifiers is EventStorage {
    modifier eventExists(uint256 eventId) {
        require(events[eventId].creator != address(0), "Event does not exist");
        _;
    }

    modifier onlyEventCreator(uint256 eventId) {
        require(events[eventId].creator == msg.sender, "Only event creator can perform this action");
        _;
    }

    modifier eventIsActive(uint256 eventId) {
        require(events[eventId].isActive, "Event is not active");
        _;
    }

    modifier eventNotFull(uint256 eventId) {
        require(events[eventId].currentAttendees < events[eventId].maxAttendees, "Event is full");
        _;
    }

    modifier notAlreadyRegistered(uint256 eventId) {
        require(attendees[eventId][msg.sender].attendeeAddress == address(0), "Already registered for this event");
        _;
    }

    modifier validRegistrationFee(uint256 fee) {
        require(fee >= minRegistrationFee && fee <= maxRegistrationFee, "Invalid registration fee");
        _;
    }
}


