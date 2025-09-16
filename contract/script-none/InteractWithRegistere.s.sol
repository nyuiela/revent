// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";

// Interface for the registere function
interface IRegistereContract {
    function registere(string memory name, bytes memory data) external;
}

contract InteractWithRegistere is Script {
    // Contract address on mainnet - UPDATE THIS WITH THE ACTUAL CONTRACT ADDRESS
    address constant CONTRACT_ADDRESS = 0xe43D53747b3d65A1A983428e6a3A79058FDe633a;
    
    IRegistereContract public registereContract;

    function setUp() public {
        registereContract = IRegistereContract(CONTRACT_ADDRESS);
    }

    function run() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address caller = vm.addr(privateKey);
        
        console.log("Interacting with registere() function");
        console.log("Network:", vm.toString(block.chainid));
        console.log("Caller address:", caller);
        console.log("Contract address:", CONTRACT_ADDRESS);
        console.log("Caller balance:", vm.toString(caller.balance), "wei");
        
        // Example parameters - modify these as needed
        string memory name = "Test User";
        bytes memory data = abi.encodePacked("additional_data_here");
        
        console.log("Name parameter:", name);
        console.log("Data parameter length:", data.length, "bytes");
        
        vm.startBroadcast(privateKey);
        
        // Call the registere function
        registereContract.registere(name, data);
        
        vm.stopBroadcast();
        
        console.log("Successfully called registere() function!");
    }
    
    // Alternative function to call with custom parameters
    function callRegistereWithParams(string memory name, bytes memory data) public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("Calling registere() with custom parameters:");
        console.log("Name:", name);
        console.log("Data length:", data.length, "bytes");
        
        vm.startBroadcast(privateKey);
        registereContract.registere(name, data);
        vm.stopBroadcast();
        
        console.log("Custom registere() call completed!");
    }
}
