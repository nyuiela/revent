// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./StorageV1.sol";
import "./ModifiersV1.sol";
import "../utils/InternalUtilsV1.sol";
import "./EscrowV1.sol";
import "./Events.sol";

abstract contract ManagementV1 is
    EscrowV1,
    // ReventStorage,
    // EventEvents,
    // EventTickets,
    EventModifiersV1,
    EventInternalUtilsV1
{
    function _afterEventCreated(uint256 eventId, bool is_vip) internal virtual {
        if (is_vip) {
            createEscrow(eventId);
        }
    }

    function _generateEventCode(
        uint256 eventId,
        string memory code
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(eventId, code));
    }

    //@todO ADD EVENT TYPE (FREE, VIP (TICKET))
    function createEvent(
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        bool isVIP,
        string memory code
    ) external returns (uint256) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(
            startTime > block.timestamp,
            "Start time must be in the future"
        );
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
            isVIP: isVIP,
            isActive: true,
            isLive: false,
            status: EventTypes.EventStatus.DRAFT,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        bytes32 eventConfirmationCode = _generateEventCode(eventId, code);
        creatorEvents[_msgSender()].push(eventId);
        confirmationCode[eventId] = eventConfirmationCode;
        _afterEventCreated(eventId, isVIP);

        emit EventEvents.EventCreated(
            eventId,
            _msgSender(),
            ipfsHash,
            startTime,
            endTime,
            maxAttendees,
            0
        );

        return eventId;
    }

    function updateEvent(
        uint256 eventId,
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee
    )
        external
        eventExists(eventId)
        onlyEventCreator(eventId)
        validRegistrationFee(registrationFee)
    {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(
            startTime > block.timestamp,
            "Start time must be in the future"
        );
        require(endTime > startTime, "End time must be after start time");
        require(
            maxAttendees >= events[eventId].currentAttendees,
            "Max attendees cannot be less than current attendees"
        );

        EventTypes.EventData storage eventData = events[eventId];
        eventData.ipfsHash = ipfsHash;
        eventData.startTime = startTime;
        eventData.endTime = endTime;
        eventData.maxAttendees = maxAttendees;
        // eventData.registrationFee = 0;
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

    function publishEvent(
        uint256 eventId
    ) external eventExists(eventId) onlyEventCreator(eventId) {
        EventTypes.EventData storage eventData = events[eventId];
        require(
            eventData.status == EventTypes.EventStatus.DRAFT,
            "Event must be in DRAFT status to publish"
        );

        EventTypes.EventStatus oldStatus = eventData.status;
        eventData.status = EventTypes.EventStatus.PUBLISHED;
        eventData.updatedAt = block.timestamp;

        emit EventEvents.EventStatusChanged(
            eventId,
            oldStatus,
            EventTypes.EventStatus.PUBLISHED
        );
    }

    function startLiveEvent(uint256 eventId) public eventExists(eventId) {
        EventTypes.EventData storage eventData = events[eventId];
        require(
            eventData.status == EventTypes.EventStatus.PUBLISHED,
            "Event must be PUBLISHED to start live"
        );
        require(
            block.timestamp >= eventData.startTime,
            "Event start time has not been reached"
        );

        EventTypes.EventStatus oldStatus = eventData.status;
        eventData.status = EventTypes.EventStatus.LIVE;
        eventData.isLive = true;
        eventData.updatedAt = block.timestamp;

        emit EventEvents.EventStatusChanged(
            eventId,
            oldStatus,
            EventTypes.EventStatus.LIVE
        );
    }

    function endEvent(
        uint256 eventId
    ) external eventExists(eventId) onlyEventCreator(eventId) {
        EventTypes.EventData storage eventData = events[eventId];
        require(
            eventData.status == EventTypes.EventStatus.LIVE,
            "Event must be LIVE to end"
        );

        EventTypes.EventStatus oldStatus = eventData.status;
        eventData.status = EventTypes.EventStatus.COMPLETED;
        eventData.isLive = false;
        eventData.updatedAt = block.timestamp;

        emit EventEvents.EventStatusChanged(
            eventId,
            oldStatus,
            EventTypes.EventStatus.COMPLETED
        );
    }

    function cancelEvent(
        uint256 eventId
    ) external eventExists(eventId) onlyEventCreator(eventId) {
        EventTypes.EventData storage eventData = events[eventId];
        require(
            eventData.status != EventTypes.EventStatus.COMPLETED,
            "Cannot cancel completed event"
        );

        EventTypes.EventStatus oldStatus = eventData.status;
        eventData.status = EventTypes.EventStatus.CANCELLED;
        eventData.isActive = false;
        eventData.isLive = false;
        eventData.updatedAt = block.timestamp;

        emit EventEvents.EventStatusChanged(
            eventId,
            oldStatus,
            EventTypes.EventStatus.CANCELLED
        );
    }
}

//@dev q wwhat if the event needs the funds to operate or ryn the event?
//@dev collateral method ? lockin some funds ------- buy etc
// event ends --- funds (run off funds)

//@dev lock in system, right event ends, succsful event give them their funds
// 20 people resgistere
// 15 join
// 5 saying it was good iyt catually happn
// 10 bro didnt happen
// 10 ove the 5
// threshold mechanism
// off-chain -
// time-stamp
// event
