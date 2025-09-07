// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Types.sol";

library EventEvents {
    event EventCreated(
        uint256 indexed eventId,
        address indexed creator,
        string ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee
    );

    event EventUpdated(
        uint256 indexed eventId,
        address indexed creator,
        string newIpfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee
    );

    event EventStatusChanged(
        uint256 indexed eventId,
        EventTypes.EventStatus oldStatus,
        EventTypes.EventStatus newStatus
    );

    event AttendeeRegistered(
        uint256 indexed eventId,
        address indexed attendee,
        string confirmationCode,
        uint256 registrationFee
    );

    event AttendeeConfirmed(
        uint256 indexed eventId,
        address indexed attendee,
        string confirmationCode
    );

    event AttendeeAttended(
        uint256 indexed eventId,
        address indexed attendee
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event RegistrationFeeLimitsUpdated(uint256 minFee, uint256 maxFee);

    // Ticketing
    event TicketAdded(
        uint256 indexed eventId,
        uint256 indexed ticketId,
        string name,
        string ticketType,
        uint256 price,
        string currency,
        uint256 totalQuantity
    );

    event TicketUpdated(
        uint256 indexed eventId,
        uint256 indexed ticketId,
        string name,
        string ticketType,
        uint256 price,
        string currency,
        uint256 totalQuantity,
        bool isActive
    );

    event TicketRemoved(uint256 indexed eventId, uint256 indexed ticketId);

    event TicketPurchased(
        uint256 indexed eventId,
        uint256 indexed ticketId,
        address indexed buyer,
        uint256 pricePaid
    );
}


