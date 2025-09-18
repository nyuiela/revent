// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {StreamEvents} from "../src/event.sol";

contract DeployDoma is Script {
	StreamEvents public streamEvents;

	function run() external {
		uint256 pk = vm.envUint("PRIVATE_KEY");
		address deployer = vm.addr(pk);

		console.log("=== DEPLOYING TO DOMA TESTNET ===");
		console.log("Deploying StreamEvents...");
		console.log("Deployer:", deployer);
		console.log("Deployer balance:", deployer.balance, "wei");
		console.log("Network:", block.chainid);

		// Check if deployer has sufficient balance
		require(deployer.balance > 0.01 ether, "Insufficient balance for deployment");

		// Doma Testnet addresses from official docs
		address domaProxy = 0xb1508299A01c02aC3B70c7A8B0B07105aaB29E99;
		address ownershipToken = 0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f;
		address forwarder = 0xf17beC16794e018E2F0453a1282c3DA3d121f410;
		uint256 registrarIanaId = 0; // Default registrar
		string memory domaChainId = "doma";

		// Marketplace currencies (testnet)
		address usdc = 0x2f3463756C59387D6Cd55b034100caf7ECfc757b;
		address weth = 0x6f898cd313dcEe4D28A87F675BD93C471868B0Ac;
		address feeReceiver = 0x2E7cC63800e77BB8c662c45Ef33D1cCc23861532; // 0.5%
		uint256 feeBps = 50;

		vm.startBroadcast(pk);
		
		// Deploy the main contract
		streamEvents =  new StreamEvents("https://api.streamevents.io/token");
		
		// Configure Doma integration
		streamEvents.setDomaConfig(domaProxy, ownershipToken, forwarder, registrarIanaId, domaChainId);
		
		// Set marketplace configuration
		streamEvents.setMarketplaceCurrencies(usdc, weth);
		streamEvents.setMarketplaceProtocolFee(feeReceiver, feeBps);
		
		// Set platform configuration
		streamEvents.updatePlatformFee(250); // 2.5%
		streamEvents.updateRegistrationFeeLimits(0.001 ether, 1 ether);
		
		// Set trading configuration
		// streamEvents.setTradingFee(100); // 1% trading fee
		// streamEvents.setOrderValueLimits(0.001 ether, 100 ether); // Min 0.001 ETH, Max 100 ETH
		// streamEvents.setOrderExpirationTime(7 days); // Orders expire in 7 days
		
		vm.stopBroadcast();

		console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
		console.log("StreamEvents:", address(streamEvents));
		console.log("Owner:", streamEvents.owner());
		console.log("Platform Fee:", streamEvents.platformFee(), "basis points (2.5%)");
		console.log("Min Registration Fee:", streamEvents.minRegistrationFee());
		console.log("Max Registration Fee:", streamEvents.maxRegistrationFee());
		
		console.log("\n=== DOMA CONFIGURATION ===");
		console.log("Doma Proxy:", streamEvents.domaProxy());
		console.log("Ownership Token:", streamEvents.ownershipToken());
		console.log("Trusted Forwarder:", streamEvents.trustedForwarderAddr());
		console.log("Registrar IANA ID:", streamEvents.registrarIanaId());
		console.log("Doma Chain ID:", streamEvents.domaChainId());
		
		console.log("\n=== MARKETPLACE CONFIGURATION ===");
		console.log("USDC:", streamEvents.getUSDC());
		console.log("WETH:", streamEvents.getWETH());
		(address recv, uint256 bps) = streamEvents.getProtocolFee();
		console.log("Protocol Fee Receiver:", recv);
		console.log("Protocol Fee Bps:", bps);
		
		console.log("\n=== TRADING CONFIGURATION ===");
		console.log("Trading Fee:", streamEvents.tradingFeeBps(), "basis points (1%)");
		console.log("Min Order Value:", streamEvents.minOrderValue());
		console.log("Max Order Value:", streamEvents.maxOrderValue());
		console.log("Order Expiration Time:", streamEvents.orderExpirationTime(), "seconds (7 days)");
		
		// Verify deployment
		console.log("\n=== VERIFYING DEPLOYMENT ===");
		require(streamEvents.owner() == deployer, "Owner not set correctly");
		require(streamEvents.domaProxy() == domaProxy, "Doma proxy not set correctly");
		require(streamEvents.ownershipToken() == ownershipToken, "Ownership token not set correctly");
		require(streamEvents.trustedForwarderAddr() == forwarder, "Forwarder not set correctly");
		require(streamEvents.platformFee() == 250, "Platform fee not set correctly");
		require(streamEvents.tradingFeeBps() == 100, "Trading fee not set correctly");
		console.log("All verifications passed!");
		
		// Save deployment info
		string memory deploymentInfo = string.concat(
			"DOMA TESTNET DEPLOYMENT INFO\n",
			"============================\n",
			"Contract Address: ", vm.toString(address(streamEvents)), "\n",
			"Network: ", vm.toString(block.chainid), "\n",
			"Deployer: ", vm.toString(deployer), "\n",
			"Timestamp: ", vm.toString(block.timestamp), "\n\n",
			"DOMA CONFIGURATION:\n",
			"Doma Proxy: ", vm.toString(domaProxy), "\n",
			"Ownership Token: ", vm.toString(ownershipToken), "\n",
			"Forwarder: ", vm.toString(forwarder), "\n",
			"Registrar IANA ID: ", vm.toString(registrarIanaId), "\n",
			"Doma Chain ID: ", domaChainId, "\n\n",
			"MARKETPLACE CONFIGURATION:\n",
			"USDC: ", vm.toString(usdc), "\n",
			"WETH: ", vm.toString(weth), "\n",
			"Fee Receiver: ", vm.toString(feeReceiver), "\n",
			"Fee Bps: ", vm.toString(feeBps), "\n\n",
			"PLATFORM CONFIGURATION:\n",
			"Platform Fee: 250 bps (2.5%)\n",
			"Trading Fee: 100 bps (1%)\n",
			"Min Registration Fee: 0.001 ETH\n",
			"Max Registration Fee: 1 ETH\n",
			"Min Order Value: 0.001 ETH\n",
			"Max Order Value: 100 ETH\n",
			"Order Expiration: 7 days\n"
		);
		
		vm.writeFile("doma-deployment-info.txt", deploymentInfo);
		console.log("\nDeployment info saved to doma-deployment-info.txt");
		console.log("\n=== READY FOR DOMA INTEGRATION ===");
	}
}
