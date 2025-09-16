// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./StorageV1.sol";

abstract contract EventModifiersV1 is ReventStorage {
    modifier eventExists(uint256 eventId) {
        require(events[eventId].creator != address(0), "Event does not exist");
        _;
    }

    modifier onlyEventCreator(uint256 eventId) {
        require(events[eventId].creator == msg.sender, "Not event creator");
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
        require(attendees[eventId][msg.sender].attendeeAddress == address(0), "Already registered");
        _;
    }

    modifier validRegistrationFee(uint256 fee) {
        require(fee >= minRegistrationFee && fee <= maxRegistrationFee, "Invalid registration fee");
        _;
    }
}
