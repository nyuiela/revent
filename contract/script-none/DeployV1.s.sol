// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/v1/StreamEventsV1.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployV1Script is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying StreamEvents V1...");
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy implementation
        StreamEventsV1 implementation = new StreamEventsV1();
        console.log("Implementation deployed at:", address(implementation));
        
        // Deploy proxy
        address trustedForwarder = address(0); // Set to actual forwarder address
        address feeRecipient = deployer; // Set to actual fee recipient
        uint256 platformFee = 250; // 2.5%
        
        bytes memory initData = abi.encodeWithSelector(
            StreamEventsV1.initialize.selector,
            deployer,           // initialOwner
            trustedForwarder,   // trustedForwarder
            feeRecipient,       // feeRecipient
            platformFee         // platformFee
        );
        
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        console.log("Proxy deployed at:", address(proxy));
        
        // Verify deployment
        StreamEventsV1 v1 = StreamEventsV1(address(proxy));
        console.log("Version:", v1.version());
        console.log("Owner:", v1.owner());
        console.log("Platform fee:", v1.getPlatformFee());
        
        vm.stopBroadcast();
        
        console.log("Deployment completed successfully!");
        console.log("Proxy address:", address(proxy));
        console.log("Implementation address:", address(implementation));
    }
}
