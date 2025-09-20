// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {EventTypes} from "../../v0.1/structs/Types.sol";
import {IEventsV1} from "./IEventsV1.sol";
import {ITicketsV1} from "./ITicketsV1.sol";
import {IEscrowV1} from "./IEscrowV1.sol";

/**
 * @title IRevent
 * @dev Interface for main Revent contract (module manager)
 * @dev Defines all external functions for the centralized Revent contract
 */
interface IRevent {
    // Events
    event ModuleSet(string indexed moduleType, address indexed moduleAddress);
    event ModuleUpdated(string indexed moduleType, address indexed oldModule, address indexed newModule);

    // Module management functions
    function setEvents(address _eventsModule) external;
    function setTickets(address _ticketsModule) external;
    function setEscrow(address _escrowModule) external;

    // Event management functions (delegated to EventsV1)
    function createEvent(
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        bool isVIP,
        bytes memory data
    ) external returns (uint256);

    function publishEvent(uint256 eventId) external;
    function startLiveEvent(uint256 eventId) external;
    function endEvent(uint256 eventId) external;
    function cancelEvent(uint256 eventId) external;

    function updateEvent(
        uint256 eventId,
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees
    ) external;

    // Ticket management functions (delegated to TicketsV1)
    function createTicket(
        uint256 eventId,
        string memory name,
        string memory ticketType,
        uint256 price,
        string memory currency,
        uint256 totalQuantity,
        string[] memory perks
    ) external returns (uint256);

    function purchaseTicket(uint256 ticketId, uint256 quantity) external payable;

    function updateTicket(
        uint256 ticketId,
        string memory name,
        string memory ticketType,
        uint256 price,
        string memory currency,
        uint256 totalQuantity,
        string[] memory perks,
        bool isActive
    ) external;

    // Escrow management functions (delegated to EscrowV1)
    function depositFunds(uint256 eventId) external payable;
    function releaseEscrowFunds(uint256 eventId) external;
    function refundEscrowFunds(uint256 eventId) external;
    function createDispute(uint256 eventId, string calldata reason) external;
    function resolveDispute(uint256 eventId, bool refund) external;

    // View functions
    function getEvent(uint256 eventId) external view returns (EventTypes.EventData memory);
    function getEventTickets(uint256 eventId) external view returns (uint256[] memory);
    function getTicket(uint256 ticketId) external view returns (EventTypes.TicketData memory);
    function getEscrowData(uint256 eventId) external view returns (IEscrowV1.EscrowData memory);
    function getCreatorEvents(address creator) external view returns (uint256[] memory);
    function getPurchasedTicketCount(uint256 eventId, address buyer) external view returns (uint256);

    // Module addresses
    function eventsModule() external view returns (IEventsV1);
    function ticketsModule() external view returns (ITicketsV1);
    function escrowModule() external view returns (IEscrowV1);

    // Configuration
    function trustedForwarderAddr() external view returns (address);
    function feeRecipient() external view returns (address);
    function platformFee() external view returns (uint256);

    // Admin functions
    function pause() external;
    function unpause() external;
    function setFeeRecipient(address newFeeRecipient) external;
    function setPlatformFee(uint256 newPlatformFee) external;
    function emergencyWithdraw() external;

    // Version and implementation
    function version() external pure returns (string memory);
    function getImplementation() external view returns (address);
}
