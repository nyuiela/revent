// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {EventTypes} from "../../v0.1/structs/Types.sol";
import {Counters} from "../../v0.1/utils/counter.sol";
import {ITicketsV1} from "../interfaces/ITicketsV1.sol";
import {IEventsV1} from "../interfaces/IEventsV1.sol";
import {IEscrowV1} from "../interfaces/IEscrowV1.sol";
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
/**
 * @title TicketsV1
 * @dev Ticket management contract for Revent V1
 * @dev Handles ticket creation, purchasing, and management
 */

contract TicketsV1 is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ITicketsV1,
    ERC1155Upgradeable
{
    // Events are defined in ITicketsV1 interface

    // Storage
    mapping(uint256 => EventTypes.TicketData) public tickets;
    mapping(uint256 => uint256[]) public eventTickets;
    mapping(uint256 => mapping(address => uint256)) public purchasedTicketCounts;

    Counters.Counter private _ticketIds;

    // External contract addresses
    address public eventsContract;
    address public escrowContract;
    address public factoryContract;
    IEventsV1 public eventsModule;
    IEscrowV1 public escrowModule;
    // Modifiers
    // modifier onlyEventsContract() {
    //     require(_msgSender() == eventsContract || _msgSender() == factoryContract, "Only events contract or factory can call this");
    //     _;
    // }

    modifier onlyEventsCreator(uint256 eventId) {
        require(
            _msgSender() == eventsModule.getEvent(eventId).creator || _msgSender() == factoryContract,
            "Only events creator or factory can call this"
        );
        _;
    }

    modifier onlyFactoryOrOwner() {
        require(
            _msgSender() == owner() || _msgSender() == address(this) || _msgSender() == factoryContract,
            "Only factory or owner can call this"
        );
        _;
    }

    modifier ticketExists(uint256 ticketId) {
        require(ticketId > 0 && ticketId <= Counters.current(_ticketIds), "Invalid ticket ID");
        _;
    }

    modifier validTicketData(string memory name, string memory ticketType, uint256 price, uint256 totalQuantity) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(ticketType).length > 0, "Ticket type cannot be empty");
        require(price >= 0, "Price cannot be negative");
        require(totalQuantity > 0, "Total quantity must be greater than 0");
        _;
    }

    // Initialization
    function __TicketsV1_init() internal onlyInitializing {
        __Ownable_init(_msgSender());
        __Pausable_init();
        __ReentrancyGuard_init();
    }

    function initialize(string memory _uri) external initializer {
        // Initialize without onlyInitializing modifier for direct calls
        _transferOwnership(_msgSender());
        __ERC1155_init(_uri);
        // Note: Pausable and ReentrancyGuard don't need explicit initialization
        // as they are already initialized in the constructor
    }

    /**
     * @dev Set external contract addresses
     */
    function setContractAddresses(address _eventsContract, address _escrowContract) external {
        // Allow anyone to set contract addresses during initialization
        eventsContract = _eventsContract;
        escrowContract = _escrowContract;
        eventsModule = IEventsV1(eventsContract);
        escrowModule = IEscrowV1(escrowContract);
    }

    function setFactoryAddress(address _factoryContract) external {
        // Allow anyone to set factory address during initialization
        factoryContract = _factoryContract;
    }

    /**
     * @dev Create a new ticket
     */
    function createTicket(
        uint256 eventId,
        string memory name,
        string memory ticketType,
        uint256 price,
        string memory currency,
        uint256 totalQuantity,
        string[] memory perks
    ) public onlyEventsCreator(eventId) validTicketData(name, ticketType, price, totalQuantity) returns (uint256) {
        Counters.increment(_ticketIds);
        uint256 ticketId = Counters.current(_ticketIds);

        tickets[ticketId] = EventTypes.TicketData({
            ticketId: ticketId,
            eventId: eventId,
            name: name,
            ticketType: ticketType,
            price: price,
            currency: currency,
            totalQuantity: totalQuantity,
            soldQuantity: 0,
            perks: perks,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        eventTickets[eventId].push(ticketId);
        bytes memory data =
            abi.encode(ticketId, eventId, _msgSender(), name, ticketType, price, currency, totalQuantity, perks);
        _mint(msg.sender, ticketId, 1, data);

        emit TicketCreated(ticketId, eventId, _msgSender(), name, ticketType, price, currency, totalQuantity, perks);

        return ticketId;
    }

    function createTickets(
        uint256 eventId,
        string[] memory name,
        string[] memory ticketType,
        uint256[] memory price,
        string[] memory currency,
        uint256[] memory totalQuantity,
        string[][] memory perks
    ) external onlyEventsCreator(eventId) {
        for (uint256 i = 0; i < name.length; i++) {
            Counters.increment(_ticketIds);
            uint256 ticketId = Counters.current(_ticketIds);

            tickets[ticketId] = EventTypes.TicketData({
                ticketId: ticketId,
                eventId: eventId,
                name: name[i],
                ticketType: ticketType[i],
                price: price[i],
                currency: currency[i],
                totalQuantity: totalQuantity[i],
                soldQuantity: 0,
                perks: perks[i],
                isActive: true,
                createdAt: block.timestamp,
                updatedAt: block.timestamp
            });
            eventTickets[eventId].push(ticketId);
            bytes memory data =
                abi.encode(ticketId, eventId, _msgSender(), name, ticketType, price, currency, totalQuantity, perks);
            _mint(msg.sender, ticketId, 1, data);

            emit TicketCreated(
                ticketId,
                eventId,
                _msgSender(),
                name[i],
                ticketType[i],
                price[i],
                currency[i],
                totalQuantity[i],
                perks[i]
            );
        }
    }

    /**
     * @dev Purchase tickets
     */
    function purchaseTicket(uint256 ticketId, uint256 quantity)
        external
        payable
        nonReentrant
        whenNotPaused
        ticketExists(ticketId)
    {
        require(quantity > 0, "Quantity must be greater than 0");

        EventTypes.TicketData storage ticket = tickets[ticketId];
        require(ticket.isActive, "Ticket is not active");
        require(ticket.soldQuantity + quantity <= ticket.totalQuantity, "Not enough tickets available");

        uint256 totalPrice = ticket.price * quantity;
        require(msg.value >= totalPrice, "Insufficient payment");

        ticket.soldQuantity += quantity;
        purchasedTicketCounts[ticket.eventId][_msgSender()] += quantity;

        // Handle payment based on ticket type
        if (ticket.price > 0) {
            // For paid tickets, we'll need to integrate with escrow
            // This is a simplified version - in practice, you'd call the escrow contract
            // For now, we'll just emit the event
            escrowModule.depositFunds{value: totalPrice}(ticket.eventId, _msgSender());
        }

        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(_msgSender()).transfer(msg.value - totalPrice);
        }

        bytes memory data = abi.encode(ticketId, ticket.eventId, _msgSender(), quantity, totalPrice, ticket.currency);
        _mint(_msgSender(), ticketId, quantity, data);

        emit TicketPurchased(ticketId, ticket.eventId, _msgSender(), quantity, totalPrice, ticket.currency);
    }

    /**
     * @dev Update ticket details
     */
    function updateTicket(
        uint256 ticketId,
        string memory name,
        string memory ticketType,
        uint256 price,
        string memory currency,
        uint256 totalQuantity,
        string[] memory perks,
        bool isActive
    ) external onlyOwner ticketExists(ticketId) {
        EventTypes.TicketData storage ticket = tickets[ticketId];
        require(ticket.soldQuantity <= totalQuantity, "Cannot reduce quantity below sold amount");

        ticket.name = name;
        ticket.ticketType = ticketType;
        ticket.price = price;
        ticket.currency = currency;
        ticket.totalQuantity = totalQuantity;
        ticket.perks = perks;
        ticket.isActive = isActive;
        ticket.updatedAt = block.timestamp;

        emit TicketUpdated(ticketId, name, ticketType, price, currency, totalQuantity, perks, isActive);
    }

    // View functions
    function getEventTickets(uint256 eventId) external view returns (uint256[] memory) {
        return eventTickets[eventId];
    }

    function getTicket(uint256 ticketId) external view ticketExists(ticketId) returns (EventTypes.TicketData memory) {
        return tickets[ticketId];
    }

    function getPurchasedTicketCount(uint256 eventId, address buyer) external view returns (uint256) {
        return purchasedTicketCounts[eventId][buyer];
    }

    function getTicketCount() external view returns (uint256) {
        return Counters.current(_ticketIds);
    }

    function isTicketActive(uint256 ticketId) external view returns (bool) {
        return tickets[ticketId].isActive;
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Version
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
