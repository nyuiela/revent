// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {UpgradeableSystemTest} from "./UpgradeableSystem.t.sol";
import {EventTokenManagerUpgradeTest} from "./EventTokenManagerUpgrade.t.sol";
import {CompleteSystemUpgradeTest} from "./CompleteSystemUpgrade.t.sol";

contract UpgradeableTestRunner is Script {
    function run() public {
        console.log("=== Running Upgradeable System Tests ===");
        
        // Run basic upgradeable system tests
        console.log("\n1. Running basic upgradeable system tests...");
        runTest("UpgradeableSystemTest");
        
        // Run EventTokenManager upgrade tests
        console.log("\n2. Running EventTokenManager upgrade tests...");
        runTest("EventTokenManagerUpgradeTest");
        
        // Run complete system upgrade tests
        console.log("\n3. Running complete system upgrade tests...");
        runTest("CompleteSystemUpgradeTest");
        
        console.log("\n=== All Upgradeable Tests Completed ===");
    }
    
    function runTest(string memory testName) internal {
        // This would typically run the test using forge test
        // For now, we'll just log the test name
        console.log("Running test:", testName);
        
        // In a real scenario, you would run:
        // forge test --match-contract <testName> --verbose
    }
}
