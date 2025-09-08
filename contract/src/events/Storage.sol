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

    // Doma integration config
    address public domaProxy;
    address public ownershipToken;
    address public trustedForwarder;
    uint256 public registrarIanaId;
    string public domaChainId; // CAIP-2 string if needed for bridging

    // Per-event doma linkage
    mapping(uint256 => uint256) public eventToDomaTokenId; // eventId => tokenId
    mapping(uint256 => uint8) public eventToDomaStatus; // 0-None,1-Requested,2-Minted,3-Claimed

    // Investment and revenue sharing (simple pro-rata)
    mapping(uint256 => uint256) public totalInvested; // eventId => total ETH invested
    mapping(uint256 => mapping(address => uint256)) public investorShares; // eventId => investor => amount
    mapping(uint256 => uint256) public revenueAccrued; // net revenue accrued per event

    // Revenue claims tracking and investor split bps
    mapping(uint256 => mapping(address => uint256)) public revenueClaimed; // eventId => investor => cumulative claimed
    uint256 public investorBps = 5000; // default 50% of net to investors
}


