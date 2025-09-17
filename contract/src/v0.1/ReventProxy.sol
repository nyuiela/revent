// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title ReventProxy
 * @dev UUPS Upgradeable Proxy for Revent V0.1
 * @dev This proxy allows for secure upgrades while maintaining state
 */
contract ReventProxy is ERC1967Proxy {
    /**
     * @dev Initialize the proxy with implementation
     * @param implementation Address of the implementation contract
     * @param data Encoded function call to initialize the implementation
     */
    constructor(
        address implementation,
        bytes memory data
    ) ERC1967Proxy(implementation, data) {
        // Admin is set in the implementation contract
    }

    /**
     * @dev Returns the current implementation address
     */
    function getImplementation() external view returns (address) {
        return _implementation();
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        // Forward ETH to implementation
    }
}
