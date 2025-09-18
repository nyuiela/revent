// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {StreamEvents} from "../src/event.sol";

contract DeployStreamEvents is Script {
    StreamEvents public streamEvents;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying StreamEvents contract...");
        console.log("Network:", vm.toString(block.chainid));
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", vm.toString(deployer.balance), "wei");
        console.log("Gas price:", vm.toString(tx.gasprice), "wei");
        
        // Check if deployer has sufficient balance
        require(deployer.balance > 0.01 ether, "Insufficient balance for deployment");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the StreamEvents contract
        streamEvents = new StreamEvents("https://api.streamevents.io/token");
        
        vm.stopBroadcast();

        console.log("\n Deployment Summary:");
        console.log("   Contract address:", address(streamEvents));
        console.log("   Owner:", streamEvents.owner());
        console.log("   Platform fee:", streamEvents.platformFee(), "basis points (2.5%)");
        console.log("   Min registration fee:", vm.toString(streamEvents.minRegistrationFee()), "wei");
        console.log("   Max registration fee:", vm.toString(streamEvents.maxRegistrationFee()), "wei");
        console.log("   Fee recipient:", streamEvents.feeRecipient());
        
        // Verify deployment
        console.log("\n Verifying deployment...");
        require(streamEvents.owner() == deployer, " Owner not set correctly");
        require(streamEvents.feeRecipient() == deployer, "Fee recipient not set correctly");
        require(streamEvents.platformFee() == 250, "Platform fee not set correctly");
        require(streamEvents.minRegistrationFee() == 0.001 ether, "Min registration fee not set correctly");
        require(streamEvents.maxRegistrationFee() == 1 ether, "Max registration fee not set correctly");
        
        console.log("All verifications passed!");
        console.log("\n StreamEvents contract deployed successfully!");
        
        // Save deployment info for verification
        string memory deploymentInfo = string.concat(
            "Deployment Info:\n",
            "Contract: ", vm.toString(address(streamEvents)), "\n",
            "Network: ", vm.toString(block.chainid), "\n",
            "Owner: ", vm.toString(deployer), "\n",
            "Timestamp: ", vm.toString(block.timestamp)
        );
        
        vm.writeFile("deployment-info.txt", deploymentInfo);
        console.log("\n Deployment info saved to deployment-info.txt");
    }
}
