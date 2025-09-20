// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IUpgradeableProxy
 * @dev Interface for UpgradeableProxy contract
 * @dev Defines all external functions for proxy management and upgrades
 */
interface IUpgradeableProxy {
    // Events
    event Upgraded(address indexed implementation);
    event AdminChanged(address previousAdmin, address newAdmin);

    // Upgrade functions
    function upgradeTo(address newImplementation) external;
    function upgradeToAndCall(address newImplementation, bytes calldata data) external;

    // Admin functions
    function changeAdmin(address newAdmin) external;

    // View functions
    function getImplementation() external view returns (address);
    function getAdmin() external view returns (address);

    // Receive function
    receive() external payable;
}
