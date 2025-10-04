// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/v0.1/core/ReventTrading.sol";

contract DeployReventTrading is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address eventsContract = vm.envAddress("EVENTS_CONTRACT");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy ReventTrading contract
        ReventTrading reventTrading = new ReventTrading(eventsContract);
        
        // Set initial configuration
        reventTrading.setFeeRecipient(vm.envAddress("FEE_RECIPIENT"));
        reventTrading.setTradingFee(100); // 1%
        reventTrading.setOrderValueLimits(0.0000001 ether, 1000 ether);
        reventTrading.setOrderExpirationTime(7 days);
        reventTrading.setEventsContract(eventsContract);
        reventTrading.setDomaProxy(vm.envAddress("DOMA_PROXY"));
        reventTrading.setOwnershipToken(vm.envAddress("OWNERSHIP_TOKEN"));
        
        vm.stopBroadcast();
        
        console.log("ReventTrading deployed at:", address(reventTrading));
        console.log("Events contract:", eventsContract);
    }
}
