// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Management.sol";
import "./Events.sol";
import "./Types.sol";

abstract contract EventAttendees is ReentrancyGuard, EventManagement {
    function _owner() internal view virtual returns (address);
    function registerForEvent(uint256 eventId)
        external
        payable
        nonReentrant
        eventExists(eventId)
        eventIsActive(eventId)
        eventNotFull(eventId)
        notAlreadyRegistered(eventId)
    {
        EventTypes.EventData storage eventData = events[eventId];
        require(
            eventData.status == EventTypes.EventStatus.PUBLISHED,
            "Event is not open for registration"
        );
        if (eventData.status == EventTypes.EventStatus.LIVE) {
          startLiveEvent(eventId);
        }
        require(msg.value == eventData.registrationFee, "Incorrect registration fee");

        string memory confirmationCode = _generateConfirmationCode(eventId, msg.sender);

        attendees[eventId][msg.sender] = EventTypes.AttendeeData({
            attendeeAddress: msg.sender,
            eventId: eventId,
            confirmationCode: confirmationCode,
            isConfirmed: false,
            hasAttended: false,
            registeredAt: block.timestamp,
            confirmedAt: 0
        });

        eventData.currentAttendees++;
        eventAttendees[eventId].push(msg.sender);

        uint256 platformFeeAmount = (msg.value * platformFee) / 10000;
        uint256 creatorAmount = msg.value - platformFeeAmount;

        address recipient = feeRecipient == address(0) ? _owner() : feeRecipient;
        payable(recipient).transfer(platformFeeAmount);
        payable(eventData.creator).transfer(creatorAmount);

        emit EventEvents.AttendeeRegistered(eventId, msg.sender, confirmationCode, msg.value);
    }

    function confirmAttendance(
        uint256 eventId,
        address attendeeAddress,
        string memory confirmationCode
    ) external eventExists(eventId) onlyEventCreator(eventId) {
        EventTypes.AttendeeData storage attendee = attendees[eventId][attendeeAddress];
        require(attendee.attendeeAddress != address(0), "Attendee not found");
        require(!attendee.isConfirmed, "Attendance already confirmed");
        require(keccak256(bytes(attendee.confirmationCode)) == keccak256(bytes(confirmationCode)), "Invalid confirmation code");

        attendee.isConfirmed = true;
        attendee.confirmedAt = block.timestamp;

        emit EventEvents.AttendeeConfirmed(eventId, attendeeAddress, confirmationCode);
    }

    function markAttended(uint256 eventId, address attendeeAddress) external eventExists(eventId) onlyEventCreator(eventId) {
        EventTypes.AttendeeData storage attendee = attendees[eventId][attendeeAddress];
        require(attendee.attendeeAddress != address(0), "Attendee not found");
        require(attendee.isConfirmed, "Attendance must be confirmed first");
        require(!attendee.hasAttended, "Already marked as attended");

        attendee.hasAttended = true;

        emit EventEvents.AttendeeAttended(eventId, attendeeAddress);
    }

    function _generateConfirmationCode(uint256 eventId, address attendee) internal virtual returns (string memory) {
        string memory baseCode = string(abi.encodePacked(
            uint2str(eventId),
            uint2str(uint256(uint160(attendee))),
            uint2str(block.timestamp)
        ));

        bytes32 hash = keccak256(abi.encodePacked(baseCode));
        string memory confirmationCode = _bytes32ToString(hash);

        while (usedConfirmationCodes[confirmationCode]) {
            hash = keccak256(abi.encodePacked(hash, block.timestamp));
            confirmationCode = _bytes32ToString(hash);
        }

        usedConfirmationCodes[confirmationCode] = true;
        return confirmationCode;
    }
}


