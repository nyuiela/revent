// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {EventTokenManager} from "../src/EventTokenManager.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployEventTokenManager is Script {
    EventTokenManager public eventTokenManager;
    ERC1967Proxy public proxy;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying EventTokenManager with proxy...");
        console.log("Network:", vm.toString(block.chainid));
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", vm.toString(deployer.balance), "wei");
        
        // Check if deployer has sufficient balance
        require(deployer.balance > 0.01 ether, "Insufficient balance for deployment");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the implementation contract
        EventTokenManager implementation = new EventTokenManager();
        
        // Deploy the proxy contract
        bytes memory initData = abi.encodeWithSelector(
            EventTokenManager.initialize.selector,
            "https://api.stream-events.com/metadata/{id}.json" // Base URI
        );
        
        proxy = new ERC1967Proxy(address(implementation), initData);
        eventTokenManager = EventTokenManager(address(proxy));
        
        // Set the StreamEvents contract address (will be updated later)
        eventTokenManager.setStreamEventsContract(deployer); // Temporary, will be updated
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("Implementation contract:", address(implementation));
        console.log("Proxy contract:", address(proxy));
        console.log("EventTokenManager (via proxy):", address(eventTokenManager));
        console.log("Owner:", eventTokenManager.owner());
        console.log("StreamEvents contract:", eventTokenManager.streamEventsContract());
        
        // Save deployment info
        string memory deploymentInfo = string.concat(
            "EventTokenManager Deployment Info:\n",
            "Implementation: ", vm.toString(address(implementation)), "\n",
            "Proxy: ", vm.toString(address(proxy)), "\n",
            "EventTokenManager: ", vm.toString(address(eventTokenManager)), "\n",
            "Network: ", vm.toString(block.chainid), "\n",
            "Owner: ", vm.toString(deployer), "\n",
            "Timestamp: ", vm.toString(block.timestamp)
        );
        
        vm.writeFile("event-token-manager-deployment.txt", deploymentInfo);
        console.log("\nDeployment info saved to event-token-manager-deployment.txt");
    }
    
    // Function to upgrade the contract
    function upgradeEventTokenManager(address newImplementation) public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(privateKey);
        eventTokenManager.upgradeToAndCall(newImplementation, "");
        vm.stopBroadcast();
        
        console.log("EventTokenManager upgraded to:", newImplementation);
    }
}
