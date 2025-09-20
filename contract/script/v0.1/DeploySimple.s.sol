// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {EventsV1} from "../../src/v0.1/core/EventsV1.sol";
import {TicketsV1} from "../../src/v0.1/core/TicketsV1.sol";
import {EscrowV1} from "../../src/v0.1/core/EscrowV1.sol";

/**
 * @title DeploySimple
 * @dev Simple deployment script for direct contract deployment (no proxies)
 * @dev Deploys each contract separately
 */
contract DeploySimple is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Revent V1 Simple Contracts...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy EventsV1
        console.log("\nDeploying EventsV1...");
        EventsV1 events = new EventsV1();
        console.log("EventsV1 deployed at:", address(events));

        // Deploy TicketsV1
        console.log("\nDeploying TicketsV1...");
        TicketsV1 tickets = new TicketsV1();
        console.log("TicketsV1 deployed at:", address(tickets));

        // Deploy EscrowV1
        console.log("\nDeploying EscrowV1...");
        EscrowV1 escrow = new EscrowV1();
        console.log("EscrowV1 deployed at:", address(escrow));

        // Set up cross-references
        console.log("\nSetting up cross-references...");

        // Set contract addresses
        tickets.setContractAddresses(address(events), address(escrow));
        escrow.setContractAddresses(address(events), address(tickets));

        console.log("Cross-references set successfully!");

        vm.stopBroadcast();

        console.log("\nDeployment completed successfully!");
        console.log("EventsV1:", address(events));
        console.log("TicketsV1:", address(tickets));
        console.log("EscrowV1:", address(escrow));
    }
}
