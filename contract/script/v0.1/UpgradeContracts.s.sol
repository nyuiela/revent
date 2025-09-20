// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {EventsV1} from "../../src/v0.1/core/EventsV1.sol";
import {TicketsV1} from "../../src/v0.1/core/TicketsV1.sol";
import {EscrowV1} from "../../src/v0.1/core/EscrowV1.sol";
import {UpgradeableProxy} from "../../src/v0.1/core/UpgradeableProxy.s.sol";

/**
 * @title UpgradeContracts
 * @dev Script to upgrade individual contracts in the modular architecture
 * @dev This demonstrates how to upgrade each contract independently
 */
contract UpgradeContracts is Script {
    // These addresses would be set after initial deployment
    address constant EVENTS_PROXY = address(0); // Set after deployment
    address constant TICKETS_PROXY = address(0); // Set after deployment
    address constant ESCROW_PROXY = address(0); // Set after deployment
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Upgrading Revent V1 Contracts...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Example: Upgrade EventsV1
        if (EVENTS_PROXY != address(0)) {
            console.log("\nUpgrading EventsV1...");
            
            // Deploy new EventsV1 implementation
            EventsV1 newEventsImpl = new EventsV1();
            console.log("New EventsV1 implementation deployed at:", address(newEventsImpl));
            
            // Upgrade the proxy to point to new implementation
            UpgradeableProxy eventsProxy = UpgradeableProxy(payable(EVENTS_PROXY));
            eventsProxy.upgradeTo(address(newEventsImpl));
            console.log("EventsV1 proxy upgraded to new implementation");
        }
        
        // Example: Upgrade TicketsV1
        if (TICKETS_PROXY != address(0)) {
            console.log("\nUpgrading TicketsV1...");
            
            // Deploy new TicketsV1 implementation
            TicketsV1 newTicketsImpl = new TicketsV1();
            console.log("New TicketsV1 implementation deployed at:", address(newTicketsImpl));
            
            // Upgrade the proxy to point to new implementation
            UpgradeableProxy ticketsProxy = UpgradeableProxy(payable(TICKETS_PROXY));
            ticketsProxy.upgradeTo(address(newTicketsImpl));
            console.log("TicketsV1 proxy upgraded to new implementation");
        }
        
        // Example: Upgrade EscrowV1
        if (ESCROW_PROXY != address(0)) {
            console.log("\nUpgrading EscrowV1...");
            
            // Deploy new EscrowV1 implementation
            EscrowV1 newEscrowImpl = new EscrowV1();
            console.log("New EscrowV1 implementation deployed at:", address(newEscrowImpl));
            
            // Upgrade the proxy to point to new implementation
            UpgradeableProxy escrowProxy = UpgradeableProxy(payable(ESCROW_PROXY));
            escrowProxy.upgradeTo(address(newEscrowImpl));
            console.log("EscrowV1 proxy upgraded to new implementation");
        }
        
        vm.stopBroadcast();
        
        console.log("\nUpgrade completed successfully!");
        console.log("Note: Update proxy addresses in this script after deployment");
    }
    
    /**
     * @dev Helper function to upgrade a specific contract
     * @param proxyAddress The address of the proxy to upgrade
     * @param newImplementation The address of the new implementation
     */
    function upgradeContract(address proxyAddress, address newImplementation) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        UpgradeableProxy proxy = UpgradeableProxy(payable(proxyAddress));
        proxy.upgradeTo(newImplementation);
        
        vm.stopBroadcast();
        
        console.log("Contract upgraded successfully!");
        console.log("Proxy:", proxyAddress);
        console.log("New implementation:", newImplementation);
    }
}
