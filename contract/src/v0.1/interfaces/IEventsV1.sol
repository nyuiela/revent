// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {EventTypes} from "../../v0.1/structs/Types.sol";

/**
 * @title IEventsV1
 * @dev Interface for EventsV1 contract
 * @dev Defines all external functions for event management and attendee functionality
 */
interface IEventsV1 {
    // Events
    event EventCreated(
        uint256 indexed eventId,
        address indexed creator,
        string ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee,
        string slug
    );
    event ModuleUpdated(string moduleType, address oldModule, address newModule);
    event EventStatusChanged(
        uint256 indexed eventId, EventTypes.EventStatus oldStatus, EventTypes.EventStatus newStatus
    );
    event EventUpdated(
        uint256 indexed eventId, string ipfsHash, uint256 startTime, uint256 endTime, uint256 maxAttendees
    );

    // Attendees events
    event AttendeeRegistered(uint256 indexed eventId, address indexed attendee, string confirmationCode, uint256 fee);
    event AttendeeConfirmed(uint256 indexed eventId, address indexed attendee, string confirmationCode);
    event AttendeeAttended(uint256 indexed eventId, address indexed attendee);

    // Event management functions
    function createEvent(
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        bool isVIP,
        bytes memory data,
        string memory slug
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

    function updateAttendeesCount(uint256 eventId, uint256 newCount) external;

    // Attendees functions
    function registerForEvent(uint256 eventId, bytes memory data) external returns (uint256 fee);
    function confirmAttendance(uint256 eventId, string memory _confirmationCode) external;
    function markAttended(uint256 eventId, address attendeeAddress) external;
    function setConfirmationCode(uint256 eventId, string memory code) external;

    // View functions
    function getEvent(uint256 eventId) external view returns (EventTypes.EventData memory);
    function getCreatorEvents(address creator) external view returns (uint256[] memory);
    function getEventCount() external view returns (uint256);
    function isEventActive(uint256 eventId) external view returns (bool);
    function eventExistsCheck(uint256 eventId) external view returns (bool);
    function getEventStatus(uint256 eventId) external view returns (EventTypes.EventStatus);

    // Attendees view functions
    function getAttendee(uint256 eventId, address attendeeAddress)
        external
        view
        returns (EventTypes.AttendeeData memory);
    function getEventAttendees(uint256 eventId) external view returns (address[] memory);
    function getAttendeeCount(uint256 eventId) external view returns (uint256);

    // Admin functions
    function pause() external;
    function unpause() external;

    // Version
    function version() external pure returns (string memory);
}
