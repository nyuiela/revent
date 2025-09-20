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

/**
 * @title ReventFactoryV1
 * @dev Main factory contract for Revent V1
 * @dev Manages all module contracts and provides unified interface
 */
contract ReventFactoryV1 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Events
    event ModuleDeployed(address indexed module, string moduleType);
    event ModuleUpdated(address indexed oldModule, address indexed newModule, string moduleType);

    // Module contracts
    EventsV1 public eventsModule;
    TicketsV1 public ticketsModule;
    EscrowV1 public escrowModule;

    // Configuration
    address public trustedForwarderAddr;
    address public feeRecipient;
    uint256 public platformFee;

    // Modifiers
    modifier onlyModules() {
        require(
            _msgSender() == address(eventsModule) || _msgSender() == address(ticketsModule)
                || _msgSender() == address(escrowModule),
            "Only module contracts can call this"
        );
        _;
    }

    // Initialization
    function initialize(address trustedForwarder, address feeRecipient_, uint256 platformFee_) public initializer {
        __Ownable_init(_msgSender());
        __Pausable_init();
        __ReentrancyGuard_init();

        trustedForwarderAddr = trustedForwarder;
        feeRecipient = feeRecipient_;
        platformFee = platformFee_;

        // Deploy module contracts
        _deployModules();
    }

    /**
     * @dev Deploy all module contracts
     */
    function _deployModules() internal {
        // Deploy Events module
        eventsModule = new EventsV1();
        emit ModuleDeployed(address(eventsModule), "EventsV1");

        // Deploy Tickets module
        ticketsModule = new TicketsV1();
        emit ModuleDeployed(address(ticketsModule), "TicketsV1");

        // Deploy Escrow module
        escrowModule = new EscrowV1();
        emit ModuleDeployed(address(escrowModule), "EscrowV1");

        // Modules are deployed with factory as owner, no need to transfer

        // Set up cross-module references
        _setupModuleReferences();
    }

    /**
     * @dev Set up references between modules
     */
    function _setupModuleReferences() internal {
        // Set factory address in modules
        ticketsModule.setFactoryAddress(address(this));
        escrowModule.setFactoryAddress(address(this));

        // Set contract addresses in modules
        ticketsModule.setContractAddresses(address(eventsModule), address(escrowModule));
        escrowModule.setContractAddresses(address(eventsModule), address(ticketsModule));
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
        return eventsModule.createEvent(ipfsHash, startTime, endTime, maxAttendees, isVIP, data, "EVENT123");
    }

    function publishEvent(uint256 eventId) external whenNotPaused {
        eventsModule.publishEvent(eventId);
    }

    function startLiveEvent(uint256 eventId) external whenNotPaused {
        eventsModule.startLiveEvent(eventId);
    }

    function endEvent(uint256 eventId) external whenNotPaused {
        eventsModule.endEvent(eventId);
    }

    function cancelEvent(uint256 eventId) external whenNotPaused {
        eventsModule.cancelEvent(eventId);
    }

    function updateEvent(
        uint256 eventId,
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees
    ) external whenNotPaused {
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
        // Check if event exists and is in draft status
        require(eventsModule.eventExistsCheck(eventId), "Event does not exist");
        require(eventsModule.getEventStatus(eventId) == EventTypes.EventStatus.DRAFT, "Event must be in draft status");

        uint256 ticketId = ticketsModule.createTicket(eventId, name, ticketType, price, currency, totalQuantity, perks);

        // If this is a VIP event with paid tickets, create escrow
        if (price > 0 && eventsModule.getEvent(eventId).isVIP) {
            escrowModule.createEscrow(eventId);
        }

        return ticketId;
    }

    function purchaseTicket(uint256 ticketId, uint256 quantity) external payable whenNotPaused {
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
        ticketsModule.updateTicket(ticketId, name, ticketType, price, currency, totalQuantity, perks, isActive);
    }

    // Escrow management functions (delegated to EscrowV1)
    function depositFunds(uint256 eventId) external payable whenNotPaused {
        escrowModule.depositFunds{value: msg.value}(eventId, _msgSender());
    }

    function releaseEscrowFunds(uint256 eventId) external whenNotPaused {
        escrowModule.releaseFunds(eventId);
    }

    function refundEscrowFunds(uint256 eventId) external whenNotPaused {
        escrowModule.refundFunds(eventId);
    }

    function createDispute(uint256 eventId, string calldata reason) external whenNotPaused {
        escrowModule.createDispute(eventId, reason);
    }

    function resolveDispute(uint256 eventId, bool refund) external whenNotPaused {
        escrowModule.resolveDispute(eventId, refund);
    }

    // View functions
    function getEvent(uint256 eventId) external view returns (EventTypes.EventData memory) {
        return eventsModule.getEvent(eventId);
    }

    function getEventTickets(uint256 eventId) external view returns (uint256[] memory) {
        return ticketsModule.getEventTickets(eventId);
    }

    function getTicket(uint256 ticketId) external view returns (EventTypes.TicketData memory) {
        return ticketsModule.getTicket(ticketId);
    }

    function getEscrowData(uint256 eventId) external view returns (EscrowV1.EscrowData memory) {
        return escrowModule.getEscrowData(eventId);
    }

    function getCreatorEvents(address creator) external view returns (uint256[] memory) {
        return eventsModule.getCreatorEvents(creator);
    }

    function getPurchasedTicketCount(uint256 eventId, address buyer) external view returns (uint256) {
        return ticketsModule.getPurchasedTicketCount(eventId, buyer);
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
        eventsModule.pause();
        ticketsModule.pause();
        escrowModule.pause();
    }

    function unpause() external onlyOwner {
        _unpause();
        eventsModule.unpause();
        ticketsModule.unpause();
        escrowModule.unpause();
    }

    function updateModule(string memory moduleType, address newModule) external onlyOwner {
        require(newModule != address(0), "Invalid module address");

        if (keccak256(bytes(moduleType)) == keccak256(bytes("EventsV1"))) {
            address oldModule = address(eventsModule);
            eventsModule = EventsV1(payable(newModule));
            emit ModuleUpdated(oldModule, newModule, moduleType);
        } else if (keccak256(bytes(moduleType)) == keccak256(bytes("TicketsV1"))) {
            address oldModule = address(ticketsModule);
            ticketsModule = TicketsV1(payable(newModule));
            emit ModuleUpdated(oldModule, newModule, moduleType);
        } else if (keccak256(bytes(moduleType)) == keccak256(bytes("EscrowV1"))) {
            address oldModule = address(escrowModule);
            escrowModule = EscrowV1(payable(newModule));
            emit ModuleUpdated(oldModule, newModule, moduleType);
        } else {
            revert("Invalid module type");
        }

        // Update cross-module references
        _setupModuleReferences();
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
