// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ReventFactoryV1} from "../../src/v1/core/ReventFactoryV1.sol";
import {ReventProxy} from "../../src/v0.1/ReventProxy.sol";

/**
 * @title DeployReventV1
 * @dev Deployment script for Revent V1 modular architecture
 */
contract DeployReventV1 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying Revent V1...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy implementation
        ReventFactoryV1 implementation = new ReventFactoryV1();
        console.log("Implementation deployed at:", address(implementation));
        
        // Prepare initialization data
        address trustedForwarder = address(0); // No trusted forwarder for now
        address feeRecipient = deployer; // Use deployer as fee recipient
        uint256 platformFee = 250; // 2.5%
        
        bytes memory initData = abi.encodeWithSelector(
            ReventFactoryV1.initialize.selector,
            trustedForwarder,
            feeRecipient,
            platformFee
        );
        
        // Deploy proxy
        ReventProxy proxy = new ReventProxy(address(implementation), initData);
        console.log("Proxy deployed at:", address(proxy));
        
        // Initialize the factory through proxy
        ReventFactoryV1 factory = ReventFactoryV1(payable(address(proxy)));
        
        console.log("Version:", factory.version());
        console.log("Owner:", factory.owner());
        console.log("Platform fee:", factory.platformFee());
        console.log("Fee recipient:", factory.feeRecipient());
        
        // Get module addresses
        console.log("Events module:", address(factory.eventsModule()));
        console.log("Tickets module:", address(factory.ticketsModule()));
        console.log("Escrow module:", address(factory.escrowModule()));
        
        vm.stopBroadcast();
        
        console.log("Deployment completed successfully!");
        console.log("Proxy address:", address(proxy));
        console.log("Implementation address:", address(implementation));
    }
}
