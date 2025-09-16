// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {StreamEventsUpgradeable} from "../src/StreamEventsUpgradeable.sol";
import {EventTokenManager} from "../src/EventTokenManager.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract UpgradeableSystemTest is Test {
    StreamEventsUpgradeable public streamEvents;
    EventTokenManager public eventTokenManager;
    ERC1967Proxy public streamEventsProxy;
    ERC1967Proxy public tokenManagerProxy;
    
    address public owner;
    address public user1;
    address public user2;
    address public trustedForwarder;
    
    // Test events
    event ContractUpgraded(address indexed oldImplementation, address indexed newImplementation);
    event EventTokenManagerUpdated(address indexed oldManager, address indexed newManager);
    event TrustedForwarderUpdated(address indexed oldForwarder, address indexed newForwarder);
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        trustedForwarder = makeAddr("trustedForwarder");
        
        // Deploy StreamEventsUpgradeable implementation
        StreamEventsUpgradeable streamEventsImpl = new StreamEventsUpgradeable(trustedForwarder);
        
        // Deploy StreamEventsUpgradeable proxy
        bytes memory streamEventsInitData = abi.encodeWithSelector(
            StreamEventsUpgradeable.initialize.selector,
            "https://api.stream-events.com/metadata/",
            trustedForwarder
        );
        streamEventsProxy = new ERC1967Proxy(address(streamEventsImpl), streamEventsInitData);
        streamEvents = StreamEventsUpgradeable(address(streamEventsProxy));
        
        // Deploy EventTokenManager implementation
        EventTokenManager tokenManagerImpl = new EventTokenManager();
        
        // Deploy EventTokenManager proxy
        bytes memory tokenManagerInitData = abi.encodeWithSelector(
            EventTokenManager.initialize.selector,
            "https://api.stream-events.com/metadata/{id}.json"
        );
        tokenManagerProxy = new ERC1967Proxy(address(tokenManagerImpl), tokenManagerInitData);
        eventTokenManager = EventTokenManager(address(tokenManagerProxy));
        
        // Configure contracts
        eventTokenManager.setStreamEventsContract(address(streamEvents));
        streamEvents.setEventTokenManager(address(eventTokenManager));
    }
    
    function testInitialDeployment() public {
        console.log("Testing initial deployment...");
        
        // Check StreamEventsUpgradeable
        assertEq(streamEvents.owner(), owner);
        assertEq(streamEvents.trustedForwarderAddr(), trustedForwarder);
        assertEq(streamEvents.version(), "1.0.0");
        assertTrue(streamEvents.isTrustedForwarder(trustedForwarder));
        assertFalse(streamEvents.isTrustedForwarder(user1));
        
        // Check EventTokenManager
        assertEq(eventTokenManager.owner(), owner);
        assertEq(eventTokenManager.streamEventsContract(), address(streamEvents));
        
        console.log("SUCCESS: Initial deployment successful");
    }
    
    function testStreamEventsUpgrade() public {
        console.log("Testing StreamEventsUpgradeable upgrade...");
        
        // Deploy new implementation
        StreamEventsUpgradeableV2 newImpl = new StreamEventsUpgradeableV2(trustedForwarder);
        
        // Check initial version
        assertEq(streamEvents.version(), "1.0.0");
        
        // Expect upgrade event
        vm.expectEmit(true, true, true, true);
        emit ContractUpgraded(address(streamEvents), address(newImpl));
        
        // Perform upgrade
        streamEvents.upgradeToAndCall(address(newImpl), "");
        
        // Check new version
        assertEq(streamEvents.version(), "2.0.0");
        
        // Check that new functionality works
        assertEq(StreamEventsUpgradeableV2(address(streamEvents)).newFeature(), "New feature from V2");
        
        console.log("SUCCESS: StreamEventsUpgradeable upgrade successful");
    }
    
    function testEventTokenManagerUpgrade() public {
        console.log("Testing EventTokenManager upgrade...");
        
        // Deploy new implementation
        EventTokenManagerV2 newImpl = new EventTokenManagerV2();
        
        // Perform upgrade
        eventTokenManager.upgradeToAndCall(address(newImpl), "");
        
        // Check that new functionality works
        assertEq(EventTokenManagerV2(address(eventTokenManager)).newTokenFeature(), "New token feature from V2");
        
        console.log("SUCCESS: EventTokenManager upgrade successful");
    }
    
    function testEventTokenManagerIntegration() public {
        console.log("Testing EventTokenManager integration...");
        
        // Create a test event (simulated)
        uint256 eventId = 1;
        uint256 totalSupply = 100;
        string memory tokenUri = "https://api.stream-events.com/metadata/1.json";
        
        // Mint event tokens as StreamEvents contract
        vm.prank(address(streamEvents));
        eventTokenManager.mintEventTokens(eventId, totalSupply, tokenUri);
        
        // Check token was minted
        uint256 tokenId = eventTokenManager.getEventTokenId(eventId);
        assertTrue(tokenId > 0);
        assertEq(eventTokenManager.getRemainingTokenSupply(eventId), totalSupply);
        
        // Transfer token to user as StreamEvents contract
        vm.prank(address(streamEvents));
        eventTokenManager.transferRegistrationToken(eventId, user1, 1);
        
        // Check user has token
        assertTrue(eventTokenManager.hasEventTokens(eventId, user1));
        assertEq(eventTokenManager.getEventTokenBalance(eventId, user1), 1);
        assertEq(eventTokenManager.getRemainingTokenSupply(eventId), totalSupply - 1);
        
        console.log("SUCCESS: EventTokenManager integration successful");
    }
    
    function testTrustedForwarderUpdate() public {
        console.log("Testing trusted forwarder update...");
        
        address newForwarder = makeAddr("newForwarder");
        
        // Expect update event
        vm.expectEmit(true, true, true, true);
        emit TrustedForwarderUpdated(trustedForwarder, newForwarder);
        
        // Update trusted forwarder
        streamEvents.setTrustedForwarder(newForwarder);
        
        // Check update
        assertEq(streamEvents.trustedForwarderAddr(), newForwarder);
        assertTrue(streamEvents.isTrustedForwarder(newForwarder));
        assertFalse(streamEvents.isTrustedForwarder(trustedForwarder));
        
        console.log("SUCCESS: Trusted forwarder update successful");
    }
    
    function testEventTokenManagerUpdate() public {
        console.log("Testing EventTokenManager update...");
        
        // Deploy new EventTokenManager
        EventTokenManager newTokenManager = new EventTokenManager();
        ERC1967Proxy newTokenManagerProxy = new ERC1967Proxy(address(newTokenManager), "");
        EventTokenManager newTokenManagerInstance = EventTokenManager(address(newTokenManagerProxy));
        
        // Initialize new token manager
        newTokenManagerInstance.initialize("https://api.stream-events.com/metadata/{id}.json");
        newTokenManagerInstance.setStreamEventsContract(address(streamEvents));
        
        // Expect update event
        vm.expectEmit(true, true, true, true);
        emit EventTokenManagerUpdated(address(eventTokenManager), address(newTokenManagerInstance));
        
        // Update EventTokenManager
        streamEvents.setEventTokenManager(address(newTokenManagerInstance));
        
        // Check update
        assertEq(address(streamEvents.eventTokenManager()), address(newTokenManagerInstance));
        
        console.log("SUCCESS: EventTokenManager update successful");
    }
    
    function testUpgradeAuthorization() public {
        console.log("Testing upgrade authorization...");
        
        // Deploy new implementation
        StreamEventsUpgradeableV2 newImpl = new StreamEventsUpgradeableV2(trustedForwarder);
        
        // Try to upgrade as non-owner (should fail)
        vm.prank(user1);
        vm.expectRevert();
        streamEvents.upgradeToAndCall(address(newImpl), "");
        
        // Upgrade as owner (should succeed)
        streamEvents.upgradeToAndCall(address(newImpl), "");
        
        console.log("SUCCESS: Upgrade authorization test successful");
    }
    
    function testDataPreservationAfterUpgrade() public {
        console.log("Testing data preservation after upgrade...");
        
        // Set some data before upgrade
        address testTokenManager = makeAddr("testTokenManager");
        streamEvents.setEventTokenManager(testTokenManager);
        
        // Deploy and upgrade to new implementation
        StreamEventsUpgradeableV2 newImpl = new StreamEventsUpgradeableV2(trustedForwarder);
        streamEvents.upgradeToAndCall(address(newImpl), "");
        
        // Check data is preserved
        assertEq(address(streamEvents.eventTokenManager()), testTokenManager);
        assertEq(streamEvents.owner(), owner);
        assertEq(streamEvents.trustedForwarderAddr(), trustedForwarder);
        
        console.log("SUCCESS: Data preservation test successful");
    }
    
    function testEmergencyFunctions() public {
        console.log("Testing emergency functions...");
        
        // Test emergency pause (should not revert)
        streamEvents.emergencyPause();
        
        // Test emergency unpause (should not revert)
        streamEvents.emergencyUnpause();
        
        console.log("SUCCESS: Emergency functions test successful");
    }
    
    function testVersionTracking() public {
        console.log("Testing version tracking...");
        
        // Check initial version
        assertEq(streamEvents.version(), "1.0.0");
        
        // Upgrade and check new version
        StreamEventsUpgradeableV2 newImpl = new StreamEventsUpgradeableV2(trustedForwarder);
        streamEvents.upgradeToAndCall(address(newImpl), "");
        assertEq(streamEvents.version(), "2.0.0");
        
        console.log("SUCCESS: Version tracking test successful");
    }
    
    function testUpgradeWithData() public {
        console.log("Testing upgrade with data...");
        
        // Deploy new implementation
        StreamEventsUpgradeableV2 newImpl = new StreamEventsUpgradeableV2(trustedForwarder);
        
        // Prepare upgrade data
        bytes memory upgradeData = abi.encodeWithSelector(
            StreamEventsUpgradeableV2.initializeV2.selector,
            "Initialized from upgrade"
        );
        
        // Perform upgrade with data
        streamEvents.upgradeToAndCall(address(newImpl), upgradeData);
        
        // Check that data was processed
        assertEq(streamEvents.version(), "2.0.0");
        
        console.log("SUCCESS: Upgrade with data test successful");
    }
}

// Test implementation V2 for StreamEventsUpgradeable
contract StreamEventsUpgradeableV2 is StreamEventsUpgradeable {
    string public newFeatureValue;
    
    constructor(address trustedForwarder_) StreamEventsUpgradeable(trustedForwarder_) {
        _disableInitializers();
    }
    
    function initializeV2(string memory _newFeature) public reinitializer(2) {
        newFeatureValue = _newFeature;
    }
    
    function newFeature() public pure returns (string memory) {
        return "New feature from V2";
    }
    
    function version() public pure override returns (string memory) {
        return "2.0.0";
    }
}

// Test implementation V2 for EventTokenManager
contract EventTokenManagerV2 is EventTokenManager {
    string public newTokenFeatureValue;
    
    constructor() {
        _disableInitializers();
    }
    
    function initializeV2(string memory _newFeature) public reinitializer(2) {
        newTokenFeatureValue = _newFeature;
    }
    
    function newTokenFeature() public pure returns (string memory) {
        return "New token feature from V2";
    }
}
