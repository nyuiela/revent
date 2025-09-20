// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {EventsV1} from "../../src/v1/core/EventsV1.sol";
import {TicketsV1} from "../../src/v1/core/TicketsV1.sol";
import {EscrowV1} from "../../src/v1/core/EscrowV1.sol";
import {ReventProxy} from "../../src/v0.1/ReventProxy.sol";

/**
 * @title DeployDirect
 * @dev Deployment script for direct contract deployment (no module manager)
 * @dev Deploys each contract separately with proxy pattern
 */
contract DeployDirect is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying Revent V1 Direct Contracts...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy EventsV1
        console.log("\nDeploying EventsV1...");
        EventsV1 eventsImpl = new EventsV1();
        console.log("EventsV1 implementation deployed at:", address(eventsImpl));
        
        // Deploy EventsV1 proxy
        bytes memory eventsInitData = abi.encodeWithSelector(
            EventsV1.initialize.selector
        );
        ReventProxy eventsProxy = new ReventProxy(address(eventsImpl), eventsInitData);
        console.log("EventsV1 proxy deployed at:", address(eventsProxy));
        
        // Deploy TicketsV1
        console.log("\nDeploying TicketsV1...");
        TicketsV1 ticketsImpl = new TicketsV1();
        console.log("TicketsV1 implementation deployed at:", address(ticketsImpl));
        
        // Deploy TicketsV1 proxy
        bytes memory ticketsInitData = abi.encodeWithSelector(
            TicketsV1.initialize.selector
        );
        ReventProxy ticketsProxy = new ReventProxy(address(ticketsImpl), ticketsInitData);
        console.log("TicketsV1 proxy deployed at:", address(ticketsProxy));
        
        // Deploy EscrowV1
        console.log("\nDeploying EscrowV1...");
        EscrowV1 escrowImpl = new EscrowV1();
        console.log("EscrowV1 implementation deployed at:", address(escrowImpl));
        
        // Deploy EscrowV1 proxy
        bytes memory escrowInitData = abi.encodeWithSelector(
            EscrowV1.initialize.selector
        );
        ReventProxy escrowProxy = new ReventProxy(address(escrowImpl), escrowInitData);
        console.log("EscrowV1 proxy deployed at:", address(escrowProxy));
        
        // Set up cross-references
        console.log("\nSetting up cross-references...");
        
        // Get contract instances
        EventsV1 events = EventsV1(payable(address(eventsProxy)));
        TicketsV1 tickets = TicketsV1(payable(address(ticketsProxy)));
        EscrowV1 escrow = EscrowV1(payable(address(escrowProxy)));
        
        // Set contract addresses
        tickets.setContractAddresses(address(events), address(escrow));
        escrow.setContractAddresses(address(events), address(tickets));
        
        console.log("Cross-references set successfully!");
        
        vm.stopBroadcast();
        
        console.log("\nDeployment completed successfully!");
        console.log("EventsV1 proxy:", address(eventsProxy));
        console.log("EventsV1 implementation:", address(eventsImpl));
        console.log("TicketsV1 proxy:", address(ticketsProxy));
        console.log("TicketsV1 implementation:", address(ticketsImpl));
        console.log("EscrowV1 proxy:", address(escrowProxy));
        console.log("EscrowV1 implementation:", address(escrowImpl));
    }
}
