// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {StreamEvents} from "../src/event.sol";
import {EventTokenManager} from "../src/EventTokenManager.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployAndIntegrate is Script {
    StreamEvents public streamEvents;
    EventTokenManager public eventTokenManager;
    ERC1967Proxy public tokenManagerProxy;
    EventTokenManager public implementation;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Deploying Complete Event System ===");
        console.log("Network:", vm.toString(block.chainid));
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", vm.toString(deployer.balance), "wei");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy StreamEvents contract
        console.log("\n1. Deploying StreamEvents contract...");
        streamEvents = new StreamEvents("https://api.stream-events.com/metadata/");
        console.log("StreamEvents deployed at:", address(streamEvents));
        
        // Step 2: Deploy EventTokenManager implementation
        console.log("\n2. Deploying EventTokenManager implementation...");
        implementation = new EventTokenManager();
        console.log("EventTokenManager implementation:", address(implementation));
        
        // Step 3: Deploy EventTokenManager proxy
        console.log("\n3. Deploying EventTokenManager proxy...");
        bytes memory initData = abi.encodeWithSelector(
            EventTokenManager.initialize.selector,
            "https://api.stream-events.com/metadata/{id}.json"
        );
        tokenManagerProxy = new ERC1967Proxy(address(implementation), initData);
        eventTokenManager = EventTokenManager(address(tokenManagerProxy));
        console.log("EventTokenManager proxy:", address(eventTokenManager));
        
        // Step 4: Configure contracts
        console.log("\n4. Configuring contracts...");
        eventTokenManager.setStreamEventsContract(address(streamEvents));
        streamEvents.setEventTokenManager(address(eventTokenManager));
        console.log("Contracts configured successfully");
        
        // Step 5: Test the system
        console.log("\n5. Testing the system...");
        testEventCreation();
        testRegistration();
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Complete ===");
        console.log("StreamEvents:", address(streamEvents));
        console.log("EventTokenManager:", address(eventTokenManager));
        console.log("EventTokenManager Implementation:", address(implementation));
        
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
    
    function testRegistration() internal {
        console.log("   Testing registration...");
        
        // This would require a different account to test registration
        // For now, just show the functions available
        console.log("   Registration functions available:");
        console.log("   - streamEvents.registerForEvent(eventId)");
        console.log("   - streamEvents.confirmAttendance(eventId, confirmationCode)");
        console.log("   - streamEvents.markAttended(eventId, attendeeAddress)");
    }
    
    function saveDeploymentInfo() internal {
        string memory deploymentInfo = string.concat(
            "Complete Event System Deployment:\n",
            "================================\n",
            "StreamEvents: ", vm.toString(address(streamEvents)), "\n",
            "EventTokenManager: ", vm.toString(address(eventTokenManager)), "\n",
            "EventTokenManager Implementation: ", vm.toString(address(implementation)), "\n",
            "Network: ", vm.toString(block.chainid), "\n",
            "Deployer: ", vm.toString(msg.sender), "\n",
            "Timestamp: ", vm.toString(block.timestamp), "\n\n",
            "Integration Features:\n",
            "- ERC1155 tokens minted for each event\n",
            "- Tokens transferred to attendees on registration\n",
            "- Upgradeable token management system\n",
            "- Secure confirmation code system\n",
            "- Event creator can mark attendance manually\n"
        );
        
        vm.writeFile("complete-system-deployment.txt", deploymentInfo);
        console.log("\nDeployment info saved to complete-system-deployment.txt");
    }
}
