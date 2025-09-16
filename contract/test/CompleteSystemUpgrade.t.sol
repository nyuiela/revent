// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {StreamEventsUpgradeable} from "../src/StreamEventsUpgradeable.sol";
import {EventTokenManager} from "../src/EventTokenManager.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract CompleteSystemUpgradeTest is Test {
    StreamEventsUpgradeable public streamEvents;
    EventTokenManager public eventTokenManager;
    ERC1967Proxy public streamEventsProxy;
    ERC1967Proxy public tokenManagerProxy;
    
    address public owner;
    address public user1;
    address public user2;
    address public trustedForwarder;
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        trustedForwarder = makeAddr("trustedForwarder");
        
        // Deploy complete system
        deployCompleteSystem();
    }
    
    function deployCompleteSystem() internal {
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
    
    function testCompleteSystemDeployment() public {
        console.log("Testing complete system deployment...");
        
        // Check StreamEvents
        assertEq(streamEvents.owner(), owner);
        assertEq(streamEvents.trustedForwarderAddr(), trustedForwarder);
        assertEq(streamEvents.version(), "1.0.0");
        
        // Check EventTokenManager
        assertEq(eventTokenManager.owner(), owner);
        assertEq(eventTokenManager.streamEventsContract(), address(streamEvents));
        
        // Check integration
        assertEq(address(address(streamEvents.eventTokenManager())), address(eventTokenManager));
        
        console.log("SUCCESS: Complete system deployment successful");
    }
    
    function testSimulatedEventFlow() public {
        console.log("Testing simulated event flow...");
        
        uint256 eventId = 1;
        uint256 totalSupply = 100;
        string memory tokenUri = "https://api.stream-events.com/metadata/1.json";
        
        // Simulate event creation (mint tokens)
        vm.prank(address(streamEvents));
        eventTokenManager.mintEventTokens(eventId, totalSupply, tokenUri);
        
        // Check token was minted
        uint256 tokenId = eventTokenManager.getEventTokenId(eventId);
        assertTrue(tokenId > 0);
        assertEq(eventTokenManager.getRemainingTokenSupply(eventId), totalSupply);
        
        // Simulate user registration (transfer token)
        vm.prank(address(streamEvents));
        eventTokenManager.transferRegistrationToken(eventId, user1, 1);
        
        // Check user has token
        assertTrue(eventTokenManager.hasEventTokens(eventId, user1));
        assertEq(eventTokenManager.getEventTokenBalance(eventId, user1), 1);
        
        console.log("SUCCESS: Simulated event flow successful");
    }
    
    function testUpgradeStreamEventsOnly() public {
        console.log("Testing StreamEvents upgrade only...");
        
        // Deploy new StreamEvents implementation
        StreamEventsUpgradeableV2 newStreamEventsImpl = new StreamEventsUpgradeableV2(trustedForwarder);
        
        // Upgrade StreamEvents
        streamEvents.upgradeToAndCall(address(newStreamEventsImpl), "");
        
        // Check upgrade
        assertEq(streamEvents.version(), "2.0.0");
        assertEq(StreamEventsUpgradeableV2(address(streamEvents)).newFeature(), "New feature from V2");
        
        // Check integration still works
        assertEq(address(streamEvents.eventTokenManager()), address(eventTokenManager));
        
        console.log("SUCCESS: StreamEvents upgrade only successful");
    }
    
    function testUpgradeEventTokenManagerOnly() public {
        console.log("Testing EventTokenManager upgrade only...");
        
        // Deploy new EventTokenManager implementation
        EventTokenManagerV2 newTokenManagerImpl = new EventTokenManagerV2();
        
        // Upgrade EventTokenManager
        eventTokenManager.upgradeToAndCall(address(newTokenManagerImpl), "");
        
        // Check upgrade
        assertEq(EventTokenManagerV2(address(eventTokenManager)).newTokenFeature(), "New token feature from V2");
        
        // Check integration still works
        assertEq(address(streamEvents.eventTokenManager()), address(eventTokenManager));
        
        console.log("SUCCESS: EventTokenManager upgrade only successful");
    }
    
    function testUpgradeBothContracts() public {
        console.log("Testing both contracts upgrade...");
        
        // Deploy new implementations
        StreamEventsUpgradeableV2 newStreamEventsImpl = new StreamEventsUpgradeableV2(trustedForwarder);
        EventTokenManagerV2 newTokenManagerImpl = new EventTokenManagerV2();
        
        // Upgrade both contracts
        streamEvents.upgradeToAndCall(address(newStreamEventsImpl), "");
        eventTokenManager.upgradeToAndCall(address(newTokenManagerImpl), "");
        
        // Check both upgrades
        assertEq(streamEvents.version(), "2.0.0");
        assertEq(EventTokenManagerV2(address(eventTokenManager)).newTokenFeature(), "New token feature from V2");
        
        // Check integration still works
        assertEq(address(streamEvents.eventTokenManager()), address(eventTokenManager));
        
        console.log("SUCCESS: Both contracts upgrade successful");
    }
    
    function testDataPreservationAfterBothUpgrades() public {
        console.log("Testing data preservation after both upgrades...");
        
        uint256 eventId = 1;
        uint256 totalSupply = 100;
        string memory tokenUri = "https://api.stream-events.com/metadata/1.json";
        
        // Set up data before upgrades
        vm.prank(address(streamEvents));
        eventTokenManager.mintEventTokens(eventId, totalSupply, tokenUri);
        
        vm.prank(address(streamEvents));
        eventTokenManager.transferRegistrationToken(eventId, user1, 5);
        
        // Upgrade both contracts
        StreamEventsUpgradeableV2 newStreamEventsImpl = new StreamEventsUpgradeableV2(trustedForwarder);
        EventTokenManagerV2 newTokenManagerImpl = new EventTokenManagerV2();
        
        streamEvents.upgradeToAndCall(address(newStreamEventsImpl), "");
        eventTokenManager.upgradeToAndCall(address(newTokenManagerImpl), "");
        
        // Check data is preserved
        assertEq(eventTokenManager.getEventTokenBalance(eventId, user1), 5);
        assertEq(eventTokenManager.getRemainingTokenSupply(eventId), totalSupply - 5);
        assertEq(streamEvents.owner(), owner);
        assertEq(eventTokenManager.owner(), owner);
        
        console.log("SUCCESS: Data preservation after both upgrades successful");
    }
    
    function testIntegrationAfterUpgrades() public {
        console.log("Testing integration after upgrades...");
        
        // Upgrade both contracts
        StreamEventsUpgradeableV2 newStreamEventsImpl = new StreamEventsUpgradeableV2(trustedForwarder);
        EventTokenManagerV2 newTokenManagerImpl = new EventTokenManagerV2();
        
        streamEvents.upgradeToAndCall(address(newStreamEventsImpl), "");
        eventTokenManager.upgradeToAndCall(address(newTokenManagerImpl), "");
        
        // Test integration still works
        uint256 eventId = 1;
        uint256 totalSupply = 100;
        string memory tokenUri = "https://api.stream-events.com/metadata/1.json";
        
        // Mint tokens
        vm.prank(address(streamEvents));
        eventTokenManager.mintEventTokens(eventId, totalSupply, tokenUri);
        
        // Transfer tokens
        vm.prank(address(streamEvents));
        eventTokenManager.transferRegistrationToken(eventId, user1, 1);
        
        // Check everything works
        assertTrue(eventTokenManager.hasEventTokens(eventId, user1));
        assertEq(eventTokenManager.getEventTokenBalance(eventId, user1), 1);
        
        console.log("SUCCESS: Integration after upgrades successful");
    }
    
    function testUpgradeWithNewFeatures() public {
        console.log("Testing upgrade with new features...");
        
        // Upgrade both contracts
        StreamEventsUpgradeableV2 newStreamEventsImpl = new StreamEventsUpgradeableV2(trustedForwarder);
        EventTokenManagerV2 newTokenManagerImpl = new EventTokenManagerV2();
        
        streamEvents.upgradeToAndCall(address(newStreamEventsImpl), "");
        eventTokenManager.upgradeToAndCall(address(newTokenManagerImpl), "");
        
        // Test new features
        assertEq(StreamEventsUpgradeableV2(address(streamEvents)).newFeature(), "New feature from V2");
        assertEq(EventTokenManagerV2(address(eventTokenManager)).newTokenFeature(), "New token feature from V2");
        
        // Test that old features still work
        assertEq(streamEvents.version(), "2.0.0");
        assertEq(streamEvents.owner(), owner);
        
        console.log("SUCCESS: Upgrade with new features successful");
    }
    
    function testUpgradeAuthorization() public {
        console.log("Testing upgrade authorization...");
        
        // Deploy new implementations
        StreamEventsUpgradeableV2 newStreamEventsImpl = new StreamEventsUpgradeableV2(trustedForwarder);
        EventTokenManagerV2 newTokenManagerImpl = new EventTokenManagerV2();
        
        // Try to upgrade as non-owner (should fail)
        vm.prank(user1);
        vm.expectRevert();
        streamEvents.upgradeToAndCall(address(newStreamEventsImpl), "");
        
        vm.prank(user1);
        vm.expectRevert();
        eventTokenManager.upgradeToAndCall(address(newTokenManagerImpl), "");
        
        // Upgrade as owner (should succeed)
        streamEvents.upgradeToAndCall(address(newStreamEventsImpl), "");
        eventTokenManager.upgradeToAndCall(address(newTokenManagerImpl), "");
        
        console.log("SUCCESS: Upgrade authorization test successful");
    }
    
    function testUpgradeEvents() public {
        console.log("Testing upgrade events...");
        
        // Deploy new implementations
        StreamEventsUpgradeableV2 newStreamEventsImpl = new StreamEventsUpgradeableV2(trustedForwarder);
        EventTokenManagerV2 newTokenManagerImpl = new EventTokenManagerV2();
        
        // Expect upgrade events
        vm.expectEmit(true, true, true, true);
        emit StreamEventsUpgradeable.ContractUpgraded(address(streamEvents), address(newStreamEventsImpl));
        
        // Perform upgrades
        streamEvents.upgradeToAndCall(address(newStreamEventsImpl), "");
        eventTokenManager.upgradeToAndCall(address(newTokenManagerImpl), "");
        
        console.log("SUCCESS: Upgrade events test successful");
    }
}

// Test implementation V2 for StreamEventsUpgradeable
contract StreamEventsUpgradeableV2 is StreamEventsUpgradeable {
    string public newFeatureValue;
    
    constructor(address trustedForwarder_) StreamEventsUpgradeable(trustedForwarder_) {
        _disableInitializers();
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
    
    function newTokenFeature() public pure returns (string memory) {
        return "New token feature from V2";
    }
}
