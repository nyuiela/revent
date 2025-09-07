// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../utils/counter.sol";
import "./Types.sol";

abstract contract EventStorage {
    using Counters for Counters.Counter;
    using EventTypes for EventTypes.EventData;

    Counters.Counter internal _eventIds;
    Counters.Counter internal _attendeeIds; // reserved if needed later
    Counters.Counter internal _ticketIds;

    mapping(uint256 => EventTypes.EventData) public events;
    mapping(address => uint256[]) public creatorEvents;
    mapping(uint256 => address[]) public eventAttendees;
    mapping(uint256 => mapping(address => EventTypes.AttendeeData)) public attendees;
    mapping(string => bool) public usedConfirmationCodes;

    // Tickets
    mapping(uint256 => uint256[]) public eventTickets; // eventId => ticketIds
    mapping(uint256 => EventTypes.TicketData) public tickets; // ticketId => TicketData
    mapping(uint256 => mapping(address => uint256)) public purchasedTicketCounts; // eventId => buyer => count

    uint256 public platformFee = 250; // basis points
    uint256 public minRegistrationFee = 0.001 ether;
    uint256 public maxRegistrationFee = 1 ether;
    address public feeRecipient;
}


