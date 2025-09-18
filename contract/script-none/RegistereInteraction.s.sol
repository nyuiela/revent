// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";

// Interface for the registere function
interface IRegisterContract {
    // function register(string memory name, bytes memory data) external;
       function registerWithContent(
        string calldata label,
        address owner,
        bytes calldata contentHash,
        string[] calldata textKeys,
        string[] calldata textValues
    ) external;
  function register(string calldata label, address owner) external;
}

contract RegistereInteraction is Script {
    // Contract addresses for different networks
    mapping(uint256 => address) public contractAddresses;
    
    IRegisterContract public registerContract;

    function setUp() public {
        // Set contract addresses for different networks
        contractAddresses[1] = 0x0000000000000000000000000000000000000000; // Ethereum Mainnet - UPDATE THIS
        contractAddresses[8453] = 0x0000000000000000000000000000000000000000; // Base Mainnet - UPDATE THIS
        contractAddresses[84532] = 0xe43D53747b3d65A1A983428e6a3A79058FDe633a; // Base Sepolia (from your deployment)
        contractAddresses[31337] = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0; // Local Anvil
        
        uint256 chainId = block.chainid;
        address contractAddr = 0xC1289590a0445Bf2149995A9Fe20Ed3795B82f5B;
        
        registerContract = IRegisterContract(contractAddr);
        
        console.log("Setup complete:");
        console.log("Chain ID:", chainId);
        console.log("Contract address:", contractAddr);
    }

    function run() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address caller = vm.addr(privateKey);
        
        console.log("\n=== Registere Interaction Script ===");
        console.log("Network:", vm.toString(block.chainid));
        console.log("Caller address:", caller);
        console.log("Contract address:", address(registerContract));
        console.log("Caller balance:", vm.toString(caller.balance), "wei");
        
            string[] memory m = new string[](1);
            string[] memory v = new string[](1);
            v[0] = "100";
            m[0] = "participants";
            vm.startBroadcast(privateKey);
            registerContract.register("ethAcra", caller);
        // registerContract.registerWithContent("ethAcra.nyuiela", caller, "bafkreiavr7uckza7uvn464xiwz7vdwuneif4h33eunj4ul2dilheosrfga", m, v);
        
        vm.stopBroadcast();
        
        console.log("\n=== Transaction Complete ===");
    }
    
}
