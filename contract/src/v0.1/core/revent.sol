// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {QueriesV1} from "./QueriesV1.sol";
import {AttendeesV1} from "./AttendeesV1.sol";
// import "./EventQueries.sol";
import {Admin} from "./Admin.sol";
import {ReventStorage} from "./StorageV1.sol";
import {ManagementV1} from "./ManagementV1.sol";
import {TicketsV1} from "./TicketsV1.sol";
import {EscrowV1} from "./EscrowV1.sol";
import {EventTypes} from "../structs/Types.sol";
import {Counters} from "../utils/counter.sol";

// import "./EventTickets.sol";

/**
 * @title Revent
 * @dev V1 implementation with basic event management, attendees, and tickets system
 * @dev No Doma integration, no trading, no revenue sharing
 */
contract Revent is
    Initializable,
    UUPSUpgradeable,
    ReventStorage,
    QueriesV1,
    // AttendeesV1,
    ManagementV1,
    TicketsV1,
    //  EventQueries,
    Admin
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address trustedForwarder,
        address feeRecipient_,
        uint256 platformFee_
    ) public initializer {
        __StorageV1_init();
        __TicketsV1_init();

        _transferOwnership(msg.sender);
        trustedForwarderAddr = trustedForwarder;
        feeRecipient = feeRecipient_;
        platformFee = platformFee_;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override(ReventStorage, UUPSUpgradeable, Admin) onlyOwner {}

    // V1 uses pause/unpause from EscrowV1 (via inheritance)

    // Version information
    function version() external pure returns (string memory) {
        return "0.1.0";
    }

    function getImplementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    // Override conflicting functions
    function _msgSender() internal view override(ReventStorage, Admin, EscrowV1) returns (address) {
        return ReventStorage._msgSender();
    }

    function _msgData() internal view override(ReventStorage, Admin, EscrowV1) returns (bytes calldata) {
        return ReventStorage._msgData();
    }

    function isTrustedForwarder(address forwarder) public view override(ReventStorage, Admin) returns (bool) {
        return ReventStorage.isTrustedForwarder(forwarder);
    }

    function getEventTickets(uint256 eventId) external view override(QueriesV1, TicketsV1) returns (uint256[] memory) {
        return eventTickets[eventId];
    }

    function getTicket(uint256 ticketId) external view override(QueriesV1, TicketsV1) returns (EventTypes.TicketData memory) {
        require(
            ticketId > 0 && ticketId <= Counters.current(_ticketIds),
            "Invalid ticket ID"
        );
        return tickets[ticketId];
    }
}
