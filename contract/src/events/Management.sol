// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../utils/counter.sol";
import "./Modifiers.sol";
import "./Events.sol";
import "./Types.sol";
import "./InternalUtils.sol";
// import "../doma/interfaces/IDomaProxy.sol";
// import "../doma/interfaces/IOwnershipToken.sol";
import "./EventToken.sol";

abstract contract EventManagement is EventModifiers, EventInternalUtils, EventToken {
    using Counters for Counters.Counter;
    using EventTypes for EventTypes.EventData;

    event DomaConfigUpdated(address domaProxy, address ownershipToken, address trustedForwarder, uint256 registrarIanaId, string domaChainId);
    event DomaRequested(uint256 indexed eventId);
    event DomaClaimed(uint256 indexed eventId, uint256 tokenId);
    event DomaBridged(uint256 indexed eventId, string targetChainId, string targetOwnerAddress);

    // constructor(string memory uri) EventToken(uri) {}
    function _afterEventCreated(uint256 eventId) internal virtual {}

    function _linkDomaRequested(uint256 eventId) internal {
        eventToDomaStatus[eventId] = 1; // Requested
        emit DomaRequested(eventId);
    }

    function linkDomaMinted(uint256 eventId, uint256 tokenId) internal {
        // callable by off-chain agent or registrar role in a fuller design
        eventToDomaTokenId[eventId] = tokenId;
        eventToDomaStatus[eventId] = 2; // Minted
    }

    function linkDomaClaimed(uint256 eventId) internal{
        require(eventToDomaTokenId[eventId] != 0, "no token");
        eventToDomaStatus[eventId] = 3; // Claimed
        emit DomaClaimed(eventId, eventToDomaTokenId[eventId]);
    }

    function createEvent(
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee,
        bytes memory data
    ) external validRegistrationFee(registrationFee) returns (uint256) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(startTime > block.timestamp, "Start time must be in the future");
        require(endTime > startTime, "End time must be after start time");
        require(maxAttendees > 0, "Max attendees must be greater than 0");

        Counters.increment(_eventIds);
        uint256 eventId = Counters.current(_eventIds);

        events[eventId] = EventTypes.EventData({
            eventId: eventId,
            creator: _msgSender(),
            ipfsHash: ipfsHash,
            startTime: startTime,
            endTime: endTime,
            maxAttendees: maxAttendees,
            currentAttendees: 0,
            registrationFee: registrationFee,
            isActive: true,
            isLive: false,
            status: EventTypes.EventStatus.DRAFT,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        uint256 totalSupply = abi.decode(data, (uint256));
        creatorEvents[_msgSender()].push(eventId);
        mint(_msgSender(), eventId, totalSupply, bytes(ipfsHash));

        emit EventEvents.EventCreated(
            eventId,
            _msgSender(),
            ipfsHash,
            startTime,
            endTime,
            maxAttendees,
            registrationFee
        );

        return eventId;
    }


    function updateEvent(
        uint256 eventId,
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee,
        bytes memory data
    ) external eventExists(eventId) onlyEventCreator(eventId) validRegistrationFee(registrationFee) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(startTime > block.timestamp, "Start time must be in the future");
        require(endTime > startTime, "End time must be after start time");
        require(maxAttendees >= events[eventId].currentAttendees, "Max attendees cannot be less than current attendees");

        EventTypes.EventData storage eventData = events[eventId];
        eventData.ipfsHash = ipfsHash;
        eventData.startTime = startTime;
        eventData.endTime = endTime;
        eventData.maxAttendees = maxAttendees;
        eventData.registrationFee = registrationFee;
        eventData.updatedAt = block.timestamp;


        emit EventEvents.EventUpdated(
            eventId,
            _msgSender(),
            ipfsHash,
            startTime,
            endTime,
            maxAttendees,
            registrationFee
        );
    }

    function publishEvent(uint256 eventId) external eventExists(eventId) onlyEventCreator(eventId) {
        EventTypes.EventData storage eventData = events[eventId];
        require(eventData.status == EventTypes.EventStatus.DRAFT, "Event must be in DRAFT status to publish");

        EventTypes.EventStatus oldStatus = eventData.status;
        eventData.status = EventTypes.EventStatus.PUBLISHED;
        eventData.updatedAt = block.timestamp;

        emit EventEvents.EventStatusChanged(eventId, oldStatus, EventTypes.EventStatus.PUBLISHED);
    }

    function startLiveEvent(uint256 eventId) public eventExists(eventId) 
    // onlyEventCreator(eventId) 
    {
        EventTypes.EventData storage eventData = events[eventId];
        require(eventData.status == EventTypes.EventStatus.PUBLISHED, "Event must be PUBLISHED to start live");
        require(block.timestamp >= eventData.startTime, "Event start time has not been reached");

        EventTypes.EventStatus oldStatus = eventData.status;
        eventData.status = EventTypes.EventStatus.LIVE;
        eventData.isLive = true;
        eventData.updatedAt = block.timestamp;

        emit EventEvents.EventStatusChanged(eventId, oldStatus, EventTypes.EventStatus.LIVE);
    }

    function endEvent(uint256 eventId) external eventExists(eventId) onlyEventCreator(eventId) {
        EventTypes.EventData storage eventData = events[eventId];
        require(eventData.status == EventTypes.EventStatus.LIVE, "Event must be LIVE to end");

        EventTypes.EventStatus oldStatus = eventData.status;
        eventData.status = EventTypes.EventStatus.COMPLETED;
        eventData.isLive = false;
        eventData.updatedAt = block.timestamp;

        emit EventEvents.EventStatusChanged(eventId, oldStatus, EventTypes.EventStatus.COMPLETED);
    }

    function cancelEvent(uint256 eventId) external eventExists(eventId) onlyEventCreator(eventId) {
        EventTypes.EventData storage eventData = events[eventId];
        require(eventData.status != EventTypes.EventStatus.COMPLETED, "Cannot cancel completed event");

        EventTypes.EventStatus oldStatus = eventData.status;
        eventData.status = EventTypes.EventStatus.CANCELLED;
        eventData.isActive = false;
        eventData.isLive = false;
        eventData.updatedAt = block.timestamp;

        emit EventEvents.EventStatusChanged(eventId, oldStatus, EventTypes.EventStatus.CANCELLED);
    }
}


