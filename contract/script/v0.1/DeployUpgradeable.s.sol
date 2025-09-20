// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {EventsV1} from "../../src/v0.1/core/EventsV1.sol";
import {TicketsV1} from "../../src/v0.1/core/TicketsV1.sol";
import {EscrowV1} from "../../src/v0.1/core/EscrowV1.sol";
import {UpgradeableProxy} from "../../src/v0.1/core/UpgradeableProxy.s.sol";

/**
 * @title DeployUpgradeable
 * @dev Deployment script for upgradeable modular contracts
 * @dev Each contract is deployed with its own proxy for upgradeability
 */
contract DeployUpgradeable is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.createSelectFork(vm.envString("BASE_SEPOLIA_RPC_URL"));
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Revent V1 Upgradeable Contracts...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy EventsV1
        console.log("\nDeploying EventsV1...");
        EventsV1 eventsImpl = new EventsV1();
        console.log("EventsV1 implementation deployed at:", address(eventsImpl));

        // Deploy EventsV1 proxy with initialization
        bytes memory eventsInitData = abi.encodeWithSelector(EventsV1.initialize.selector, "hash");
        UpgradeableProxy eventsProxy = new UpgradeableProxy(address(eventsImpl), eventsInitData);
        console.log("EventsV1 proxy deployed at:", address(eventsProxy));

        // Deploy TicketsV1
        console.log("\nDeploying TicketsV1...");
        TicketsV1 ticketsImpl = new TicketsV1();
        console.log("TicketsV1 implementation deployed at:", address(ticketsImpl));

        // Deploy TicketsV1 proxy with initialization
        bytes memory ticketsInitData = abi.encodeWithSelector(TicketsV1.initialize.selector, "hash");
        UpgradeableProxy ticketsProxy = new UpgradeableProxy(address(ticketsImpl), ticketsInitData);
        console.log("TicketsV1 proxy deployed at:", address(ticketsProxy));

        // Deploy EscrowV1
        console.log("\nDeploying EscrowV1...");
        EscrowV1 escrowImpl = new EscrowV1();
        console.log("EscrowV1 implementation deployed at:", address(escrowImpl));

        // Deploy EscrowV1 proxy with initialization
        bytes memory escrowInitData = abi.encodeWithSelector(EscrowV1.initialize.selector);
        UpgradeableProxy escrowProxy = new UpgradeableProxy(address(escrowImpl), escrowInitData);
        console.log("EscrowV1 proxy deployed at:", address(escrowProxy));

        // Set up cross-references
        console.log("\nSetting up cross-references...");

        // Get contract instances
        EventsV1 events = EventsV1(payable(address(eventsProxy)));
        TicketsV1 tickets = TicketsV1(payable(address(ticketsProxy)));
        EscrowV1 escrow = EscrowV1(payable(address(escrowProxy)));

        // Set contract addresses
        tickets.setContractAddresses(address(events), address(escrow));
        escrow.setContractAddresses(address(events), address(tickets));

        console.log("Cross-references set successfully!");

        vm.stopBroadcast();

        console.log("\nDeployment completed successfully!");
        console.log("EventsV1 proxy:", address(eventsProxy));
        console.log("EventsV1 implementation:", address(eventsImpl));
        console.log("TicketsV1 proxy:", address(ticketsProxy));
        console.log("TicketsV1 implementation:", address(ticketsImpl));
        console.log("EscrowV1 proxy:", address(escrowProxy));
        console.log("EscrowV1 implementation:", address(escrowImpl));

        console.log("\nUpgradeability Info:");
        console.log("- Each contract has its own proxy");
        console.log("- Contracts can be upgraded independently");
        console.log("- Use upgrade scripts to update implementations");
    }
}
