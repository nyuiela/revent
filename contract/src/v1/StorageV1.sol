// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "../events/Storage.sol";

abstract contract StorageV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable, ERC2771ContextUpgradeable, EventStorage {
    // V1 specific events
    event EventCreated(
        uint256 indexed eventId,
        address indexed creator,
        string ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee
    );

    event EventUpdated(
        uint256 indexed eventId,
        address indexed creator,
        string ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee
    );

    event EventStatusChanged(
        uint256 indexed eventId,
        EventTypes.EventStatus oldStatus,
        EventTypes.EventStatus newStatus
    );

    event AttendeeRegistered(
        uint256 indexed eventId,
        address indexed attendee,
        string confirmationCode,
        uint256 registrationFee
    );

    event AttendeeConfirmed(
        uint256 indexed eventId,
        address indexed attendee,
        string confirmationCode
    );

    event AttendeeAttended(
        uint256 indexed eventId,
        address indexed attendee
    );

    event TicketCreated(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        string name,
        string ticketType,
        uint256 price,
        string currency,
        uint256 totalQuantity,
        string[] perks
    );

    event TicketPurchased(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPrice
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event TrustedForwarderUpdated(address oldForwarder, address newForwarder);

    function __StorageV1_init() internal onlyInitializing {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {}

    function _msgSender() internal view virtual override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (address) {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData() internal view virtual override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (bytes calldata) {
        return ERC2771ContextUpgradeable._msgData();
    }

    function _contextSuffixLength() internal view virtual override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (uint256) {
        return ERC2771ContextUpgradeable._contextSuffixLength();
    }

    function isTrustedForwarder(address forwarder) public view virtual override returns (bool) {
        return forwarder == trustedForwarderAddr && forwarder != address(0);
    }

    function setTrustedForwarder(address forwarder) external onlyOwner {
        address oldForwarder = trustedForwarderAddr;
        trustedForwarderAddr = forwarder;
        emit TrustedForwarderUpdated(oldForwarder, forwarder);
    }

    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    function setRegistrationFeeLimits(uint256 minFee, uint256 maxFee) external onlyOwner {
        require(minFee < maxFee, "Invalid limits");
        minRegistrationFee = minFee;
        maxRegistrationFee = maxFee;
    }
}