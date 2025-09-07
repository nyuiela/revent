// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {StringUtils} from "@ensdomains/ens-contracts/utils/StringUtils.sol";

import {IL2Registry} from "../interfaces/IL2Registry.sol";

/// @dev This is an example registrar contract that is mean to be modified.
contract L2Registrar {
    using StringUtils for string;

    /// @notice Emitted when a new name is registered
    /// @param label The registered label (e.g. "name" in "name.eth")
    /// @param owner The owner of the newly registered name
    event NameRegistered(string indexed label, address indexed owner);

    /// @notice Reference to the target registry contract
    IL2Registry public immutable registry;

    /// @notice The chainId for the current chain
    uint256 public chainId;

    /// @notice The coinType for the current chain (ENSIP-11)
    uint256 public immutable coinType;

    /// @notice Initializes the registrar with a registry contract
    /// @param _registry Address of the L2Registry contract
    constructor(address _registry) {
        // Save the chainId in memory (can only access this in assembly)
        assembly {
            sstore(chainId.slot, chainid())
        }

        // Calculate the coinType for the current chain according to ENSIP-11
        coinType = (0x80000000 | chainId) >> 0;

        // Save the registry address
        registry = IL2Registry(_registry);
    }

    /// @notice Registers a new name
    /// @param label The label to register (e.g. "name" for "name.eth")
    /// @param owner The address that will own the name
    function register(string calldata label, address owner) external {
        bytes32 node = _labelToNode(label);
        bytes memory addr = abi.encodePacked(owner); // Convert address to bytes

        // Set the forward address for the current chain. This is needed for reverse resolution.
        // E.g. if this contract is deployed to Base, set an address for chainId 8453 which is
        // coinType 2147492101 according to ENSIP-11.
        registry.setAddr(node, coinType, addr);

        // Set the forward address for mainnet ETH (coinType 60) for easier debugging.
        registry.setAddr(node, 60, addr);

        // Register the name in the L2 registry
        registry.createSubnode(
            registry.baseNode(),
            label,
            owner,
            new bytes[](0)
        );
        emit NameRegistered(label, owner);
    }

    /// @notice Registers a new name with contentHash (CID) and text records
    /// @param label The label to register (e.g. "name" for "name.eth")
    /// @param owner The address that will own the name
    /// @param contentHash The contentHash (CID) for the website HTML content
    /// @param textKeys Array of text record keys
    /// @param textValues Array of text record values
    function registerWithContent(
        string calldata label,
        address owner,
        bytes calldata contentHash,
        string[] calldata textKeys,
        string[] calldata textValues
    ) external {
        require(textKeys.length == textValues.length, "Text keys and values length mismatch");
        
        bytes32 node = _labelToNode(label);
        bytes memory addr = abi.encodePacked(owner); // Convert address to bytes

        // Set the forward address for the current chain. This is needed for reverse resolution.
        // E.g. if this contract is deployed to Base, set an address for chainId 8453 which is
        // coinType 2147492101 according to ENSIP-11.
        registry.setAddr(node, coinType, addr);

        // Set the forward address for mainnet ETH (coinType 60) for easier debugging.
        registry.setAddr(node, 60, addr);

        // Set contentHash for the website CID
        if (contentHash.length > 0) {
            registry.setContenthash(node, contentHash);
        }

        // Set text records
        for (uint256 i = 0; i < textKeys.length; i++) {
            if (bytes(textKeys[i]).length > 0 && bytes(textValues[i]).length > 0) {
                registry.setText(node, textKeys[i], textValues[i]);
            }
        }

        // Register the name in the L2 registry
        registry.createSubnode(
            registry.baseNode(),
            label,
            owner,
            new bytes[](0)
        );
        emit NameRegistered(label, owner);
    }

    /// @notice Checks if a given label is available for registration
    /// @dev Uses try-catch to handle the ERC721NonexistentToken error
    /// @param label The label to check availability for
    /// @return available True if the label can be registered, false if already taken
    function available(string calldata label) external view returns (bool) {
        bytes32 node = _labelToNode(label);
        uint256 tokenId = uint256(node);

        try registry.ownerOf(tokenId) {
            return false;
        } catch {
            if (label.strlen() >= 3) {
                return true;
            }
            return false;
        }
    }

    /// @notice Updates contentHash for an existing name
    /// @param label The label to update
    /// @param contentHash The new contentHash (CID) for the website HTML content
    function updateContentHash(string calldata label, bytes calldata contentHash) external {
        bytes32 node = _labelToNode(label);
        require(registry.owner(node) == msg.sender, "Not the owner of this name");
        registry.setContenthash(node, contentHash);
    }

    /// @notice Updates text records for an existing name
    /// @param label The label to update
    /// @param textKeys Array of text record keys
    /// @param textValues Array of text record values
    function updateTextRecords(
        string calldata label,
        string[] calldata textKeys,
        string[] calldata textValues
    ) external {
        require(textKeys.length == textValues.length, "Text keys and values length mismatch");
        
        bytes32 node = _labelToNode(label);
        require(registry.owner(node) == msg.sender, "Not the owner of this name");
        
        for (uint256 i = 0; i < textKeys.length; i++) {
            if (bytes(textKeys[i]).length > 0 && bytes(textValues[i]).length > 0) {
                registry.setText(node, textKeys[i], textValues[i]);
            }
        }
    }

    /// @notice Gets the contentHash for a name
    /// @param label The label to query
    /// @return The contentHash (CID) for the name
    function getContentHash(string calldata label) external view returns (bytes memory) {
        bytes32 node = _labelToNode(label);
        return registry.contenthash(node);
    }

    /// @notice Gets a text record for a name
    /// @param label The label to query
    /// @param key The text record key
    /// @return The text record value
    function getTextRecord(string calldata label, string calldata key) external view returns (string memory) {
        bytes32 node = _labelToNode(label);
        return registry.text(node, key);
    }

    function _labelToNode(
        string calldata label
    ) private view returns (bytes32) {
        return registry.makeNode(registry.baseNode(), label);
    }
}
