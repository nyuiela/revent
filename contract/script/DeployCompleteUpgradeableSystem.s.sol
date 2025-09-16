// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {StreamEventsUpgradeable} from "../src/StreamEventsUpgradeable.sol";
import {EventTokenManager} from "../src/EventTokenManager.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployCompleteUpgradeableSystem is Script {
    StreamEventsUpgradeable public streamEvents;
    EventTokenManager public eventTokenManager;
    ERC1967Proxy public streamEventsProxy;
    ERC1967Proxy public tokenManagerProxy;
    StreamEventsUpgradeable public streamEventsImplementation;
    EventTokenManager public tokenManagerImplementation;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Deploying Complete Upgradeable Event System ===");
        console.log("Network:", vm.toString(block.chainid));
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", vm.toString(deployer.balance), "wei");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy StreamEventsUpgradeable implementation
        console.log("\n1. Deploying StreamEventsUpgradeable implementation...");
        streamEventsImplementation = new StreamEventsUpgradeable(address(0)); // No trusted forwarder initially
        console.log("StreamEventsUpgradeable implementation:", address(streamEventsImplementation));
        
        // Step 2: Deploy StreamEventsUpgradeable proxy
        console.log("\n2. Deploying StreamEventsUpgradeable proxy...");
        bytes memory streamEventsInitData = abi.encodeWithSelector(
            StreamEventsUpgradeable.initialize.selector,
            "https://api.stream-events.com/metadata/",
            address(0) // Trusted forwarder (can be set later)
        );
        streamEventsProxy = new ERC1967Proxy(address(streamEventsImplementation), streamEventsInitData);
        streamEvents = StreamEventsUpgradeable(address(streamEventsProxy));
        console.log("StreamEventsUpgradeable proxy:", address(streamEvents));
        
        // Step 3: Deploy EventTokenManager implementation
        console.log("\n3. Deploying EventTokenManager implementation...");
        tokenManagerImplementation = new EventTokenManager();
        console.log("EventTokenManager implementation:", address(tokenManagerImplementation));
        
        // Step 4: Deploy EventTokenManager proxy
        console.log("\n4. Deploying EventTokenManager proxy...");
        bytes memory tokenManagerInitData = abi.encodeWithSelector(
            EventTokenManager.initialize.selector,
            "https://api.stream-events.com/metadata/{id}.json"
        );
        tokenManagerProxy = new ERC1967Proxy(address(tokenManagerImplementation), tokenManagerInitData);
        eventTokenManager = EventTokenManager(address(tokenManagerProxy));
        console.log("EventTokenManager proxy:", address(eventTokenManager));
        
        // Step 5: Configure contracts
        console.log("\n5. Configuring contracts...");
        eventTokenManager.setStreamEventsContract(address(streamEvents));
        streamEvents.setEventTokenManager(address(eventTokenManager));
        console.log("Contracts configured successfully");
        
        // Step 6: Test the system
        console.log("\n6. Testing the system...");
        testEventCreation();
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Complete ===");
        console.log("StreamEventsUpgradeable Implementation:", address(streamEventsImplementation));
        console.log("StreamEventsUpgradeable Proxy:", address(streamEvents));
        console.log("EventTokenManager Implementation:", address(tokenManagerImplementation));
        console.log("EventTokenManager Proxy:", address(eventTokenManager));
        
        // Save deployment info
        saveDeploymentInfo();
    }
    
    function testEventCreation() internal {
        console.log("   Creating test event...");
        
        // Create event with 100 total supply
        uint256 totalSupply = 100;
        bytes memory data = abi.encode(totalSupply);
        
        uint256 eventId = streamEvents.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            50, // max attendees
            0.01 ether, // registration fee
            data
        );
        
        console.log("   Event created with ID:", eventId);
        
        // Check if tokens were minted
        uint256 tokenId = streamEvents.getEventTokenId(eventId);
        console.log("   Event token ID:", tokenId);
        
        // Check remaining supply
        uint256 remainingSupply = eventTokenManager.getRemainingTokenSupply(eventId);
        console.log("   Remaining token supply:", remainingSupply);
    }
    
    function saveDeploymentInfo() internal {
        string memory deploymentInfo = string.concat(
            "Complete Upgradeable Event System Deployment:\n",
            "============================================\n",
            "StreamEventsUpgradeable Implementation: ", vm.toString(address(streamEventsImplementation)), "\n",
            "StreamEventsUpgradeable Proxy: ", vm.toString(address(streamEvents)), "\n",
            "EventTokenManager Implementation: ", vm.toString(address(tokenManagerImplementation)), "\n",
            "EventTokenManager Proxy: ", vm.toString(address(eventTokenManager)), "\n",
            "Network: ", vm.toString(block.chainid), "\n",
            "Deployer: ", vm.toString(msg.sender), "\n",
            "Timestamp: ", vm.toString(block.timestamp), "\n\n",
            "Upgradeable Features:\n",
            "- Both contracts are fully upgradeable\n",
            "- ERC1155 tokens minted for each event\n",
            "- Tokens transferred to attendees on registration\n",
            "- Secure confirmation code system\n",
            "- Event creator can mark attendance manually\n",
            "- Future features can be added via upgrades\n\n",
            "Upgrade Commands:\n",
            "forge script script/DeployCompleteUpgradeableSystem.s.sol:upgradeStreamEvents --rpc-url <network> --broadcast\n",
            "forge script script/DeployCompleteUpgradeableSystem.s.sol:upgradeTokenManager --rpc-url <network> --broadcast\n"
        );
        
        vm.writeFile("complete-upgradeable-system-deployment.txt", deploymentInfo);
        console.log("\nDeployment info saved to complete-upgradeable-system-deployment.txt");
    }
    
    // Function to upgrade StreamEvents
    function upgradeStreamEvents(address newImplementation) public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(privateKey);
        streamEvents.upgradeToAndCall(newImplementation, "");
        vm.stopBroadcast();
        
        console.log("StreamEventsUpgradeable upgraded to:", newImplementation);
    }
    
    // Function to upgrade EventTokenManager
    function upgradeTokenManager(address newImplementation) public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(privateKey);
        eventTokenManager.upgradeToAndCall(newImplementation, "");
        vm.stopBroadcast();
        
        console.log("EventTokenManager upgraded to:", newImplementation);
    }
    
    // Function to upgrade both contracts
    function upgradeBothContracts(
        address newStreamEventsImpl,
        address newTokenManagerImpl
    ) public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(privateKey);
        streamEvents.upgradeToAndCall(newStreamEventsImpl, "");
        eventTokenManager.upgradeToAndCall(newTokenManagerImpl, "");
        vm.stopBroadcast();
        
        console.log("Both contracts upgraded:");
        console.log("StreamEventsUpgradeable:", newStreamEventsImpl);
        console.log("EventTokenManager:", newTokenManagerImpl);
    }
}
