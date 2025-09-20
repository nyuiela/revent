// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {IUpgradeableProxy} from "../interfaces/IUpgradeableProxy.sol";

/**
 * @title UpgradeableProxy
 * @dev A proxy that exposes upgrade functionality
 * @dev This allows for upgrading the implementation contract
 */
contract UpgradeableProxy is ERC1967Proxy, IUpgradeableProxy {
    /**
     * @dev Initialize the proxy with implementation
     * @param implementation Address of the implementation contract
     * @param data Encoded function call to initialize the implementation
     */
    constructor(address implementation, bytes memory data) ERC1967Proxy(implementation, data) {
        // Admin is set in the implementation contract
        ERC1967Utils.changeAdmin(msg.sender);
    }

    /**
     * @dev Returns the current implementation address
     */
    function getImplementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    /**
     * @dev Upgrade the implementation contract
     * @param newImplementation Address of the new implementation contract
     */
    function upgradeTo(address newImplementation) external {
        require(msg.sender == ERC1967Utils.getAdmin(), "Only admin can upgrade");
        ERC1967Utils.upgradeToAndCall(newImplementation, "");
    }

    /**
     * @dev Upgrade the implementation contract with initialization data
     * @param newImplementation Address of the new implementation contract
     * @param data Initialization data for the new implementation
     */
    function upgradeToAndCall(address newImplementation, bytes calldata data) external {
        require(msg.sender == ERC1967Utils.getAdmin(), "Only admin can upgrade");
        ERC1967Utils.upgradeToAndCall(newImplementation, data);
    }

    /**
     * @dev Change the admin of the proxy
     * @param newAdmin Address of the new admin
     */
    function changeAdmin(address newAdmin) external {
        require(msg.sender == ERC1967Utils.getAdmin(), "Only admin can change admin");
        ERC1967Utils.changeAdmin(newAdmin);
    }

    /**
     * @dev Get the current admin
     */
    function getAdmin() external view returns (address) {
        return ERC1967Utils.getAdmin();
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        // Forward ETH to implementation
    }
}
