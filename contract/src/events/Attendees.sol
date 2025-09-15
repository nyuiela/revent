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
			eventData.status == EventTypes.EventStatus.PUBLISHED || eventData.status == EventTypes.EventStatus.LIVE,
			"Event is not open for registration"
		);
		if (eventData.status == EventTypes.EventStatus.PUBLISHED) {
			_startLiveEvent(eventId);
		}
		require(msg.value == eventData.registrationFee, "Incorrect registration fee");

		address sender = _msgSender();
		string memory confirmationCode = _generateConfirmationCode(eventId, sender);

		attendees[eventId][sender] = EventTypes.AttendeeData({
			attendeeAddress: sender,
			eventId: eventId,
			confirmationCode: confirmationCode,
			isConfirmed: false,
			hasAttended: false,
			registeredAt: block.timestamp,
			confirmedAt: 0
		});

		eventData.currentAttendees++;
		eventAttendees[eventId].push(sender);

		uint256 platformFeeAmount = (msg.value * platformFee) / 10000;
		uint256 creatorAmount = msg.value - platformFeeAmount;

		address recipient = feeRecipient == address(0) ? _owner() : feeRecipient;
		payable(recipient).transfer(platformFeeAmount);
		payable(eventData.creator).transfer(creatorAmount);

		emit EventEvents.AttendeeRegistered(eventId, sender, confirmationCode, msg.value);
	}

	function confirmAttendance(
		uint256 eventId,
		string memory confirmationCode
	) external eventExists(eventId) {
		require(eventConfirmationHashes[eventId] != bytes32(0), "Event confirmation code not set");
		require(eventConfirmationHashes[eventId] == keccak256(bytes(confirmationCode)), "Invalid confirmation code");
		
		EventTypes.AttendeeData storage attendee = attendees[eventId][msg.sender];
		require(attendee.attendeeAddress != address(0), "Attendee not found");
		require(!attendee.isConfirmed, "Attendance already confirmed");

		attendee.isConfirmed = true;
		attendee.confirmedAt = block.timestamp;

		emit EventEvents.AttendeeConfirmed(eventId, msg.sender, confirmationCode);
	}


	function markAttended(uint256 eventId, address attendeeAddress) external eventExists(eventId) onlyEventCreator(eventId) {
		EventTypes.AttendeeData storage attendee = attendees[eventId][attendeeAddress];
		require(attendee.attendeeAddress != address(0), "Attendee not found");
		require(!attendee.hasAttended, "Already marked as attended");

		attendee.hasAttended = true;

		emit EventEvents.AttendeeAttended(eventId, attendeeAddress);
	}

	function generateEventConfirmationCode(uint256 eventId) external eventExists(eventId) onlyEventCreator(eventId) {
		require(eventConfirmationHashes[eventId] == bytes32(0), "Confirmation code already generated");

		string memory confirmationCode = _generateEventConfirmationCode(eventId);
		bytes32 confirmationCodeHash = keccak256(bytes(confirmationCode));
		eventConfirmationHashes[eventId] = confirmationCodeHash;

		emit EventEvents.EventConfirmationCodeGenerated(eventId, msg.sender, confirmationCodeHash);
	}

	function getEventConfirmationCodeHash(uint256 eventId) external view eventExists(eventId) returns (bytes32) {
		return eventConfirmationHashes[eventId];
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

	function _generateEventConfirmationCode(uint256 eventId) internal virtual returns (string memory) {
		EventTypes.EventData storage eventData = events[eventId];
		string memory baseCode = string(abi.encodePacked(
			uint2str(eventId),
			uint2str(uint256(uint160(eventData.creator))),
			uint2str(block.timestamp),
			"EVENT_CONFIRM"
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


