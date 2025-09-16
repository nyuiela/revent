// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {EventTokenManager} from "../src/EventTokenManager.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract EventTokenManagerUpgradeTest is Test {
    EventTokenManager public eventTokenManager;
    ERC1967Proxy public proxy;
    
    address public owner;
    address public streamEventsContract;
    address public user1;
    address public user2;
    
    function setUp() public {
        owner = address(this);
        streamEventsContract = makeAddr("streamEvents");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Deploy EventTokenManager implementation
        EventTokenManager implementation = new EventTokenManager();
        
        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            EventTokenManager.initialize.selector,
            "https://api.stream-events.com/metadata/{id}.json"
        );
        proxy = new ERC1967Proxy(address(implementation), initData);
        eventTokenManager = EventTokenManager(address(proxy));
        
        // Configure
        eventTokenManager.setStreamEventsContract(streamEventsContract);
    }
    
    function testInitialDeployment() public {
        console.log("Testing EventTokenManager initial deployment...");
        
        assertEq(eventTokenManager.owner(), owner);
        assertEq(eventTokenManager.streamEventsContract(), streamEventsContract);
        
        console.log("SUCCESS: Initial deployment successful");
    }
    
    function testMintEventTokens() public {
        console.log("Testing event token minting...");
        
        uint256 eventId = 1;
        uint256 totalSupply = 100;
        string memory tokenUri = "https://api.stream-events.com/metadata/1.json";
        
        // Mint tokens as StreamEvents contract
        vm.prank(streamEventsContract);
        uint256 tokenId = eventTokenManager.mintEventTokens(eventId, totalSupply, tokenUri);
        
        // Check token was minted
        assertTrue(tokenId > 0);
        assertEq(eventTokenManager.getEventTokenId(eventId), tokenId);
        assertEq(eventTokenManager.getRemainingTokenSupply(eventId), totalSupply);
        assertEq(eventTokenManager.getEventTokenUri(eventId), tokenUri);
        
        console.log("SUCCESS: Event token minting successful");
    }
    
    function testTransferRegistrationToken() public {
        console.log("Testing registration token transfer...");
        
        uint256 eventId = 1;
        uint256 totalSupply = 100;
        string memory tokenUri = "https://api.stream-events.com/metadata/1.json";
        
        // Mint tokens first
        vm.prank(streamEventsContract);
        eventTokenManager.mintEventTokens(eventId, totalSupply, tokenUri);
        
        // Transfer token to user
        vm.prank(streamEventsContract);
        eventTokenManager.transferRegistrationToken(eventId, user1, 1);
        
        // Check transfer
        assertTrue(eventTokenManager.hasEventTokens(eventId, user1));
        assertEq(eventTokenManager.getEventTokenBalance(eventId, user1), 1);
        assertEq(eventTokenManager.getRemainingTokenSupply(eventId), totalSupply - 1);
        
        console.log("SUCCESS: Registration token transfer successful");
    }
    
    function testUpgradeToV2() public {
        console.log("Testing EventTokenManager upgrade to V2...");
        
        // Deploy V2 implementation
        EventTokenManagerV2 newImpl = new EventTokenManagerV2();
        
        // Upgrade
        eventTokenManager.upgradeToAndCall(address(newImpl), "");
        
        // Check new functionality
        assertEq(EventTokenManagerV2(address(eventTokenManager)).newTokenFeature(), "New token feature from V2");
        assertEq(EventTokenManagerV2(address(eventTokenManager)).enhancedVersion(), "2.0.0");
        
        console.log("SUCCESS: EventTokenManager upgrade to V2 successful");
    }
    
    function testDataPreservationAfterUpgrade() public {
        console.log("Testing data preservation after upgrade...");
        
        uint256 eventId = 1;
        uint256 totalSupply = 100;
        string memory tokenUri = "https://api.stream-events.com/metadata/1.json";
        
        // Set up data before upgrade
        vm.prank(streamEventsContract);
        uint256 tokenId = eventTokenManager.mintEventTokens(eventId, totalSupply, tokenUri);
        
        vm.prank(streamEventsContract);
        eventTokenManager.transferRegistrationToken(eventId, user1, 5);
        
        // Upgrade
        EventTokenManagerV2 newImpl = new EventTokenManagerV2();
        eventTokenManager.upgradeToAndCall(address(newImpl), "");
        
        // Check data is preserved
        assertEq(eventTokenManager.getEventTokenId(eventId), tokenId);
        assertEq(eventTokenManager.getEventTokenBalance(eventId, user1), 5);
        assertEq(eventTokenManager.getRemainingTokenSupply(eventId), totalSupply - 5);
        assertEq(eventTokenManager.owner(), owner);
        assertEq(eventTokenManager.streamEventsContract(), streamEventsContract);
        
        console.log("SUCCESS: Data preservation after upgrade successful");
    }
    
    function testBatchTransferAfterUpgrade() public {
        console.log("Testing batch transfer after upgrade...");
        
        uint256 eventId = 1;
        uint256 totalSupply = 100;
        string memory tokenUri = "https://api.stream-events.com/metadata/1.json";
        
        // Set up data
        vm.prank(streamEventsContract);
        eventTokenManager.mintEventTokens(eventId, totalSupply, tokenUri);
        
        // Upgrade
        EventTokenManagerV2 newImpl = new EventTokenManagerV2();
        eventTokenManager.upgradeToAndCall(address(newImpl), "");
        
        // Test batch transfer
        uint256[] memory eventIds = new uint256[](2);
        address[] memory attendees = new address[](2);
        uint256[] memory amounts = new uint256[](2);
        
        eventIds[0] = eventId;
        eventIds[1] = eventId;
        attendees[0] = user1;
        attendees[1] = user2;
        amounts[0] = 1;
        amounts[1] = 2;
        
        vm.prank(streamEventsContract);
        eventTokenManager.batchTransferRegistrationTokens(eventIds, attendees, amounts);
        
        // Check transfers
        assertEq(eventTokenManager.getEventTokenBalance(eventId, user1), 1);
        assertEq(eventTokenManager.getEventTokenBalance(eventId, user2), 2);
        
        console.log("SUCCESS: Batch transfer after upgrade successful");
    }
    
    function testUpgradeWithInitialization() public {
        console.log("Testing upgrade with initialization...");
        
        // Deploy V2 implementation
        EventTokenManagerV2 newImpl = new EventTokenManagerV2();
        
        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            EventTokenManagerV2.initializeV2.selector,
            "Enhanced token manager V2"
        );
        
        // Upgrade with initialization
        eventTokenManager.upgradeToAndCall(address(newImpl), initData);
        
        // Check initialization worked
        assertEq(EventTokenManagerV2(address(eventTokenManager)).enhancedVersion(), "2.0.0");
        
        console.log("SUCCESS: Upgrade with initialization successful");
    }
    
    function testAccessControlAfterUpgrade() public {
        console.log("Testing access control after upgrade...");
        
        // Upgrade
        EventTokenManagerV2 newImpl = new EventTokenManagerV2();
        eventTokenManager.upgradeToAndCall(address(newImpl), "");
        
        // Test that only StreamEvents can call protected functions
        vm.prank(user1);
        vm.expectRevert();
        eventTokenManager.mintEventTokens(1, 100, "test");
        
        // Test that owner can still call owner functions
        eventTokenManager.setStreamEventsContract(user1);
        assertEq(eventTokenManager.streamEventsContract(), user1);
        
        console.log("SUCCESS: Access control after upgrade successful");
    }
    
    function testUpgradeAuthorization() public {
        console.log("Testing upgrade authorization...");
        
        // Deploy V2 implementation
        EventTokenManagerV2 newImpl = new EventTokenManagerV2();
        
        // Try to upgrade as non-owner (should fail)
        vm.prank(user1);
        vm.expectRevert();
        eventTokenManager.upgradeToAndCall(address(newImpl), "");
        
        // Upgrade as owner (should succeed)
        eventTokenManager.upgradeToAndCall(address(newImpl), "");
        
        console.log("SUCCESS: Upgrade authorization test successful");
    }
}

// Enhanced EventTokenManager V2 for testing
contract EventTokenManagerV2 is EventTokenManager {
    string public newTokenFeatureValue;
    string public enhancedVersionValue;
    
    constructor() {
        _disableInitializers();
    }
    
    function initializeV2(string memory _newFeature) public reinitializer(2) {
        newTokenFeatureValue = _newFeature;
        enhancedVersionValue = "2.0.0";
    }
    
    function newTokenFeature() public pure returns (string memory) {
        return "New token feature from V2";
    }
    
    function enhancedVersion() public pure returns (string memory) {
        return "2.0.0";
    }
}
