// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "./StorageV1.sol";

abstract contract EventModifiersV1 is StorageV1 {
    modifier eventExists(uint256 eventId) {
        require(events[eventId].creator != address(0), "Event does not exist");
        _;
    }

    modifier onlyEventCreator(uint256 eventId) {
        require(events[eventId].creator == _msgSender(), "Not event creator");
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
        require(attendees[eventId][_msgSender()].attendeeAddress == address(0), "Already registered");
        _;
    }

    modifier validRegistrationFee(uint256 fee) {
        require(fee >= minRegistrationFee && fee <= maxRegistrationFee, "Invalid registration fee");
        _;
    }
}
