// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/doma/interfaces/IDomaProxy.sol";

contract GetRegistrar is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        IDomaProxy domaProxy = IDomaProxy(vm.envAddress("DOMA_PROXY"));
        console.log("Registrar:", domaProxy.registrarOf(1));
    }
}
