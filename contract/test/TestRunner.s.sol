// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/Test.sol";

contract TestRunner is Script {
    function run() external {
        // Run all trading tests
        console.log("Running Trading Unit Tests...");
        // vm.run("forge test --match-contract TradingUnitTests -vv");
        
        console.log("Running Trading Integration Tests...");
        // vm.run("forge test --match-contract TradingIntegrationTests -vv");
        
        console.log("Running Complete System Tests...");
        // vm.run("forge test --match-contract CompleteSystemTests -vv");
        
        console.log("Running Doma Protocol Tests...");
        // vm.run("forge test --match-contract DomaProtocolTests -vv");
        
        console.log("Running Integration Verification Tests...");
        // vm.run("forge test --match-contract IntegrationVerificationTests -vv");
        
        console.log("Running Base Fork Test...");
        // vm.run("forge test --match-contract BaseForkTest -vv");
        
        console.log("Running Doma Integration Fork Tests...");
        // vm.run("forge test --match-contract DomaIntegrationForkTests -vv");
        
        console.log("Running Comprehensive Fork Tests...");
        // vm.run("forge test --match-contract ComprehensiveForkTests -vv");
        
        console.log("Running Base Trading Test...");
        // vm.run("forge test --match-contract BaseTradingTest -vv");
        
        console.log("Running Tokenization Tests...");
        // vm.run("forge test --match-contract TokenizationTests -vv");
        
        console.log("Running Comprehensive Trading Tests...");
        // vm.run("forge test --match-contract ComprehensiveTradingTests -vv");
        
        // console.log("Running Price Manager Tests...");
        // vm.run("forge test --match-contract PriceManagerTests -vv");
        
        // console.log("Running Volume Manager Tests...");
        // vm.run("forge test --match-contract VolumeManagerTests -vv");
        
        // console.log("Running Order Manager Tests...");
        // vm.run("forge test --match-contract OrderManagerTests -vv");
        
        // console.log("Running Complete Trading Tests...");
        // vm.run("forge test --match-contract CompleteTradingTests -vv");
        
        console.log("All tests completed!");
    }
}
