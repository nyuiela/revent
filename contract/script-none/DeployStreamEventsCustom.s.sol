// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {StreamEvents} from "../src/event.sol";

contract DeployStreamEventsCustom is Script {
    StreamEvents public streamEvents;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Custom configuration - can be modified as needed
        uint256 customPlatformFee = 100; // 3% instead of default 2.5%
        uint256 customMinRegFee = 0.00000005 ether; 
        uint256 customMaxRegFee = 0.0000002 ether; 
        
        console.log("Deploying StreamEvents contract with custom configuration...");
        console.log("Network:", vm.toString(block.chainid));
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", vm.toString(deployer.balance), "wei");
        console.log("Custom Platform Fee:", customPlatformFee, "basis points (1%)");
        console.log("Custom Min Reg Fee:", vm.toString(customMinRegFee), "wei");
        console.log("Custom Max Reg Fee:", vm.toString(customMaxRegFee), "wei");
        
        // Check if deployer has sufficient balance
        require(deployer.balance > 0.01 ether, "Insufficient balance for deployment");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the StreamEvents contract
        streamEvents = new StreamEvents();
        
        // Update configuration after deployment
        streamEvents.updatePlatformFee(customPlatformFee);
        streamEvents.updateRegistrationFeeLimits(customMinRegFee, customMaxRegFee);
        
        vm.stopBroadcast();

        console.log("\n Deployment Summary:");
        console.log("   Contract address:", address(streamEvents));
        console.log("   Owner:", streamEvents.owner());
        console.log("   Platform fee:", streamEvents.platformFee(), "basis points");
        console.log("   Min registration fee:", vm.toString(streamEvents.minRegistrationFee()), "wei");
        console.log("   Max registration fee:", vm.toString(streamEvents.maxRegistrationFee()), "wei");
        console.log("   Fee recipient:", streamEvents.feeRecipient());
        
        // Verify custom configuration
        console.log("\n Verifying custom configuration...");
        require(streamEvents.owner() == deployer, " Owner not set correctly");
        require(streamEvents.feeRecipient() == deployer, " Fee recipient not set correctly");
        require(streamEvents.platformFee() == customPlatformFee, " Custom platform fee not set correctly");
        require(streamEvents.minRegistrationFee() == customMinRegFee, " Custom min registration fee not set correctly");
        require(streamEvents.maxRegistrationFee() == customMaxRegFee, " Custom max registration fee not set correctly");
        
        console.log(" All custom configurations verified!");
        console.log("\n StreamEvents contract deployed with custom settings!");
        
        // Save custom deployment info
        string memory deploymentInfo = string.concat(
            "Custom Deployment Info:\n",
            "Contract: ", vm.toString(address(streamEvents)), "\n",
            "Network: ", vm.toString(block.chainid), "\n",
            "Owner: ", vm.toString(deployer), "\n",
            "Platform Fee: ", vm.toString(customPlatformFee), " basis points\n",
            "Min Reg Fee: ", vm.toString(customMinRegFee), " wei\n",
            "Max Reg Fee: ", vm.toString(customMaxRegFee), " wei\n",
            "Timestamp: ", vm.toString(block.timestamp)
        );
        
        vm.writeFile("custom-deployment-info.txt", deploymentInfo);
        console.log("\n Custom deployment info saved to custom-deployment-info.txt");
    }
}
