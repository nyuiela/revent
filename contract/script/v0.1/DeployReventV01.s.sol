// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {Revent} from "../../src/v0.1/core/revent.sol";
import {ReventProxy} from "../../src/v0.1/ReventProxy.sol";

/**
 * @title DeployReventV01
 * @dev Deployment script for Revent V0.1 with proxy
 */
contract DeployReventV01 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Revent V0.1...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy implementation
        Revent implementation = new Revent();
        console.log("Implementation deployed at:", address(implementation));

        // Prepare initialization data
        address trustedForwarder = address(0); // Set to actual forwarder if using meta-transactions
        address feeRecipient = deployer; // Set to actual fee recipient
        uint256 platformFee = 250; // 2.5% platform fee

        bytes memory initData =
            abi.encodeWithSelector(Revent.initialize.selector, trustedForwarder, feeRecipient, platformFee);

        // Deploy proxy
        ReventProxy proxy = new ReventProxy(address(implementation), initData);

        console.log("Proxy deployed at:", address(proxy));

        // Verify deployment
        Revent revent = Revent(payable(address(proxy)));
        console.log("Version:", revent.version());
        console.log("Owner:", revent.owner());
        console.log("Platform fee:", revent.getPlatformFee());
        console.log("Fee recipient:", revent.getFeeRecipient());

        vm.stopBroadcast();

        console.log("Deployment completed successfully!");
        console.log("Proxy address:", address(proxy));
        console.log("Implementation address:", address(implementation));
    }
}
