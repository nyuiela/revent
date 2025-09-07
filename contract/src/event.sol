// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./events/Attendees.sol";
import "./events/Queries.sol";
import "./events/Admin.sol";
import "./events/Tickets.sol";

/**
 * @title StreamEvents
 * @dev Facade contract that composes modular event features
 */
contract StreamEvents is EventAttendees, EventQueries, EventAdmin, EventTickets {
    constructor() Ownable(msg.sender) {
        _transferOwnership(msg.sender);
        feeRecipient = msg.sender;
    }

    function pause() external onlyOwner {
        // Placeholder for future Pausable integration
    }

    function _owner() internal view override(EventAttendees, EventTickets) returns (address) {
        return owner();
    }

    function _generateConfirmationCode(uint256 eventId, address attendee)
        internal
        override(EventAttendees, EventTickets)
        returns (string memory)
    {
        return super._generateConfirmationCode(eventId, attendee);
    }

}
