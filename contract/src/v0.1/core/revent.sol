// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {EventsV1} from "./EventsV1.sol";
import {TicketsV1} from "./TicketsV1.sol";
import {EscrowV1} from "./EscrowV1.sol";
import {EventTypes} from "../../v0.1/structs/Types.sol";
import {IRevent} from "../interfaces/IRevent.sol";
import {IEventsV1} from "../interfaces/IEventsV1.sol";
import {ITicketsV1} from "../interfaces/ITicketsV1.sol";
import {IEscrowV1} from "../interfaces/IEscrowV1.sol";

/**
 * @title Revent
 * @dev Main Revent contract that coordinates with separate module contracts
 * @dev This contract manages references to Events, Tickets, and Escrow modules
 */
contract Revent is Initializable, UUPSUpgradeable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable, IRevent {
    
    // Events are defined in IRevent interface
    
    // Module contracts
    IEventsV1 public eventsModule;
    ITicketsV1 public ticketsModule;
    IEscrowV1 public escrowModule;
    
    // Configuration
    address public trustedForwarderAddr;
    address public feeRecipient;
    uint256 public platformFee;
    
    // Modifiers
    modifier onlyModules() {
        require(
            _msgSender() == address(eventsModule) || 
            _msgSender() == address(ticketsModule) || 
            _msgSender() == address(escrowModule),
            "Only module contracts can call this"
        );
        _;
    }
    
    // Initialization
    function initialize(
        address trustedForwarder,
        address feeRecipient_,
        uint256 platformFee_
    ) public initializer {
        __Ownable_init(_msgSender());
        __Pausable_init();
        __ReentrancyGuard_init();
        
        trustedForwarderAddr = trustedForwarder;
        feeRecipient = feeRecipient_;
        platformFee = platformFee_;
    }
    
    // Module management functions
    function setEvents(address _eventsModule) external onlyOwner {
        require(_eventsModule != address(0), "Invalid events module address");
        address oldModule = address(eventsModule);
        eventsModule = IEventsV1(payable(_eventsModule));
        emit ModuleUpdated("EventsV1", oldModule, _eventsModule);
    }
    
    function setTickets(address _ticketsModule) external onlyOwner {
        require(_ticketsModule != address(0), "Invalid tickets module address");
        address oldModule = address(ticketsModule);
        ticketsModule = ITicketsV1(payable(_ticketsModule));
        emit ModuleUpdated("TicketsV1", oldModule, _ticketsModule);
    }
    
    function setEscrow(address _escrowModule) external onlyOwner {
        require(_escrowModule != address(0), "Invalid escrow module address");
        address oldModule = address(escrowModule);
        escrowModule = IEscrowV1(payable(_escrowModule));
        emit ModuleUpdated("EscrowV1", oldModule, _escrowModule);
    }
    
    // Event management functions (delegated to EventsV1)
    function createEvent(
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        bool isVIP,
        bytes memory data
    ) external whenNotPaused returns (uint256) {
        require(address(eventsModule) != address(0), "Events module not set");
        return eventsModule.createEvent(ipfsHash, startTime, endTime, maxAttendees, isVIP, data);
    }
    
    function publishEvent(uint256 eventId) external whenNotPaused {
        require(address(eventsModule) != address(0), "Events module not set");
        eventsModule.publishEvent(eventId);
    }
    
    function startLiveEvent(uint256 eventId) external whenNotPaused {
        require(address(eventsModule) != address(0), "Events module not set");
        eventsModule.startLiveEvent(eventId);
    }
    
    function endEvent(uint256 eventId) external whenNotPaused {
        require(address(eventsModule) != address(0), "Events module not set");
        eventsModule.endEvent(eventId);
    }
    
    function cancelEvent(uint256 eventId) external whenNotPaused {
        require(address(eventsModule) != address(0), "Events module not set");
        eventsModule.cancelEvent(eventId);
    }
    
    function updateEvent(
        uint256 eventId,
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees
    ) external whenNotPaused {
        require(address(eventsModule) != address(0), "Events module not set");
        eventsModule.updateEvent(eventId, ipfsHash, startTime, endTime, maxAttendees);
    }
    
    // Ticket management functions (delegated to TicketsV1)
    function createTicket(
        uint256 eventId,
        string memory name,
        string memory ticketType,
        uint256 price,
        string memory currency,
        uint256 totalQuantity,
        string[] memory perks
    ) external whenNotPaused returns (uint256) {
        require(address(ticketsModule) != address(0), "Tickets module not set");
        require(address(eventsModule) != address(0), "Events module not set");
        
        // Check if event exists and is in draft status
        require(eventsModule.eventExistsCheck(eventId), "Event does not exist");
        require(eventsModule.getEventStatus(eventId) == EventTypes.EventStatus.DRAFT, "Event must be in draft status");
        
        uint256 ticketId = ticketsModule.createTicket(eventId, name, ticketType, price, currency, totalQuantity, perks);
        
        // If this is a VIP event with paid tickets, create escrow
        if (price > 0 && eventsModule.getEvent(eventId).isVIP && address(escrowModule) != address(0)) {
            escrowModule.createEscrow(eventId);
        }
        
        return ticketId;
    }
    
    function purchaseTicket(uint256 ticketId, uint256 quantity) external payable whenNotPaused {
        require(address(ticketsModule) != address(0), "Tickets module not set");
        ticketsModule.purchaseTicket{value: msg.value}(ticketId, quantity);
    }
    
    function updateTicket(
        uint256 ticketId,
        string memory name,
        string memory ticketType,
        uint256 price,
        string memory currency,
        uint256 totalQuantity,
        string[] memory perks,
        bool isActive
    ) external whenNotPaused {
        require(address(ticketsModule) != address(0), "Tickets module not set");
        ticketsModule.updateTicket(ticketId, name, ticketType, price, currency, totalQuantity, perks, isActive);
    }
    
    // Escrow management functions (delegated to EscrowV1)
    function depositFunds(uint256 eventId) external payable whenNotPaused {
        require(address(escrowModule) != address(0), "Escrow module not set");
        escrowModule.depositFunds{value: msg.value}(eventId, _msgSender());
        // escrowModule.depositFunds{value: msg.value}(eventId);
    }
    
    function releaseEscrowFunds(uint256 eventId) external whenNotPaused {
        require(address(escrowModule) != address(0), "Escrow module not set");
        escrowModule.releaseFunds(eventId);
    }
      
    function refundEscrowFunds(uint256 eventId) external whenNotPaused {
        require(address(escrowModule) != address(0), "Escrow module not set");
        escrowModule.refundFunds(eventId);
    }
    
    function createDispute(uint256 eventId, string calldata reason) external whenNotPaused {
        require(address(escrowModule) != address(0), "Escrow module not set");
        escrowModule.createDispute(eventId, reason);
    }
    
    function resolveDispute(uint256 eventId, bool refund) external whenNotPaused {
        require(address(escrowModule) != address(0), "Escrow module not set");
        escrowModule.resolveDispute(eventId, refund);
    }
    
    // View functions
    function getEvent(uint256 eventId) external view returns (EventTypes.EventData memory) {
        require(address(eventsModule) != address(0), "Events module not set");
        return eventsModule.getEvent(eventId);
    }
    
    function getEventTickets(uint256 eventId) external view returns (uint256[] memory) {
        require(address(ticketsModule) != address(0), "Tickets module not set");
        return ticketsModule.getEventTickets(eventId);
    }
    
    function getTicket(uint256 ticketId) external view returns (EventTypes.TicketData memory) {
        require(address(ticketsModule) != address(0), "Tickets module not set");
        return ticketsModule.getTicket(ticketId);
    }
    
    function getEscrowData(uint256 eventId) external view returns (IEscrowV1.EscrowData memory) {
        require(address(escrowModule) != address(0), "Escrow module not set");
        return escrowModule.getEscrowData(eventId);
    }
    
    function getCreatorEvents(address creator) external view returns (uint256[] memory) {
        require(address(eventsModule) != address(0), "Events module not set");
        return eventsModule.getCreatorEvents(creator);
    }
    
    function getPurchasedTicketCount(uint256 eventId, address buyer) external view returns (uint256) {
        require(address(ticketsModule) != address(0), "Tickets module not set");
        return ticketsModule.getPurchasedTicketCount(eventId, buyer);
    }
    
    // Admin functions
    function pause() external onlyOwner {
        _pause();
        if (address(eventsModule) != address(0)) eventsModule.pause();
        if (address(ticketsModule) != address(0)) ticketsModule.pause();
        if (address(escrowModule) != address(0)) escrowModule.pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
        if (address(eventsModule) != address(0)) eventsModule.unpause();
        if (address(ticketsModule) != address(0)) ticketsModule.unpause();
        if (address(escrowModule) != address(0)) escrowModule.unpause();
    }
    
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = newFeeRecipient;
    }
    
    function setPlatformFee(uint256 newPlatformFee) external onlyOwner {
        require(newPlatformFee <= 10000, "Platform fee cannot exceed 100%");
        platformFee = newPlatformFee;
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    // Version
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
    
    function getImplementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner whenPaused {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Override to handle ETH transfers
    receive() external payable {
        // Allow ETH transfers for escrow functionality
    }
}
