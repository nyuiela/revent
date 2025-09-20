// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {ReventFactoryV1} from "../../src/v1/core/ReventFactoryV1.sol";
import {ReventProxy} from "../../src/v0.1/ReventProxy.sol";
import {EscrowV1} from "../../src/v1/core/EscrowV1.sol";
import {EventTypes} from "../../src/v0.1/structs/Types.sol";

/**
 * @title ReventV1Test
 * @dev Test suite for Revent V1 modular architecture
 */
contract ReventV1Test is Test {
    ReventFactoryV1 public factory;
    ReventProxy public proxy;
    
    address public owner;
    address public user1;
    address public user2;
    address public feeRecipient;
    
    uint256 public constant PLATFORM_FEE = 250; // 2.5%
    
    // Allow the test contract to receive ETH
    receive() external payable {}
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        feeRecipient = makeAddr("feeRecipient");
        
        // Deploy implementation
        ReventFactoryV1 implementation = new ReventFactoryV1();
        
        // Prepare initialization data
        address trustedForwarder = address(0);
        bytes memory initData = abi.encodeWithSelector(
            ReventFactoryV1.initialize.selector,
            trustedForwarder,
            feeRecipient,
            PLATFORM_FEE
        );
        
        // Deploy proxy
        proxy = new ReventProxy(address(implementation), initData);
        
        factory = ReventFactoryV1(payable(address(proxy)));
        
        // Fund test users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }
    
    function testInitialization() public view {
        assertEq(factory.version(), "1.0.0");
        assertEq(factory.owner(), owner);
        assertEq(factory.platformFee(), PLATFORM_FEE);
        assertEq(factory.feeRecipient(), feeRecipient);
        assertTrue(address(factory.eventsModule()) != address(0));
        assertTrue(address(factory.ticketsModule()) != address(0));
        assertTrue(address(factory.escrowModule()) != address(0));
    }
    
    function testCreateEvent() public {
        string memory ipfsHash = "QmTestHash123";
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 1 days + 4 hours;
        uint256 maxAttendees = 100;
        bool isVIP = true;
        bytes memory data = "EVENT123";
        
        uint256 eventId = factory.createEvent(ipfsHash, startTime, endTime, maxAttendees, isVIP, data);
        
        assertEq(eventId, 1);
        
        // Verify event data
        EventTypes.EventData memory eventData = factory.getEvent(eventId);
        assertEq(eventData.eventId, 1);
        assertEq(eventData.creator, owner);
        assertEq(eventData.ipfsHash, ipfsHash);
        assertEq(eventData.startTime, startTime);
        assertEq(eventData.endTime, endTime);
        assertEq(eventData.maxAttendees, maxAttendees);
        assertEq(eventData.isVIP, isVIP);
        assertEq(uint256(eventData.status), uint256(EventTypes.EventStatus.DRAFT));
    }
    
    function testCreateTicket() public {
        // Create event first
        uint256 eventId = factory.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            "EVENT123"
        );
        
        string[] memory perks = new string[](2);
        perks[0] = "VIP Access";
        perks[1] = "Free Drinks";
        
        uint256 ticketId = factory.createTicket(
            eventId,
            "VIP Ticket",
            "VIP",
            0.1 ether,
            "NATIVE",
            10,
            perks
        );
        
        assertEq(ticketId, 1);
        
        // Verify ticket data
        EventTypes.TicketData memory ticket = factory.getTicket(ticketId);
        assertEq(ticket.ticketId, 1);
        assertEq(ticket.eventId, eventId);
        assertEq(ticket.name, "VIP Ticket");
        assertEq(ticket.ticketType, "VIP");
        assertEq(ticket.price, 0.1 ether);
        assertEq(ticket.currency, "NATIVE");
        assertEq(ticket.totalQuantity, 10);
        assertEq(ticket.soldQuantity, 0);
        assertEq(ticket.perks.length, 2);
        assertEq(ticket.perks[0], "VIP Access");
        assertEq(ticket.perks[1], "Free Drinks");
        assertTrue(ticket.isActive);
    }
    
    function testEventLifecycle() public {
        // Create event
        uint256 eventId = factory.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            "EVENT123"
        );
        
        // Test publish event
        factory.publishEvent(eventId);
        EventTypes.EventData memory eventData = factory.getEvent(eventId);
        assertEq(uint256(eventData.status), uint256(EventTypes.EventStatus.PUBLISHED));
        
        // Test start live event
        vm.warp(block.timestamp + 1 days);
        factory.startLiveEvent(eventId);
        eventData = factory.getEvent(eventId);
        assertEq(uint256(eventData.status), uint256(EventTypes.EventStatus.LIVE));
        
        // Test end event
        vm.warp(block.timestamp + 4 hours);
        factory.endEvent(eventId);
        eventData = factory.getEvent(eventId);
        assertEq(uint256(eventData.status), uint256(EventTypes.EventStatus.COMPLETED));
    }
    
    function testTicketPurchase() public {
        // Create event and ticket
        uint256 eventId = factory.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            "EVENT123"
        );
        
        string[] memory perks = new string[](1);
        perks[0] = "VIP Access";
        
        factory.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);
        factory.publishEvent(eventId);
        
        // Purchase ticket
        vm.prank(user1);
        factory.purchaseTicket{value: 0.1 ether}(1, 1);
        
        // Verify purchase
        uint256 purchasedCount = factory.getPurchasedTicketCount(eventId, user1);
        assertEq(purchasedCount, 1);
        
        EventTypes.TicketData memory ticket = factory.getTicket(1);
        assertEq(ticket.soldQuantity, 1);
    }
    
    function testEscrowFlow() public {
        // Create VIP event with paid ticket
        uint256 eventId = factory.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            "EVENT123"
        );
        
        string[] memory perks = new string[](1);
        perks[0] = "VIP Access";
        
        factory.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);
        factory.publishEvent(eventId);
        
        // Purchase tickets
        vm.prank(user1);
        factory.purchaseTicket{value: 0.1 ether}(1, 1);
        
        vm.prank(user2);
        factory.purchaseTicket{value: 0.2 ether}(1, 2);
        
        // Verify escrow data
        EscrowV1.EscrowData memory escrowData = factory.getEscrowData(eventId);
        assertEq(escrowData.eventId, eventId);
        assertEq(escrowData.creator, owner);
        assertEq(escrowData.totalAmount, 1 ether); // 10 tickets * 0.1 ether
        assertEq(escrowData.depositedAmount, 0.3 ether); // 0.1 + 0.2 ether
        assertFalse(escrowData.isFunded); // Not fully funded yet
        
        // Complete the event lifecycle
        vm.warp(block.timestamp + 1 days);
        factory.startLiveEvent(eventId);
        vm.warp(block.timestamp + 4 hours);
        factory.endEvent(eventId);
        
        // Release funds
        vm.warp(escrowData.releaseTime + 1 days);
        factory.releaseEscrowFunds(eventId);
        
        // Verify funds were released
        escrowData = factory.getEscrowData(eventId);
        assertTrue(escrowData.isReleased);
    }
    
    function testPauseUnpause() public {
        // Test pause
        factory.pause();
        assertTrue(factory.paused());
        
        // Test that functions are paused
        vm.expectRevert();
        factory.createEvent("QmTestHash123", block.timestamp + 1 days, block.timestamp + 1 days + 4 hours, 100, true, "EVENT123");
        
        // Test unpause
        factory.unpause();
        assertFalse(factory.paused());
        
        // Test that functions work again
        uint256 eventId = factory.createEvent("QmTestHash123", block.timestamp + 1 days, block.timestamp + 1 days + 4 hours, 100, true, "EVENT123");
        assertEq(eventId, 1);
    }
    
    function testModuleAddresses() public view {
        assertTrue(address(factory.eventsModule()) != address(0));
        assertTrue(address(factory.ticketsModule()) != address(0));
        assertTrue(address(factory.escrowModule()) != address(0));
    }
}
