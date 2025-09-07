// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {L2Registry} from "../src/L2Registry.sol";
import {L2RegistryFactory} from "../src/L2RegistryFactory.sol";
import {L2Registrar} from "../src/examples/L2Registrar.sol";

/// @title ContentHashExample
/// @notice Example contract demonstrating how to use contentHash and text records
/// @dev This contract shows how to register subdomains with website content
contract ContentHashExample {
    L2Registry public registry;
    L2Registrar public registrar;
    
    event WebsiteRegistered(string indexed label, address indexed owner, bytes contentHash);
    event ContentUpdated(string indexed label, bytes newContentHash);
    
    constructor(address _registry, address _registrar) {
        registry = L2Registry(_registry);
        registrar = L2Registrar(_registrar);
    }
    
    /// @notice Registers a subdomain with website content
    /// @param label The subdomain label (e.g., "mysite" for "mysite.yourdomain.eth")
    /// @param owner The owner of the subdomain
    /// @param ipfsCid The IPFS CID of the website HTML content
    /// @param description Website description
    /// @param url Website URL
    /// @param avatar Avatar image URL
    function registerWebsite(
        string calldata label,
        address owner,
        string calldata ipfsCid,
        string calldata description,
        string calldata url,
        string calldata avatar
    ) external {
        // Convert IPFS CID to contentHash format
        bytes memory contentHash = _encodeIpfsContentHash(ipfsCid);
        
        // Prepare text records
        string[] memory textKeys = new string[](3);
        textKeys[0] = "description";
        textKeys[1] = "url";
        textKeys[2] = "avatar";
        
        string[] memory textValues = new string[](3);
        textValues[0] = description;
        textValues[1] = url;
        textValues[2] = avatar;
        
        // Register with contentHash and text records
        registrar.registerWithContent(
            label,
            owner,
            contentHash,
            textKeys,
            textValues
        );
        
        emit WebsiteRegistered(label, owner, contentHash);
    }
    
    /// @notice Updates the contentHash for an existing subdomain
    /// @param label The subdomain label
    /// @param newIpfsCid The new IPFS CID
    function updateWebsiteContent(
        string calldata label,
        string calldata newIpfsCid
    ) external {
        bytes memory newContentHash = _encodeIpfsContentHash(newIpfsCid);
        
        registrar.updateContentHash(label, newContentHash);
        
        emit ContentUpdated(label, newContentHash);
    }
    
    /// @notice Gets website information for a subdomain
    /// @param label The subdomain label
    /// @return contentHash The contentHash (CID) of the website
    /// @return description Website description
    /// @return url Website URL
    /// @return avatar Avatar image URL
    function getWebsiteInfo(string calldata label) 
        external 
        view 
        returns (
            bytes memory contentHash,
            string memory description,
            string memory url,
            string memory avatar
        ) 
    {
        contentHash = registrar.getContentHash(label);
        description = registrar.getTextRecord(label, "description");
        url = registrar.getTextRecord(label, "url");
        avatar = registrar.getTextRecord(label, "avatar");
    }
    
    /// @notice Encodes an IPFS CID into the proper contentHash format
    /// @param cid The IPFS CID string (e.g., "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco")
    /// @return The encoded contentHash bytes
    function _encodeIpfsContentHash(string calldata cid) 
        internal 
        pure 
        returns (bytes memory) 
    {
        // For IPFS, the contentHash format is:
        // 0x01 + 0x70 + 0x12 + 0x20 + 32-byte hash
        // This is a simplified encoding - in practice, you'd need proper CID parsing
        
        bytes memory cidBytes = bytes(cid);
        require(cidBytes.length > 0, "CID cannot be empty");
        
        // Create a mock contentHash (in practice, you'd parse the actual CID)
        bytes32 cidHash = keccak256(cidBytes);
        
        return abi.encodePacked(
            uint8(0x01), // IPFS protocol identifier
            uint8(0x70), // CIDv1
            uint8(0x12), // SHA2-256
            uint8(0x20), // 32 bytes
            cidHash
        );
    }
    
    /// @notice Checks if a subdomain is available for registration
    /// @param label The subdomain label to check
    /// @return True if available, false if taken
    function isSubdomainAvailable(string calldata label) external view returns (bool) {
        return registrar.available(label);
    }
}
