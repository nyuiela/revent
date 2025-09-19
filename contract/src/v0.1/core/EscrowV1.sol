// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "./StorageV1.sol";
import {EventEvents} from "./Events.sol";

/**
 * @title EscrowV1
 * @dev Secure escrow system for events with paid tickets
 * @dev Implements robust security patterns: reentrancy protection, access controls, emergency stops
 */
contract EscrowV1 is ReentrancyGuardUpgradeable, PausableUpgradeable, ReventStorage {
    
    // Events for escrow operations
    event EscrowCreated(uint256 indexed eventId, address indexed creator, uint256 totalAmount);
    event FundsDeposited(uint256 indexed eventId, address indexed depositor, uint256 amount);
    event FundsReleased(uint256 indexed eventId, address indexed recipient, uint256 amount);
    event FundsRefunded(uint256 indexed eventId, address indexed recipient, uint256 amount);
    event EscrowDisputed(uint256 indexed eventId, address indexed disputer, string reason);
    event EscrowResolved(uint256 indexed eventId, address indexed resolver, bool refunded);
    event EscrowLocked(uint256 indexed eventId, bool locked);
    event EmergencyWithdraw(uint256 indexed eventId, address indexed admin, uint256 amount);

    // Escrow state management
    struct EscrowData {
        uint256 eventId;
        address creator;
        uint256 totalAmount;
        uint256 depositedAmount;
        bool isFunded;
        bool isReleased;
        bool isRefunded;
        bool isDisputed;
        bool isLocked;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 releaseTime; // Time when funds can be released
        uint256 disputeDeadline; // Time when disputes can be raised
    }

    // Individual deposit tracking
    struct Deposit {
        address depositor;
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

    // Storage mappings
    mapping(uint256 => EscrowData) public escrows;
    mapping(uint256 => Deposit[]) public eventDeposits; // eventId => deposits array
    mapping(uint256 => mapping(address => uint256)) public userDeposits; // eventId => user => total deposited
    mapping(uint256 => Dispute) public disputes; // eventId => dispute data
    mapping(address => bool) public authorizedResolvers; // Addresses that can resolve disputes
    
    // Security parameters
    uint256 public constant MIN_ESCROW_AMOUNT = 0.000001 ether;
    uint256 public constant MAX_ESCROW_AMOUNT = 1000 ether;
    uint256 public constant DISPUTE_WINDOW = 7 days; // 7 days to raise disputes
    uint256 public constant RELEASE_DELAY = 1 days; // 1 day delay before release
    uint256 public constant MAX_DEPOSITORS_PER_EVENT = 1000; // Prevent DoS
    
    // State tracking
    mapping(uint256 => uint256) public totalEscrowedAmount; // Total amount in escrow per event
    mapping(uint256 => uint256) public totalReleasedAmount; // Total amount released per event
    mapping(uint256 => uint256) public totalRefundedAmount; // Total amount refunded per event

    // Modifiers for security
    modifier onlyEventCreator(uint256 eventId) {
        require(events[eventId].creator == _msgSender(), "Not event creator");
        _;
    }

    modifier onlyAuthorizedResolver() {
        require(authorizedResolvers[_msgSender()] || owner() == _msgSender(), "Not authorized resolver");
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
        require(
            block.timestamp <= escrows[eventId].disputeDeadline,
            "Dispute window expired"
        );
        _;
    }

    modifier afterReleaseDelay(uint256 eventId) {
        require(
            block.timestamp >= escrows[eventId].releaseTime,
            "Release delay not met"
        );
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
        __ReentrancyGuard_init();
        __Pausable_init();
    }

    /**
     * @dev Create escrow for an event with paid tickets
     * @param eventId The event ID
     */
    function createEscrow(uint256 eventId) 
        internal 
        onlyEventCreator(eventId)
        // validAmount()
        nonReentrant
        whenNotPaused
    {
        require(escrows[eventId].createdAt == 0, "Escrow already exists");
        require(events[eventId].isVIP, "Event must be VIP to create escrow");
        require(events[eventId].status == EventTypes.EventStatus.DRAFT, "Event must be in draft status");

        escrows[eventId] = EscrowData({
            eventId: eventId,
            creator: _msgSender(),
            totalAmount: 0,
            depositedAmount: 0,
            isFunded: false,
            isReleased: false,
            isRefunded: false,
            isDisputed: false,
            isLocked: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            releaseTime: events[eventId].endTime + RELEASE_DELAY,
            disputeDeadline: events[eventId].endTime + DISPUTE_WINDOW
        });

        emit EscrowCreated(eventId, _msgSender(), 0);
    }

    /**
     * @dev Deposit funds into escrow
     * @param eventId The event ID
     */
    function depositFunds(uint256 eventId) 
        external 
        escrowExists(eventId)
        escrowNotLocked(eventId)
        escrowNotReleased(eventId)
        escrowNotRefunded(eventId)
        notDisputed(eventId)
        payable
        nonReentrant
        whenNotPaused
    {
        depositFundsWithAmount(eventId, msg.value);
    }

    function depositFundsWithAmount(uint256 eventId, uint256 amount) 
        internal 
        escrowExists(eventId)
        escrowNotLocked(eventId)
        escrowNotReleased(eventId)
        escrowNotRefunded(eventId)
        notDisputed(eventId)
        validAmount(amount)
        // nonReentrant
        whenNotPaused
    {
        EscrowData storage escrow = escrows[eventId];
        
        // Check if event is still accepting deposits
        require(
            events[eventId].status == EventTypes.EventStatus.PUBLISHED ||
            events[eventId].status == EventTypes.EventStatus.LIVE,
            "Event not accepting deposits"
        );

        // Prevent too many depositors (DoS protection)
        require(
            eventDeposits[eventId].length < MAX_DEPOSITORS_PER_EVENT,
            "Too many depositors"
        );

        // Track individual deposit
        eventDeposits[eventId].push(Deposit({
            depositor: _msgSender(),
            amount: amount,
            timestamp: block.timestamp,
            isRefunded: false
        }));

        // Update user's total deposits
        userDeposits[eventId][_msgSender()] += amount;
        
        // Update escrow totals
        escrow.depositedAmount += amount;
        escrow.totalAmount += amount;
        escrow.updatedAt = block.timestamp;
        totalEscrowedAmount[eventId] += amount;

        // Check if escrow is fully funded
        // if (escrow.depositedAmount >= escrow.totalAmount) {
            escrow.isFunded = true;
        // }

        emit FundsDeposited(eventId, _msgSender(), amount);
    }

    /**
     * @dev Release funds to event creator (only after event completion)
     * @param eventId The event ID
     */
    function releaseFunds(uint256 eventId) 
        internal 
        escrowExists(eventId)
        onlyEventCreator(eventId)
        afterReleaseDelay(eventId)
        escrowNotLocked(eventId)
        escrowNotReleased(eventId)
        escrowNotRefunded(eventId)
        notDisputed(eventId)
        // nonReentrant
        whenNotPaused
    {
        EscrowData storage escrow = escrows[eventId];
        
        require(escrow.isFunded, "Escrow not fully funded");
        require(
            events[eventId].status == EventTypes.EventStatus.COMPLETED,
            "Event not completed"
        );

        escrow.isReleased = true;
        escrow.updatedAt = block.timestamp;
        totalReleasedAmount[eventId] = escrow.depositedAmount;

        // Transfer funds directly to creator
        payable(escrow.creator).transfer(escrow.depositedAmount);

        emit FundsReleased(eventId, escrow.creator, escrow.depositedAmount);
    }

    /**
     * @dev Refund all deposits (when event is cancelled)
     * @param eventId The event ID
     */
    function refundFunds(uint256 eventId) 
        internal 
        escrowExists(eventId)
        onlyEventCreator(eventId)
        escrowNotLocked(eventId)
        escrowNotReleased(eventId)
        escrowNotRefunded(eventId)
        nonReentrant
        whenNotPaused
    {
        require(
            events[eventId].status == EventTypes.EventStatus.CANCELLED,
            "Event not cancelled"
        );

        EscrowData storage escrow = escrows[eventId];
        escrow.isRefunded = true;
        escrow.updatedAt = block.timestamp;
        totalRefundedAmount[eventId] = escrow.depositedAmount;

        // Refund all individual deposits
        Deposit[] storage deposits = eventDeposits[eventId];
        for (uint256 i = 0; i < deposits.length; i++) {
            if (!deposits[i].isRefunded) {
                deposits[i].isRefunded = true;
                payable(deposits[i].depositor).transfer(deposits[i].amount);
                emit FundsRefunded(eventId, deposits[i].depositor, deposits[i].amount);
            }//@todo dont use array metjod its bad, pull not push
        }
    }

    /**
     * @dev Create a dispute for the escrow
     * @param eventId The event ID
     * @param reason Reason for the dispute
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

        emit EscrowDisputed(eventId, _msgSender(), reason);
    }

    /**
     * @dev Resolve a dispute (only authorized resolvers)
     * @param eventId The event ID
     * @param refund Whether to refund or release funds
     */
    function resolveDispute(uint256 eventId, bool refund) 
        external 
        escrowExists(eventId)
        onlyAuthorizedResolver
        nonReentrant
        whenNotPaused
    {
        require(escrows[eventId].isDisputed, "No dispute exists");
        require(!disputes[eventId].resolved, "Dispute already resolved");

        disputes[eventId].resolved = true;
        disputes[eventId].resolver = _msgSender();
        escrows[eventId].updatedAt = block.timestamp;

        if (refund) {
            // Refund all deposits
            escrows[eventId].isRefunded = true;
            totalRefundedAmount[eventId] = escrows[eventId].depositedAmount;
            
            Deposit[] storage deposits = eventDeposits[eventId];
            for (uint256 i = 0; i < deposits.length; i++) {
                if (!deposits[i].isRefunded) {
                    deposits[i].isRefunded = true;
                    payable(deposits[i].depositor).transfer(deposits[i].amount);
                    emit FundsRefunded(eventId, deposits[i].depositor, deposits[i].amount);
                }
            }
        } else {
            // Release funds to creator
            escrows[eventId].isReleased = true;
            totalReleasedAmount[eventId] = escrows[eventId].depositedAmount;
            payable(escrows[eventId].creator).transfer(escrows[eventId].depositedAmount);
            emit FundsReleased(eventId, escrows[eventId].creator, escrows[eventId].depositedAmount);
        }

        // Unlock after resolution
        escrows[eventId].isLocked = false;
        emit EscrowResolved(eventId, _msgSender(), refund);
    }

    /**
     * @dev Public function to release funds after event completion
     * @param eventId The event ID
     */
    function releaseEscrowFunds(uint256 eventId) 
        external 
        onlyEventCreator(eventId)
        nonReentrant
        whenNotPaused
    {
        releaseFunds(eventId);
    }

    /**
     * @dev Emergency withdraw (only owner, when paused)
     * @param eventId The event ID
     */
    function emergencyWithdraw(uint256 eventId) 
        external 
        onlyOwner
        escrowExists(eventId)
        whenPaused
        nonReentrant
    {
        EscrowData storage escrow = escrows[eventId];
        require(escrow.depositedAmount > 0, "No funds to withdraw");

        uint256 amount = escrow.depositedAmount;
        escrow.depositedAmount = 0;
        escrow.isLocked = true;
        escrow.updatedAt = block.timestamp;

        payable(owner()).transfer(amount);
        emit EmergencyWithdraw(eventId, owner(), amount);
    }

    /**
     * @dev Lock/unlock escrow (only owner)
     * @param eventId The event ID
     * @param locked Whether to lock or unlock
     */
    function setEscrowLock(uint256 eventId, bool locked) 
        external 
        onlyOwner
        escrowExists(eventId)
    {
        escrows[eventId].isLocked = locked;
        escrows[eventId].updatedAt = block.timestamp;
        emit EscrowLocked(eventId, locked);
    }

    /**
     * @dev Add authorized resolver
     * @param resolver Address to authorize
     */
    function addAuthorizedResolver(address resolver) external onlyOwner {
        require(resolver != address(0), "Invalid resolver address");
        authorizedResolvers[resolver] = true;
    }

    /**
     * @dev Remove authorized resolver
     * @param resolver Address to deauthorize
     */
    function removeAuthorizedResolver(address resolver) external onlyOwner {
        authorizedResolvers[resolver] = false;
    }

    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function getEscrowData(uint256 eventId) external view returns (EscrowData memory) {
        return escrows[eventId];
    }

    function getEventDeposits(uint256 eventId) external view returns (Deposit[] memory) {
        return eventDeposits[eventId];
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
               block.timestamp >= escrow.releaseTime &&
               events[eventId].status == EventTypes.EventStatus.COMPLETED;
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

    // Override to handle ETH transfers
    receive() external payable {
        // Reject direct ETH transfers
        revert("Direct ETH transfers not allowed");
    }

    fallback() external payable {
        // Reject fallback calls
        revert("Fallback not allowed");
    }

    // Resolve ContextUpgradeable diamond
    function _msgSender() internal view virtual override(ContextUpgradeable, ReventStorage) returns (address) {
        return ReventStorage._msgSender();
    }

    function _msgData() internal view virtual override(ContextUpgradeable, ReventStorage) returns (bytes calldata) {
        return ReventStorage._msgData();
    }
}
