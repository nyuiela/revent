// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {EventTypes} from "../../v0.1/structs/Types.sol";

/**
 * @title ITicketsV1
 * @dev Interface for TicketsV1 contract
 * @dev Defines all external functions for ticket management
 */
interface ITicketsV1 {
    // Events
    event TicketCreated(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        address indexed creator,
        string name,
        string ticketType,
        uint256 price,
        string currency,
        uint256 totalQuantity,
        string[] perks
    );

    event TicketUpdated(
        uint256 indexed ticketId,
        string name,
        string ticketType,
        uint256 price,
        string currency,
        uint256 totalQuantity,
        string[] perks,
        bool isActive
    );

    event TicketPurchased(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPrice,
        string currency
    );

    // Ticket management functions
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

    // Contract setup functions
    function setContractAddresses(address _eventsContract, address _escrowContract) external;
    function setFactoryAddress(address _factoryContract) external;

    // View functions
    function getTicket(uint256 ticketId) external view returns (EventTypes.TicketData memory);
    function getEventTickets(uint256 eventId) external view returns (uint256[] memory);
    function getPurchasedTicketCount(uint256 eventId, address buyer) external view returns (uint256);
    function getTicketCount() external view returns (uint256);
    function isTicketActive(uint256 ticketId) external view returns (bool);

    // Contract addresses
    function eventsContract() external view returns (address);
    function escrowContract() external view returns (address);
    function factoryContract() external view returns (address);

    // Admin functions
    function pause() external;
    function unpause() external;

    // Version
    function version() external pure returns (string memory);
}
