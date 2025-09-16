// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import "./QueriesV1.sol";
import "./AttendeesV1.sol";
// import "./EventQueries.sol";
import "./Admin.sol";
import "./StorageV1.sol";

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
    constructor() ERC2771ContextUpgradeable(address(0)) {
        _disableInitializers();
    }

    function initialize(
        address trustedForwarder,
        address feeRecipient_,
        uint256 platformFee_
    ) public initializer {
        // __ReventStorage_init();
        __StorageV1_init();

        _transferOwnership(msg.sender);
        trustedForwarderAddr = trustedForwarder;
        feeRecipient = feeRecipient_;
        platformFee = platformFee_;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override(ReventStorage, UUPSUpgradeable) onlyOwner {}

    // V1 specific functions
    function pause() external onlyOwner {}

    function unpause() external onlyOwner {}

    // Version information
    function version() external pure returns (string memory) {
        return "0.1.0";
    }

    function getImplementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }
}
