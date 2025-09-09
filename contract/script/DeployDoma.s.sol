// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {StreamEvents} from "../src/event.sol";

contract DeployDoma is Script {
	StreamEvents public streamEvents;

	function run() external {
		uint256 pk = vm.envUint("PRIVATE_KEY");
		address deployer = vm.addr(pk);

		console.log("deploy to doma");
		console.log("deploy to doma");
		console.log("Deploying StreamEvents...");
		console.log("Deployer:", deployer);
		console.log("Network:", block.chainid);

		// Doma Testnet addresses from docs
		address domaProxy = 0xb1508299A01c02aC3B70c7A8B0B07105aaB29E99;
		address ownershipToken = 0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f;
		address forwarder = 0xf17beC16794e018E2F0453a1282c3DA3d121f410;
		uint256 registrarIanaId = 0;
		string memory domaChainId = "doma";

		// Marketplace (testnet) from docs
		address usdc = 0x2f3463756C59387D6Cd55b034100caf7ECfc757b;
		address weth = 0x6f898cd313dcEe4D28A87F675BD93C471868B0Ac;
		address feeReceiver = 0x2E7cC63800e77BB8c662c45Ef33D1cCc23861532; // 0.5%
		uint256 feeBps = 50;

		vm.startBroadcast(pk);
		streamEvents = new StreamEvents();
		// Configure for Doma addresses and forwarder
		streamEvents.setDomaConfig(domaProxy, ownershipToken, forwarder, registrarIanaId, domaChainId);
		// Set marketplace configuration
		streamEvents.setMarketplaceCurrencies(usdc, weth);
		streamEvents.setMarketplaceProtocolFee(feeReceiver, feeBps);
		// Set platform config
		streamEvents.updatePlatformFee(250); // 2.5%
		streamEvents.updateRegistrationFeeLimits(0.001 ether, 1 ether);
		vm.stopBroadcast();

		console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
		console.log("StreamEvents:", address(streamEvents));
		console.log("Owner:", streamEvents.owner());
		console.log("Platform Fee:", streamEvents.platformFee(), "basis points");
		console.log("Min Registration Fee:", streamEvents.minRegistrationFee());
		console.log("Max Registration Fee:", streamEvents.maxRegistrationFee());
		console.log("\n=== DOMA CONFIGURATION ===");
		console.log("Doma Proxy:", streamEvents.domaProxy());
		console.log("Ownership Token:", streamEvents.ownershipToken());
		console.log("Trusted Forwarder:", streamEvents.trustedForwarderAddr());
		console.log("Registrar IANA ID:", streamEvents.registrarIanaId());
		console.log("Doma Chain ID:", streamEvents.domaChainId());
		console.log("\n=== MARKETPLACE CURRENCIES ===");
		console.log("USDC:", streamEvents.getUSDC());
		console.log("WETH:", streamEvents.getWETH());
		(address recv, uint256 bps) = streamEvents.getProtocolFee();
		console.log("Protocol Fee Receiver:", recv);
		console.log("Protocol Fee Bps:", bps);
	}
}
