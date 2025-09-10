// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../src/doma/interfaces/IDomaProxy.sol";

contract MockDomaProxy is IDomaProxy {
    function requestTokenization(TokenizationVoucher calldata, bytes calldata) external payable override {
        // Mock implementation - just accept the call
        // In real implementation, this would validate signatures and process tokenization
    }
    
    function claimOwnership(uint256, bool, ProofOfContactsVoucher calldata, bytes calldata) external payable override {
        // Mock implementation - just accept the call
    }
    
    function bridge(uint256, bool, string calldata, string calldata) external payable override {
        // Mock implementation - just accept the call
    }
    
    function requestDetokenization(uint256, bool) external override {
        // Mock implementation - just accept the call
    }
}

