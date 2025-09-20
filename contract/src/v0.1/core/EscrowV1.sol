// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {EventTypes} from "../../v0.1/structs/Types.sol";
import {IEscrowV1} from "../interfaces/IEscrowV1.sol";
import {IEventsV1} from "../interfaces/IEventsV1.sol";
import {ITicketsV1} from "../interfaces/ITicketsV1.sol";
/**
 * @title EscrowV1
 * @dev Escrow system contract for Revent V1
 * @dev Handles secure fund management for VIP events
 */
contract EscrowV1 is Initializable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable, IEscrowV1 {
    // Events are defined in IEscrowV1 interface
    
    // EscrowData struct is defined in IEscrowV1 interface
    
    // Individual deposit tracking
    struct Deposit {
        // address depositor;
        uint256 amount;
        uint256 timestamp;
        bool isRefunded;
    }
    
    // Dispute management
    struct Dispute {
        address disputer;
        string reason;
        uint256 timestamp;
        bool resolved;
        address resolver;
    }
    
    // Storage gap to avoid collision with ERC-1967 slots
    // ERC-1967 uses slots 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc and 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103
    // We need to reserve slots to avoid collision
    uint256[1000] private __gap;
    
    // Storage mappings
    mapping(uint256 => EscrowData) public escrows;
    mapping(uint256 => mapping(address => Deposit)) public eventDeposits; // eventId => depositor => deposit data

    mapping(uint256 => mapping(address => uint256)) public userDeposits;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => bool) public authorizedResolvers;
    mapping(uint256 => bool) public disputeUsers;
    // Counters
    uint256 public escrowCount;
    
    // External contract addresses
    address public eventsContract;
    address public ticketsContract;
    address public factoryContract;
    IEventsV1 public eventsModule;
    ITicketsV1 public ticketsModule;
    
    // Security parameters
    uint256 public constant MIN_ESCROW_AMOUNT = 0.000001 ether;
    uint256 public constant MAX_ESCROW_AMOUNT = 1000 ether;
    uint256 public constant DISPUTE_WINDOW = 7 days;
    uint256 public constant RELEASE_DELAY = 1 days;
    uint256 public constant MAX_DEPOSITORS_PER_EVENT = 1000;
    
    // State tracking
    mapping(uint256 => uint256) public totalEscrowedAmount;
    mapping(uint256 => uint256) public totalReleasedAmount;
    mapping(uint256 => uint256) public totalRefundedAmount;
    
    // Modifiers
    // modifier onlyEventsContract() {
    //     require(_msgSender() == eventsContract || _msgSender() == factoryContract, "Only events contract or factory can call this");
    //     _;
    // }
    
    modifier onlyEventCreator(uint256 eventId) {
        require(eventsModule.getEvent(eventId).creator == _msgSender(), "Not event creator");
        _;
    }
    
    modifier onlyTicketsContract() {
        require(_msgSender() == ticketsContract || _msgSender() == factoryContract, "Only tickets contract or factory can call this");
        _;
    }
    
    modifier onlyFactoryOrOwner() {
        require(_msgSender() == owner() || _msgSender() == address(this) || _msgSender() == factoryContract, "Only factory or owner can call this");
        _;
    }
    
    modifier escrowExists(uint256 eventId) {
        require(escrows[eventId].createdAt != 0, "Escrow does not exist");
        _;
    }
    
    modifier escrowNotLocked(uint256 eventId) {
        require(!escrows[eventId].isLocked, "Escrow is locked");
        _;
    }
    
    modifier escrowNotReleased(uint256 eventId) {
        require(!escrows[eventId].isReleased, "Escrow already released");
        _;
    }
    
    modifier escrowNotRefunded(uint256 eventId) {
        require(!escrows[eventId].isRefunded, "Escrow already refunded");
        _;
    }
    
    modifier withinDisputeWindow(uint256 eventId) {
        require(block.timestamp <= escrows[eventId].disputeDeadline, "Dispute window expired");
        _;
    }
    
    modifier afterReleaseDelay(uint256 eventId) {
        require(block.timestamp >= escrows[eventId].releaseTime, "Release delay not met");
        _;
    }
    
    modifier validAmount(uint256 amount) {
        require(amount >= MIN_ESCROW_AMOUNT, "Amount too small");
        require(amount <= MAX_ESCROW_AMOUNT, "Amount too large");
        _;
    }
    
    modifier notDisputed(uint256 eventId) {
        require(!escrows[eventId].isDisputed, "Escrow is disputed");
        _;
    }
    
    // Initialization
    function __EscrowV1_init() internal onlyInitializing {
        __Ownable_init(_msgSender());
        __Pausable_init();
        __ReentrancyGuard_init();
    }
    
    function initialize() external {
        // Initialize without onlyInitializing modifier for direct calls
        _transferOwnership(_msgSender());
        // Note: Pausable and ReentrancyGuard don't need explicit initialization
        // as they are already initialized in the constructor
    }
    
    /**
     * @dev Set external contract addresses
     */
    function setContractAddresses(address _eventsContract, address _ticketsContract) external {
        // Allow anyone to set contract addresses during initialization
        eventsContract = _eventsContract;
        ticketsContract = _ticketsContract;
        eventsModule = IEventsV1(eventsContract);
        ticketsModule = ITicketsV1(ticketsContract);
    }
    
    function setFactoryAddress(address _factoryContract) external {
        // Allow anyone to set factory address during initialization
        factoryContract = _factoryContract;
    }
    
    /**
     * @dev Create escrow for an event
     */
    function createEscrow(uint256 eventId) 
        external 
        onlyEventCreator(eventId) 
        nonReentrant 
        whenNotPaused 
    {
        require(escrows[eventId].createdAt == 0, "Escrow already exists");
        
        escrowCount++;
        // Get event data to calculate total amount
        EventTypes.EventData memory eventData = eventsModule.getEvent(eventId);
        uint256 totalAmount = 0;
        
        escrows[eventId] = EscrowData({
            eventId: eventId,
            creator: _msgSender(),
            totalAmount: totalAmount,
            depositedAmount: 0,
            isFunded: false,
            isReleased: false,
            isRefunded: false,
            isDisputed: false,
            isLocked: false,
            disputeReason: bytes32(0), // @audit dispute reason will be overwritten by other disputes reason.
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            releaseTime: block.timestamp + RELEASE_DELAY,
            disputeDeadline: block.timestamp + DISPUTE_WINDOW
        });
        emit EscrowCreated(eventId, _msgSender(), totalAmount);
    }
    
    /**
     * @dev Deposit funds into escrow
     */
    function depositFunds(uint256 eventId, address depositor) 
        external 
        payable 
        escrowExists(eventId)
        escrowNotLocked(eventId)
        escrowNotReleased(eventId)
        escrowNotRefunded(eventId)
        notDisputed(eventId)
        nonReentrant
        whenNotPaused
    {
        EscrowData storage escrow = escrows[eventId];
        
        // Prevent too many depositors (DoS protection)
        // require(
        //     eventDeposits[eventId][depositor].amount < MAX_DEPOSITORS_PER_EVENT,
        //     "Too many depositors"
        // ); // @TODO logic is missing if depositors doesn't add up to total amount
        
        // Track individual deposit
        Deposit storage deposit = eventDeposits[eventId][depositor]; // @todo tracking individual deposit will result in duplicate data if user buys multiple tickets
        deposit.amount += msg.value;
        deposit.timestamp = block.timestamp;
        deposit.isRefunded = false;
        
        // Update user's total deposits
        userDeposits[eventId][depositor] += msg.value;
        
        // Update escrow totals
        escrow.depositedAmount += msg.value;
        escrow.totalAmount += msg.value;
        escrow.updatedAt = block.timestamp;
        totalEscrowedAmount[eventId] += msg.value;
        
        // Check if escrow is funded
        if (escrow.depositedAmount >= escrow.totalAmount) {
            escrow.isFunded = true;
        }
        
        emit FundsDeposited(eventId, depositor, msg.value, escrows[eventId].depositedAmount);
    }
    
    // function depositFundsWithAmount(uint256 eventId, address depositor) 
    //     external 
    //     // onlyTicketsContract
    //     escrowExists(eventId)
    //     escrowNotLocked(eventId)
    //     escrowNotReleased(eventId)
    //     escrowNotRefunded(eventId)
    //     notDisputed(eventId)
    //     validAmount(msg.value)
    //     nonReentrant
    //     whenNotPaused
    // {
    //     EscrowData storage escrow = escrows[eventId];
        
    //     // Prevent too many depositors (DoS protection)
    //     require(
    //         eventDeposits[eventId].length < MAX_DEPOSITORS_PER_EVENT,
    //         "Too many depositors"
    //     ); // @TODO logic is missing if depositors doesn't add up to total amount
        
    //     // Track individual deposit
    //     eventDeposits[eventId].push(Deposit({
    //         depositor: depositor,
    //         amount: msg.value,
    //         timestamp: block.timestamp,
    //         isRefunded: false
    //     })); // @todo tracking individual deposit will result in duplicate data if user buys multiple tickets
        
    //     // Update user's total deposits
    //     userDeposits[eventId][depositor] += msg.value;
        
    //     // Update escrow totals
    //     escrow.depositedAmount += msg.value;
    //     escrow.updatedAt = block.timestamp;
    //     totalEscrowedAmount[eventId] += msg.value;
        
    //     // Check if escrow is fully funded
    //     if (escrow.depositedAmount >= escrow.totalAmount) {
    //         escrow.isFunded = true;
    //     }
        
    //     emit FundsDeposited(eventId, depositor, msg.value, escrows[eventId].depositedAmount);
    // }
    
    /**
     * @dev Release funds to event creator
     */
    function releaseFunds(uint256 eventId) 
        external 
        onlyEventCreator(eventId)
        escrowExists(eventId)
        afterReleaseDelay(eventId)
        escrowNotLocked(eventId)
        escrowNotReleased(eventId)
        escrowNotRefunded(eventId)
        notDisputed(eventId)
        nonReentrant
        whenNotPaused
    {
        EscrowData storage escrow = escrows[eventId];
        
        require(escrow.isFunded, "Escrow not funded");
        
        escrow.isReleased = true;
        escrow.updatedAt = block.timestamp;
        totalReleasedAmount[eventId] = escrow.depositedAmount;
        
        // Transfer funds directly to creator
        payable(escrow.creator).transfer(escrow.depositedAmount);
        
        emit FundsReleased(eventId, escrow.creator, escrow.depositedAmount);
    }
    
    /**
     * @dev Refund all deposits
     */
    function refundFunds(uint256 eventId) 
        external
        escrowExists(eventId)
        escrowNotLocked(eventId)
        escrowNotReleased(eventId)
        escrowNotRefunded(eventId)
        nonReentrant
        whenNotPaused
    {
        EscrowData storage escrow = escrows[eventId];
        // escrow.isRefunded = true;
        require(eventDeposits[eventId][_msgSender()].amount > 0, "No deposits to refund");
        require(disputeUsers[eventId], "Dispute needs to be disputed to users");
        require(totalRefundedAmount[eventId] + eventDeposits[eventId][_msgSender()].amount <= escrow.depositedAmount, "Total refunded amount exceeds deposited amount");
        escrow.updatedAt = block.timestamp;
        totalRefundedAmount[eventId] += eventDeposits[eventId][_msgSender()].amount;
        
        // Refund all individual deposits
        Deposit storage deposit = eventDeposits[eventId][_msgSender()];
            if (!deposit.isRefunded) {
                deposit.isRefunded = true;
                payable(_msgSender()).transfer(deposit.amount);
                emit FundsRefunded(eventId, _msgSender(), deposit.amount);
            }
    }
    
    /**
     * @dev Create a dispute
     */
    function createDispute(uint256 eventId, string calldata reason) 
        external 
        escrowExists(eventId)
        withinDisputeWindow(eventId)
        escrowNotLocked(eventId)
        escrowNotReleased(eventId)
        escrowNotRefunded(eventId)
        nonReentrant
        whenNotPaused
    {
        require(bytes(reason).length > 0, "Dispute reason required");
        require(!escrows[eventId].isDisputed, "Dispute already exists");
        require(eventsModule.getAttendee(eventId, _msgSender()).attendeeAddress == _msgSender(), "Attendee not found");
        // require(eventsModule.getAttendee(eventId, _msgSender()).hasAttended, "Attendee not attended");

        escrows[eventId].isDisputed = true;
        escrows[eventId].isLocked = true;
        escrows[eventId].updatedAt = block.timestamp;
        
        disputes[eventId] = Dispute({
            disputer: _msgSender(),
            reason: reason,
            timestamp: block.timestamp,
            resolved: false,
            resolver: address(0)
        });
        
        emit DisputeCreated(eventId, _msgSender(), reason);
    }
    
    /**
     * @dev Resolve a dispute
     */
    function resolveDispute(uint256 eventId, bool refund) 
        external 
        escrowExists(eventId)
        onlyOwner
        nonReentrant
        whenNotPaused
    {
        require(escrows[eventId].isDisputed, "No dispute exists");
        require(!disputes[eventId].resolved, "Dispute already resolved");
        
        disputes[eventId].resolved = true;
        disputes[eventId].resolver = _msgSender();
        escrows[eventId].updatedAt = block.timestamp;
        disputeUsers[eventId] = refund; // default false
        
        if (!refund) {
            // Release funds to creator
            escrows[eventId].isReleased = true;
            totalReleasedAmount[eventId] = escrows[eventId].depositedAmount;
            payable(escrows[eventId].creator).transfer(escrows[eventId].depositedAmount);
            emit FundsReleased(eventId, escrows[eventId].creator, escrows[eventId].depositedAmount);
        }
        
        // Unlock after resolution
        escrows[eventId].isLocked = false;
        emit DisputeResolved(eventId, refund, _msgSender());
    }
    
    // View functions
    function getEscrowData(uint256 eventId) external view returns (EscrowData memory) {
        return escrows[eventId];
    }
    
    function getEscrowStatus(uint256 eventId) external view returns (string memory) {
        EscrowData memory escrow = escrows[eventId];
        if (escrow.isRefunded) return "REFUNDED";
        if (escrow.isReleased) return "RELEASED";
        if (escrow.isDisputed) return "DISPUTED";
        if (escrow.isFunded) return "FUNDED";
        return "PENDING";
    }
    
    function isEscrowFunded(uint256 eventId) external view returns (bool) {
        return escrows[eventId].isFunded;
    }
    
    function isEscrowReleased(uint256 eventId) external view returns (bool) {
        return escrows[eventId].isReleased;
    }
    
    function isEscrowRefunded(uint256 eventId) external view returns (bool) {
        return escrows[eventId].isRefunded;
    }
    
    function isEscrowDisputed(uint256 eventId) external view returns (bool) {
        return escrows[eventId].isDisputed;
    }
    
    function getEscrowCount() external view returns (uint256) {
        return escrowCount;
    }
    
    function getEventDeposits(uint256 eventId) external view returns (Deposit memory) {
        return eventDeposits[eventId][_msgSender()];
    }

    function getEventDeposits(uint256 eventId, address user) external view returns (Deposit memory) {
        return eventDeposits[eventId][user];
    }
    
    function getUserDeposit(uint256 eventId, address user) external view returns (uint256) {
        return userDeposits[eventId][user];
    }
    
    function getDispute(uint256 eventId) external view returns (Dispute memory) {
        return disputes[eventId];
    }
    
    function isEscrowFullyFunded(uint256 eventId) external view returns (bool) {
        return escrows[eventId].isFunded;
    }
    
    function canReleaseFunds(uint256 eventId) external view returns (bool) {
        EscrowData memory escrow = escrows[eventId];
        return escrow.isFunded && 
               !escrow.isReleased && 
               !escrow.isRefunded && 
               !escrow.isDisputed && 
               !escrow.isLocked &&
               block.timestamp >= escrow.releaseTime;
    }
    
    function canCreateDispute(uint256 eventId) external view returns (bool) {
        EscrowData memory escrow = escrows[eventId];
        return escrow.createdAt != 0 && 
               !escrow.isDisputed && 
               !escrow.isReleased && 
               !escrow.isRefunded && 
               !escrow.isLocked &&
               block.timestamp <= escrow.disputeDeadline;
    }
    
    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function setEscrowLock(uint256 eventId, bool locked) external onlyOwner escrowExists(eventId) {
        escrows[eventId].isLocked = locked;
        escrows[eventId].updatedAt = block.timestamp;
        emit EscrowLocked(eventId, locked);
    }
    
    function emergencyWithdraw(uint256 eventId) external onlyOwner escrowExists(eventId) whenPaused nonReentrant {
        EscrowData storage escrow = escrows[eventId];
        require(escrow.depositedAmount > 0, "No funds to withdraw");
        
        uint256 amount = escrow.depositedAmount;
        escrow.depositedAmount = 0;
        escrow.isLocked = true;
        escrow.updatedAt = block.timestamp;
        
        payable(owner()).transfer(amount);
        emit EmergencyWithdraw(eventId, owner(), amount);
    }
    
    // Version
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
    
    // Override to handle ETH transfers
    receive() external payable {
        revert("Direct ETH transfers not allowed");
    }
    
    fallback() external payable {
        revert("Fallback not allowed");
    }
    
}
