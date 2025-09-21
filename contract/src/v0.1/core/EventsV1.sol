// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {EventTypes} from "../../v0.1/structs/Types.sol";
import {Counters} from "../../v0.1/utils/counter.sol";
import {IEventsV1} from "../interfaces/IEventsV1.sol";
import {IEscrowV1} from "../interfaces/IEscrowV1.sol";
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

/**
 * @title EventsV1
 * @dev Event management contract for Revent V1
 * @dev Handles event creation, publishing, and lifecycle management
 */
contract EventsV1 is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    IEventsV1,
    ERC1155Upgradeable
{
    using Counters for Counters.Counter;
    // Events are defined in IEventsV1 interface

    // Storage
    mapping(uint256 => EventTypes.EventData) public events;
    mapping(address => uint256[]) public creatorEvents;
    mapping(uint256 => bool) public eventExistsMap;

    // Attendees storage
    mapping(uint256 => mapping(address => EventTypes.AttendeeData)) public attendees;
    mapping(uint256 => address[]) public eventAttendees;
    mapping(uint256 => bytes32) public confirmationCode;
    Counters.Counter private _eventIds;
    IEscrowV1 public escrowModule;

    // Modifiers
    modifier eventExists(uint256 eventId) {
        require(eventExistsMap[eventId], "Event does not exist");
        _;
    }

    modifier onlyEventCreator(uint256 eventId) {
        require(events[eventId].creator == _msgSender(), "Not event creator");
        _;
    }

    modifier validEventData(string memory ipfsHash, uint256 startTime, uint256 endTime, uint256 maxAttendees) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(startTime > block.timestamp, "Start time must be in the future");
        require(endTime > startTime, "End time must be after start time");
        require(maxAttendees > 0, "Max attendees must be greater than 0");
        _;
    }

    modifier eventIsActive(uint256 eventId) {
        require(events[eventId].isActive, "Event is not active");
        _;
    }

    modifier eventNotFull(uint256 eventId) {
        require(events[eventId].currentAttendees < events[eventId].maxAttendees, "Event is full");
        _;
    }

    modifier notAlreadyRegistered(uint256 eventId) {
        require(attendees[eventId][_msgSender()].attendeeAddress == address(0), "Already registered for this event");
        _;
    }

    // Initialization
    function __EventsV1_init() internal onlyInitializing {
        __Ownable_init(_msgSender());
        __Pausable_init();
        __ReentrancyGuard_init();
        __ERC1155_init("");
    }

    function initialize(string memory _uri) external initializer {
        // Initialize without onlyInitializing modifier for direct calls
        _transferOwnership(_msgSender());
        // __EventsV1_init();
        __ERC1155_init(_uri);
        // Note: Pausable and ReentrancyGuard don't need explicit initialization
        // as they are already initialized in the constructor
    }

    function setEscrow(address _escrowModule) external onlyOwner {
        require(_escrowModule != address(0), "Invalid escrow module address");
        address oldModule = address(escrowModule);
        escrowModule = IEscrowV1(payable(_escrowModule));
        emit ModuleUpdated("EscrowV1", oldModule, _escrowModule);
    }

    /**
     * @dev Create a new event
     */
    function createEvent(
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        bool isVIP,
        bytes memory data,
        string memory slug
    ) external whenNotPaused validEventData(ipfsHash, startTime, endTime, maxAttendees) returns (uint256) {
        Counters.increment(_eventIds);
        uint256 eventId = Counters.current(_eventIds);

        events[eventId] = EventTypes.EventData({
            eventId: eventId,
            creator: msg.sender,
            ipfsHash: ipfsHash,
            startTime: startTime,
            endTime: endTime,
            maxAttendees: maxAttendees,
            currentAttendees: 0,
            isVIP: isVIP,
            isActive: true,
            isLive: false,
            status: EventTypes.EventStatus.DRAFT,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        // IEscrowV1(escrowModule).createEscrow(eventId);
        eventExistsMap[eventId] = true;
        _mint(msg.sender, eventId, 1, data);
        creatorEvents[_msgSender()].push(eventId);
        // data helps updated the event in future releases.

        emit EventCreated(eventId, _msgSender(), ipfsHash, startTime, endTime, maxAttendees, 0, slug);

        return eventId;
    }

    /**
     * @dev Publish an event (change status from DRAFT to PUBLISHED)
     */
    function publishEvent(uint256 eventId) external eventExists(eventId) onlyEventCreator(eventId) whenNotPaused {
        require(events[eventId].status == EventTypes.EventStatus.DRAFT, "Event must be in draft status");

        EventTypes.EventStatus oldStatus = events[eventId].status;
        events[eventId].status = EventTypes.EventStatus.PUBLISHED;
        events[eventId].updatedAt = block.timestamp;

        emit EventStatusChanged(eventId, oldStatus, events[eventId].status);
    }

    /**
     * @dev Start a live event (change status from PUBLISHED to LIVE)
     */
    function startLiveEvent(uint256 eventId) external eventExists(eventId) whenNotPaused {
        require(events[eventId].status == EventTypes.EventStatus.PUBLISHED, "Event must be published");
        require(block.timestamp >= events[eventId].startTime, "Event has not started yet");
        require(
            events[eventId].creator == _msgSender() || attendees[eventId][_msgSender()].attendeeAddress == _msgSender(),
            "Not event creator or attendee"
        );

        EventTypes.EventStatus oldStatus = events[eventId].status;
        events[eventId].status = EventTypes.EventStatus.LIVE;
        events[eventId].updatedAt = block.timestamp;

        emit EventStatusChanged(eventId, oldStatus, events[eventId].status);
    }

    /**
     * @dev End an event (change status from LIVE to COMPLETED)
     */
    function endEvent(uint256 eventId) external eventExists(eventId) onlyEventCreator(eventId) whenNotPaused {
        require(events[eventId].status == EventTypes.EventStatus.LIVE, "Event must be live");
        require(block.timestamp >= events[eventId].endTime, "Event has not ended yet");

        EventTypes.EventStatus oldStatus = events[eventId].status;
        events[eventId].status = EventTypes.EventStatus.COMPLETED;
        events[eventId].updatedAt = block.timestamp;

        emit EventStatusChanged(eventId, oldStatus, events[eventId].status);
    }

    /**
     * @dev Cancel an event
     */
    function cancelEvent(uint256 eventId) external eventExists(eventId) onlyEventCreator(eventId) whenNotPaused {
        require(
            events[eventId].status == EventTypes.EventStatus.DRAFT
                || events[eventId].status == EventTypes.EventStatus.PUBLISHED,
            "Event cannot be cancelled in current status"
        );

        EventTypes.EventStatus oldStatus = events[eventId].status;
        events[eventId].status = EventTypes.EventStatus.CANCELLED;
        events[eventId].updatedAt = block.timestamp;

        emit EventStatusChanged(eventId, oldStatus, events[eventId].status);
    }

    /**
     * @dev Update event details
     */
    function updateEvent(
        uint256 eventId,
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        string memory slug
    )
        external
        eventExists(eventId)
        onlyEventCreator(eventId)
        whenNotPaused
        validEventData(ipfsHash, startTime, endTime, maxAttendees)
    {
        require(events[eventId].status == EventTypes.EventStatus.DRAFT, "Event must be in draft status");
        require(events[eventId].currentAttendees <= maxAttendees, "Cannot reduce max attendees below current attendees");

        events[eventId].ipfsHash = ipfsHash;
        events[eventId].startTime = startTime;
        events[eventId].endTime = endTime;
        events[eventId].maxAttendees = maxAttendees;
        events[eventId].updatedAt = block.timestamp;

        emit EventUpdated(eventId, ipfsHash, startTime, endTime, maxAttendees, slug);
    }

    /**
     * @dev Update current attendees count (called by other contracts)
     */
    function updateAttendeesCount(uint256 eventId, uint256 newCount) external onlyOwner {
        require(eventExistsMap[eventId], "Event does not exist");
        events[eventId].currentAttendees = newCount;
        events[eventId].updatedAt = block.timestamp;
    }

    // View functions
    function getEvent(uint256 eventId) external view eventExists(eventId) returns (EventTypes.EventData memory) {
        return events[eventId];
    }

    function getCreatorEvents(address creator) external view returns (uint256[] memory) {
        return creatorEvents[creator];
    }

    function getEventCount() external view returns (uint256) {
        return Counters.current(_eventIds);
    }

    function isEventActive(uint256 eventId) external view eventExists(eventId) returns (bool) {
        return events[eventId].isActive;
    }

    function eventExistsCheck(uint256 eventId) external view returns (bool) {
        return eventExistsMap[eventId];
    }

    function getEventStatus(uint256 eventId) external view eventExists(eventId) returns (EventTypes.EventStatus) {
        return events[eventId].status;
    }

    // Attendees functions
    function registerForEvent(uint256 eventId, bytes memory data) external returns (uint256 fee) {
        EventTypes.EventData memory eventData_ = events[eventId];
        if (eventData_.isVIP && data.length > 0) {
            (uint256 ticketId, uint256 quantity) = abi.decode(data, (uint256, uint256));
            // For VIP events with paid tickets, trigger purchase which deposits into escrow
            // Note: This would need to call the tickets contract
            // this.purchaseTicket{value: tickets[ticketId].price * quantity}(ticketId, quantity);
        }
        _registerForEvent(eventData_.eventId);
        return 0;
    }

    function _registerForEvent(uint256 eventId)
        internal
        nonReentrant
        eventExists(eventId)
        eventIsActive(eventId)
        eventNotFull(eventId)
        notAlreadyRegistered(eventId)
    {
        EventTypes.EventData storage eventData = events[eventId];
        require(
            eventData.status == EventTypes.EventStatus.PUBLISHED || eventData.status == EventTypes.EventStatus.LIVE,
            "Event is not open for registration"
        );

        address sender = _msgSender();

        attendees[eventId][sender] = EventTypes.AttendeeData({
            attendeeAddress: sender,
            eventId: eventId,
            isConfirmed: false,
            hasAttended: false,
            registeredAt: block.timestamp,
            confirmedAt: 0
        });

        eventData.currentAttendees++;
        eventAttendees[eventId].push(sender);

        emit AttendeeRegistered(eventId, sender, "", 0);
    }

    function confirmAttendance(
        uint256 eventId,
        string memory _confirmationCode //QR code
    ) external eventExists(eventId) {
        EventTypes.AttendeeData storage attendee = attendees[eventId][msg.sender];
        EventTypes.EventData storage eventData = events[eventId];
        if (eventData.status == EventTypes.EventStatus.PUBLISHED) {
            this.startLiveEvent(eventId);
        }
        require(attendee.attendeeAddress != address(0), "Attendee not found");
        require(!attendee.isConfirmed, "Attendance already confirmed");
        bytes32 hash = keccak256(abi.encodePacked(eventId, _confirmationCode));
        require(hash == confirmationCode[eventId], "Invalid confirmation code");

        attendee.isConfirmed = true;
        attendee.hasAttended = true;
        attendee.confirmedAt = block.timestamp;
        _mint(msg.sender, eventId, 1, "");

        emit AttendeeConfirmed(eventId, msg.sender, _confirmationCode);
    }

    function markAttended(uint256 eventId, address attendeeAddress)
        external
        eventExists(eventId)
        onlyEventCreator(eventId)
    {
        EventTypes.AttendeeData storage attendee = attendees[eventId][attendeeAddress];
        require(attendee.attendeeAddress != address(0), "Attendee not found");
        require(!attendee.isConfirmed && !attendee.hasAttended, "Attendance already marked");

        attendee.isConfirmed = true;
        attendee.hasAttended = true;
        attendee.confirmedAt = block.timestamp;
        bytes memory data = abi.encode(attendeeAddress, eventId, block.timestamp);
        _mint(attendeeAddress, eventId, 1, data);
        emit AttendeeAttended(eventId, attendeeAddress);
    }

    function setConfirmationCode(uint256 eventId, string memory code) external onlyEventCreator(eventId) {
        confirmationCode[eventId] = keccak256(abi.encodePacked(eventId, code));
    }

    function getAttendee(uint256 eventId, address attendeeAddress)
        external
        view
        returns (EventTypes.AttendeeData memory)
    {
        return attendees[eventId][attendeeAddress];
    }

    function getEventAttendees(uint256 eventId) external view returns (address[] memory) {
        return eventAttendees[eventId];
    }

    function getAttendeeCount(uint256 eventId) external view returns (uint256) {
        return eventAttendees[eventId].length;
    }

    function deleteEvent(uint256 eventId) external onlyOwner {
        delete events[eventId];
        delete eventExistsMap[eventId];
        delete eventAttendees[eventId];
        delete confirmationCode[eventId];
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
