// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/v1/StreamEventsV1.sol";
import "../src/v2/StreamEventsV2.sol";

contract UpgradeV1ToV2Script is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get proxy address from environment or hardcode for testing
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");
        
        console.log("Upgrading StreamEvents V1 to V2...");
        console.log("Deployer:", deployer);
        console.log("Proxy address:", proxyAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy new V2 implementation
        StreamEventsV2 newImplementation = new StreamEventsV2();
        console.log("New V2 implementation deployed at:", address(newImplementation));
        
        // Get current proxy instance
        StreamEventsV1 currentProxy = StreamEventsV1(proxyAddress);
        
        // Verify current state
        console.log("Current version:", currentProxy.version());
        console.log("Current owner:", currentProxy.owner());
        
        // Perform upgrade
        currentProxy.upgradeToAndCall(address(newImplementation), "");
        console.log("Upgrade completed!");
        
        // Verify upgrade
        StreamEventsV2 upgradedProxy = StreamEventsV2(proxyAddress);
        console.log("New version:", upgradedProxy.version());
        console.log("Owner after upgrade:", upgradedProxy.owner());
        console.log("Platform fee after upgrade:", upgradedProxy.getPlatformFee());
        
        vm.stopBroadcast();
        
        console.log("Upgrade completed successfully!");
        console.log("Proxy address:", proxyAddress);
        console.log("New implementation address:", address(newImplementation));
    }
}
