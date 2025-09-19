// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ManagementV1} from "./ManagementV1.sol";
import {TicketsV1} from "./TicketsV1.sol";
import {EventEvents} from "./Events.sol";
import {EventTypes} from "../structs/Types.sol";

contract AttendeesV1 is ManagementV1, TicketsV1 {
    // EventEvents
    // using EventTypes for EventTypes.EventData;
    // using EventTypes for EventTypes.AttendeeData;
    // using EventTypes for EventTypes.TicketData;

    function registerForEvent(uint256 eventId, bytes memory data) public returns (uint256 fee) {
        EventTypes.EventData memory eventData_ = events[eventId];
        if (eventData_.isVIP && data.length > 0) {
            (uint256 ticketId, uint256 quantity) = abi.decode(data, (uint256, uint256));
            // For VIP events with paid tickets, trigger purchase which deposits into escrow
            this.purchaseTicket{value: tickets[ticketId].price * quantity}(ticketId, quantity);
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

        emit EventEvents.AttendeeRegistered(eventId, sender, "", 0);
    }

    function confirmAttendance(
        uint256 eventId,
        string memory _confirmationCode //QR code
    ) external eventExists(eventId) {
        EventTypes.AttendeeData storage attendee = attendees[eventId][msg.sender];
        EventTypes.EventData storage eventData = events[eventId];
        if (eventData.status == EventTypes.EventStatus.PUBLISHED) {
            startLiveEvent(eventId);
        }
        require(attendee.attendeeAddress != address(0), "Attendee not found");
        require(!attendee.isConfirmed, "Attendance already confirmed");
        bytes32 hash = keccak256(abi.encodePacked(eventId, _confirmationCode));
        require(hash == confirmationCode[eventId], "Invalid confirmation code");

        attendee.isConfirmed = true;
        attendee.hasAttended = true;
        attendee.confirmedAt = block.timestamp;

        emit EventEvents.AttendeeConfirmed(eventId, msg.sender, _confirmationCode);
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

        emit EventEvents.AttendeeAttended(eventId, attendeeAddress);
    }
}
