// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {L2Registry} from "../src/L2Registry.sol";
import {L2RegistryFactory} from "../src/L2RegistryFactory.sol";
import {L2Registrar} from "../src/examples/L2Registrar.sol";

/// @title ContentHashTest
/// @notice Test contract to demonstrate contentHash and text record functionality
contract ContentHashTest is Test {
    L2RegistryFactory public factory;
    L2Registry public registry;
    L2Registrar public registrar;
    address public admin = address(0x1);
    address public user = address(0x2);

    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy factory
        factory = new L2RegistryFactory(address(new L2Registry()));
        
        // Deploy registry through factory
        registry = L2Registry(factory.deployRegistry("test.eth"));
        
        // Deploy registrar
        registrar = new L2Registrar(address(registry));
        
        // Add registrar to registry
        registry.addRegistrar(address(registrar));
        
        vm.stopPrank();
    }

    function testRegisterWithContentHash() public {
        string memory label = "mysite";
        bytes memory contentHash = abi.encodePacked(
            uint8(0x01), // IPFS protocol
            uint8(0x70), // CIDv1
            uint8(0x12), // SHA2-256
            uint8(0x20), // 32 bytes
            keccak256("QmTestContentHash123456789012345678901234567890123456789012345678901234") // Mock CID
        );
        
        string[] memory textKeys = new string[](3);
        textKeys[0] = "description";
        textKeys[1] = "url";
        textKeys[2] = "avatar";
        
        string[] memory textValues = new string[](3);
        textValues[0] = "My awesome website";
        textValues[1] = "https://mysite.test.eth";
        textValues[2] = "https://example.com/avatar.png";

        // Register with contentHash and text records
        registrar.registerWithContent(
            label,
            user,
            contentHash,
            textKeys,
            textValues
        );

        // Verify the name was registered
        bytes32 node = registry.makeNode(registry.baseNode(), label);
        assertEq(registry.owner(node), user);

        // Verify contentHash was set
        bytes memory retrievedContentHash = registry.contenthash(node);
        assertEq(retrievedContentHash, contentHash);

        // Verify text records were set
        assertEq(registry.text(node, "description"), "My awesome website");
        assertEq(registry.text(node, "url"), "https://mysite.test.eth");
        assertEq(registry.text(node, "avatar"), "https://example.com/avatar.png");

        // Test getting contentHash through registrar
        bytes memory registrarContentHash = registrar.getContentHash(label);
        assertEq(registrarContentHash, contentHash);

        // Test getting text record through registrar
        string memory description = registrar.getTextRecord(label, "description");
        assertEq(description, "My awesome website");
    }

    function testUpdateContentHash() public {
        string memory label = "updatesite";
        
        // First register a basic name
        registrar.register(label, user);
        
        bytes32 node = registry.makeNode(registry.baseNode(), label);
        
        // Update contentHash
        bytes memory newContentHash = abi.encodePacked(
            uint8(0x01), // IPFS protocol
            uint8(0x70), // CIDv1
            uint8(0x12), // SHA2-256
            uint8(0x20), // 32 bytes
            keccak256("QmNewContentHash123456789012345678901234567890123456789012345678901234") // Mock CID
        );

        vm.prank(user);
        registrar.updateContentHash(label, newContentHash);

        // Verify contentHash was updated
        bytes memory retrievedContentHash = registry.contenthash(node);
        assertEq(retrievedContentHash, newContentHash);
    }

    function testUpdateTextRecords() public {
        string memory label = "textsite";
        
        // First register a basic name
        registrar.register(label, user);
        
        bytes32 node = registry.makeNode(registry.baseNode(), label);
        
        // Update text records
        string[] memory textKeys = new string[](2);
        textKeys[0] = "title";
        textKeys[1] = "email";
        
        string[] memory textValues = new string[](2);
        textValues[0] = "My Website Title";
        textValues[1] = "contact@mysite.com";

        vm.prank(user);
        registrar.updateTextRecords(label, textKeys, textValues);

        // Verify text records were updated
        assertEq(registry.text(node, "title"), "My Website Title");
        assertEq(registry.text(node, "email"), "contact@mysite.com");
    }

    function testOnlyOwnerCanUpdate() public {
        string memory label = "protected";
        address otherUser = address(0x3);
        
        // Register name to user
        registrar.register(label, user);
        
        bytes memory contentHash = abi.encodePacked(
            uint8(0x01),
            uint8(0x70),
            uint8(0x12),
            uint8(0x20),
            keccak256("QmProtectedContentHash123456789012345678901234567890123456789012345678901234")
        );

        // Try to update contentHash as non-owner (should fail)
        vm.prank(otherUser);
        vm.expectRevert("Not the owner of this name");
        registrar.updateContentHash(label, contentHash);

        // Try to update text records as non-owner (should fail)
        string[] memory textKeys = new string[](1);
        textKeys[0] = "title";
        string[] memory textValues = new string[](1);
        textValues[0] = "Hacked Title";

        vm.prank(otherUser);
        vm.expectRevert("Not the owner of this name");
        registrar.updateTextRecords(label, textKeys, textValues);
    }
}
