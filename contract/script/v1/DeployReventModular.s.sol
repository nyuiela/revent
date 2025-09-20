// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {Revent} from "../../src/v1/core/Revent.sol";
import {EventsV1} from "../../src/v1/core/EventsV1.sol";
import {TicketsV1} from "../../src/v1/core/TicketsV1.sol";
import {EscrowV1} from "../../src/v1/core/EscrowV1.sol";
import {ReventProxy} from "../../src/v0.1/ReventProxy.sol";

/**
 * @title DeployReventModular
 * @dev Deployment script for modular Revent architecture
 * @dev Deploys main Revent contract and separate module contracts
 */
contract DeployReventModular is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying Revent Modular Architecture...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy main Revent implementation
        Revent reventImpl = new Revent();
        console.log("Revent implementation deployed at:", address(reventImpl));
        
        // Prepare initialization data
        address trustedForwarder = address(0); // No trusted forwarder for now
        address feeRecipient = deployer; // Use deployer as fee recipient
        uint256 platformFee = 250; // 2.5%
        
        bytes memory initData = abi.encodeWithSelector(
            Revent.initialize.selector,
            trustedForwarder,
            feeRecipient,
            platformFee
        );
        
        // Deploy proxy
        ReventProxy proxy = new ReventProxy(address(reventImpl), initData);
        console.log("Revent proxy deployed at:", address(proxy));
        
        // Get the Revent instance
        Revent revent = Revent(payable(address(proxy)));
        
        console.log("Version:", revent.version());
        console.log("Owner:", revent.owner());
        console.log("Platform fee:", revent.platformFee());
        console.log("Fee recipient:", revent.feeRecipient());
        
        // Deploy module contracts
        console.log("\nDeploying module contracts...");
        
        // Deploy Events module
        EventsV1 eventsModule = new EventsV1();
        console.log("Events module deployed at:", address(eventsModule));
        
        // Deploy Tickets module
        TicketsV1 ticketsModule = new TicketsV1();
        console.log("Tickets module deployed at:", address(ticketsModule));
        
        // Deploy Escrow module
        EscrowV1 escrowModule = new EscrowV1();
        console.log("Escrow module deployed at:", address(escrowModule));
        
        // Set up module references
        console.log("\nSetting up module references...");
        
        // Set factory addresses in modules
        ticketsModule.setFactoryAddress(address(revent));
        escrowModule.setFactoryAddress(address(revent));
        
        // Set contract addresses in modules
        ticketsModule.setContractAddresses(address(eventsModule), address(escrowModule));
        escrowModule.setContractAddresses(address(eventsModule), address(ticketsModule));
        
        // Set modules in main Revent contract
        revent.setEvents(address(eventsModule));
        revent.setTickets(address(ticketsModule));
        revent.setEscrow(address(escrowModule));
        
        console.log("\nModule setup completed!");
        console.log("Events module set:", address(revent.eventsModule()));
        console.log("Tickets module set:", address(revent.ticketsModule()));
        console.log("Escrow module set:", address(revent.escrowModule()));
        
        vm.stopBroadcast();
        
        console.log("\nDeployment completed successfully!");
        console.log("Main Revent proxy:", address(proxy));
        console.log("Main Revent implementation:", address(reventImpl));
        console.log("Events module:", address(eventsModule));
        console.log("Tickets module:", address(ticketsModule));
        console.log("Escrow module:", address(escrowModule));
    }
}
