// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./EscrowV1.sol";

contract EventModifiersV1 is EscrowV1 {
    modifier eventExists(uint256 eventId) {
        require(events[eventId].creator != address(0), "Event does not exist");
        _;
    }

    // onlyEventCreator is inherited from EscrowV1

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
