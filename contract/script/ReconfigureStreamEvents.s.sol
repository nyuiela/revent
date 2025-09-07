// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {StreamEvents} from "../src/event.sol";

contract ReconfigureStreamEvents is Script {
    StreamEvents public streamEvents;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get contract address from environment or use a default
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");
        if (contractAddress == address(0)) {
            console.log("❌ CONTRACT_ADDRESS not set in environment");
            console.log("Please set CONTRACT_ADDRESS in your .env file");
            return;
        }
        
        console.log("🔧 Reconfiguring existing StreamEvents contract...");
        console.log("📍 Network:", vm.toString(block.chainid));
        console.log("👤 Deployer address:", deployer);
        console.log("📋 Contract address:", contractAddress);
        
        // Get the existing contract instance
        streamEvents = StreamEvents(contractAddress);
        
        // Verify ownership
        require(streamEvents.owner() == deployer, "Only owner can reconfigure");
        
        console.log("\n📊 Current Configuration:");
        console.log("   Platform fee:", streamEvents.platformFee(), "basis points");
        console.log("   Min registration fee:", vm.toString(streamEvents.minRegistrationFee()), "wei");
        console.log("   Max registration fee:", vm.toString(streamEvents.maxRegistrationFee()), "wei");
        console.log("   Fee recipient:", streamEvents.feeRecipient());
        
        // New configuration values
        uint256 newPlatformFee = 200; // 2% instead of current
        uint256 newMinRegFee = 0.002 ether; // 0.002 ETH
        uint256 newMaxRegFee = 0.5 ether; // 0.5 ETH
        
        console.log("\n⚙️  New Configuration:");
        console.log("   Platform fee:", newPlatformFee, "basis points (2%)");
        console.log("   Min registration fee:", vm.toString(newMinRegFee), "wei");
        console.log("   Max registration fee:", vm.toString(newMaxRegFee), "wei");
        
        vm.startBroadcast(deployerPrivateKey);

        // Update configuration
        streamEvents.updatePlatformFee(newPlatformFee);
        streamEvents.updateRegistrationFeeLimits(newMinRegFee, newMaxRegFee);
        
        vm.stopBroadcast();

        console.log("\n📋 Reconfiguration Summary:");
        console.log("   Contract address:", address(streamEvents));
        console.log("   New platform fee:", streamEvents.platformFee(), "basis points");
        console.log("   New min registration fee:", vm.toString(streamEvents.minRegistrationFee()), "wei");
        console.log("   New max registration fee:", vm.toString(streamEvents.maxRegistrationFee()), "wei");
        
        // Verify new configuration
        console.log("\n🔍 Verifying new configuration...");
        require(streamEvents.platformFee() == newPlatformFee, "❌ New platform fee not set correctly");
        require(streamEvents.minRegistrationFee() == newMinRegFee, "❌ New min registration fee not set correctly");
        require(streamEvents.maxRegistrationFee() == newMaxRegFee, "❌ New max registration fee not set correctly");
        
        console.log("✅ All new configurations verified!");
        console.log("\n🎉 StreamEvents contract reconfigured successfully!");
        
        // Save reconfiguration info
        string memory reconfigInfo = string.concat(
            "Reconfiguration Info:\n",
            "Contract: ", vm.toString(address(streamEvents)), "\n",
            "Network: ", vm.toString(block.chainid), "\n",
            "Owner: ", vm.toString(deployer), "\n",
            "New Platform Fee: ", vm.toString(newPlatformFee), " basis points\n",
            "New Min Reg Fee: ", vm.toString(newMinRegFee), " wei\n",
            "New Max Reg Fee: ", vm.toString(newMaxRegFee), " wei\n",
            "Timestamp: ", vm.toString(block.timestamp)
        );
        
        vm.writeFile("reconfiguration-info.txt", reconfigInfo);
        console.log("\n💾 Reconfiguration info saved to reconfiguration-info.txt");
    }
}
