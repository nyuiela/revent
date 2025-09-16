// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {StreamEvents} from "../src/event.sol";

contract DeployAndTest is Script {
    StreamEvents public streamEvents;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying and Testing StreamEvents contract...");
        console.log("Network:", vm.toString(block.chainid));
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", vm.toString(deployer.balance), "wei");
        
        // Check if deployer has sufficient balance
        require(deployer.balance > 0.01 ether, "Insufficient balance for deployment");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the StreamEvents contract
        streamEvents = new StreamEvents();
        
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
        require(streamEvents.feeRecipient() == deployer, " Fee recipient not set correctly");
        require(streamEvents.platformFee() == 250, " Platform fee not set correctly");
        require(streamEvents.minRegistrationFee() == 0.001 ether, " Min registration fee not set correctly");
        require(streamEvents.maxRegistrationFee() == 1 ether, " Max registration fee not set correctly");
        
        console.log("All verifications passed!");
        
        // Basic functionality testing
        console.log("\n Testing basic functionality...");
        
        // Test 1: Create an event
        console.log("   Testing event creation...");
        string memory testIpfsHash = "QmTestHash123456789";
        uint256 startTime = block.timestamp + 86400; // 24 hours from now
        uint256 endTime = startTime + 7200; // 2 hours duration
        uint256 maxAttendees = 100;
        uint256 registrationFee = 0.01 ether;
        
        vm.startBroadcast(deployerPrivateKey);
        
        uint256 eventId = streamEvents.createEvent(
            testIpfsHash,
            startTime,
            endTime,
            maxAttendees,
            registrationFee
        );
        
        vm.stopBroadcast();
        
        console.log("   Event created with ID:", eventId);
        
        // Test 2: Publish the event
        console.log("   Testing event publishing...");
        vm.startBroadcast(deployerPrivateKey);
        streamEvents.publishEvent(eventId);
        vm.stopBroadcast();
        console.log("  Event published successfully");
        
        // Test 3: Add a ticket
        console.log("   Testing ticket creation...");
        string memory ticketName = "General Admission";
        string memory ticketType = "Standard";
        uint256 ticketPrice = 0.05 ether;
        string memory currency = "ETH";
        uint256 totalQuantity = 50;
        string[] memory perks = new string[](2);
        perks[0] = "Access to main event";
        perks[1] = "Free refreshments";
        
        vm.startBroadcast(deployerPrivateKey);
        
        uint256 ticketId = streamEvents.addTicket(
            eventId,
            ticketName,
            ticketType,
            ticketPrice,
            currency,
            totalQuantity,
            perks
        );
        
        vm.stopBroadcast();
        
        console.log("   Ticket created with ID:", ticketId);
        
        // Test 4: Update platform fee
        console.log("   Testing admin functions...");
        uint256 newPlatformFee = 300; // 3%
        
        vm.startBroadcast(deployerPrivateKey);
        streamEvents.updatePlatformFee(newPlatformFee);
        vm.stopBroadcast();
        
        require(streamEvents.platformFee() == newPlatformFee, "Platform fee update failed");
        console.log("   Platform fee updated to:", newPlatformFee, "basis points");
        
        console.log("\n All tests passed! Contract is working correctly!");
        
        // Save comprehensive deployment and test info
        string memory testInfo = string.concat(
            "Deployment and Test Results:\n",
            "Contract: ", vm.toString(address(streamEvents)), "\n",
            "Network: ", vm.toString(block.chainid), "\n",
            "Owner: ", vm.toString(deployer), "\n",
            "Test Event ID: ", vm.toString(eventId), "\n",
            "Test Ticket ID: ", vm.toString(ticketId), "\n",
            "Final Platform Fee: ", vm.toString(newPlatformFee), " basis points\n",
            "Timestamp: ", vm.toString(block.timestamp)
        );
        
        vm.writeFile("deployment-test-results.txt", testInfo);
        console.log("\n Test results saved to deployment-test-results.txt");
    }
}
