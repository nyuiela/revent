// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/v2/StreamEventsV2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployV2Script is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying StreamEvents V2...");
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy implementation
        StreamEventsV2 implementation = new StreamEventsV2();
        console.log("Implementation deployed at:", address(implementation));
        
        // Deploy proxy
        address trustedForwarder = address(0); // Set to actual forwarder address
        address feeRecipient = deployer; // Set to actual fee recipient
        uint256 platformFee = 250; // 2.5%
        address domaProxy = address(0); // Set to actual Doma proxy address
        address ownershipToken = address(0); // Set to actual ownership token address
        uint256 registrarIanaId = 0; // Set to actual registrar IANA ID
        string memory domaChainId = "eip155:1"; // Ethereum mainnet
        
        bytes memory initData = abi.encodeWithSelector(
            StreamEventsV2.initialize.selector,
            deployer,           // initialOwner
            trustedForwarder,   // trustedForwarder
            feeRecipient,       // feeRecipient
            platformFee,        // platformFee
            domaProxy,          // domaProxy
            ownershipToken,     // ownershipToken
            registrarIanaId,    // registrarIanaId
            domaChainId         // domaChainId
        );
        
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        console.log("Proxy deployed at:", address(proxy));
        
        // Verify deployment
        StreamEventsV2 v2 = StreamEventsV2(address(proxy));
        console.log("Version:", v2.version());
        console.log("Owner:", v2.owner());
        console.log("Platform fee:", v2.getPlatformFee());
        console.log("Doma proxy:", v2.domaProxy());
        console.log("Ownership token:", v2.ownershipToken());
        
        vm.stopBroadcast();
        
        console.log("Deployment completed successfully!");
        console.log("Proxy address:", address(proxy));
        console.log("Implementation address:", address(implementation));
    }
}
