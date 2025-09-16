// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {StreamEventsUpgradeable} from "../src/StreamEventsUpgradeable.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployStreamEventsUpgradeable is Script {
    StreamEventsUpgradeable public streamEvents;
    ERC1967Proxy public proxy;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying StreamEventsUpgradeable with proxy...");
        console.log("Network:", vm.toString(block.chainid));
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", vm.toString(deployer.balance), "wei");
        
        // Check if deployer has sufficient balance
        require(deployer.balance > 0.01 ether, "Insufficient balance for deployment");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the implementation contract
        StreamEventsUpgradeable implementation = new StreamEventsUpgradeable(address(0));
        
        // Deploy the proxy contract
        bytes memory initData = abi.encodeWithSelector(
            StreamEventsUpgradeable.initialize.selector,
            "https://api.stream-events.com/metadata/", // Base URI
            address(0) // Trusted forwarder (can be set later)
        );
        
        proxy = new ERC1967Proxy(address(implementation), initData);
        streamEvents = StreamEventsUpgradeable(address(proxy));
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("Implementation contract:", address(implementation));
        console.log("Proxy contract:", address(proxy));
        console.log("StreamEventsUpgradeable (via proxy):", address(streamEvents));
        console.log("Owner:", streamEvents.owner());
        console.log("Version:", streamEvents.version());
        console.log("Trusted forwarder:", streamEvents.trustedForwarderAddr());
        
        // Save deployment info
        string memory deploymentInfo = string.concat(
            "StreamEventsUpgradeable Deployment Info:\n",
            "Implementation: ", vm.toString(address(implementation)), "\n",
            "Proxy: ", vm.toString(address(proxy)), "\n",
            "StreamEventsUpgradeable: ", vm.toString(address(streamEvents)), "\n",
            "Network: ", vm.toString(block.chainid), "\n",
            "Owner: ", vm.toString(deployer), "\n",
            "Version: 1.0.0\n",
            "Timestamp: ", vm.toString(block.timestamp)
        );
        
        vm.writeFile("stream-events-upgradeable-deployment.txt", deploymentInfo);
        console.log("\nDeployment info saved to stream-events-upgradeable-deployment.txt");
    }
    
    // Function to upgrade the contract
    function upgradeStreamEvents(address newImplementation) public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(privateKey);
        streamEvents.upgradeToAndCall(newImplementation, "");
        vm.stopBroadcast();
        
        console.log("StreamEventsUpgradeable upgraded to:", newImplementation);
    }
    
    // Function to upgrade and call
    function upgradeStreamEventsAndCall(address newImplementation, bytes memory data) public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(privateKey);
        streamEvents.upgradeToAndCall(newImplementation, data);
        vm.stopBroadcast();
        
        console.log("StreamEventsUpgradeable upgraded to:", newImplementation);
        console.log("With data:", vm.toString(data));
    }
}
