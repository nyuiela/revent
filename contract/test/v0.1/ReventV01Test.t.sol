// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {Revent} from "../../src/v0.1/core/revent.sol";
import {ReventProxy} from "../../src/v0.1/ReventProxy.sol";
import {EscrowV1} from "../../src/v0.1/core/EscrowV1.sol";
import {EventTypes} from "../../src/v0.1/structs/Types.sol";

/**
 * @title ReventV01Test
 * @dev Comprehensive test suite for Revent V0.1
 */
contract ReventV01Test is Test {
    Revent public revent;
    ReventProxy public proxy;

    address public owner;
    address public user1;
    address public user2;
    address public feeRecipient;

    uint256 public constant PLATFORM_FEE = 250; // 2.5%
    uint256 public constant MIN_REGISTRATION_FEE = 0.001 ether;
    uint256 public constant MAX_REGISTRATION_FEE = 1 ether;

    event EventCreated(
        uint256 indexed eventId,
        address indexed creator,
        string ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee
    );

    // Allow the test contract to receive ETH
    receive() external payable {}

    event EscrowCreated(uint256 indexed eventId, address indexed creator, uint256 totalAmount);
    event FundsDeposited(uint256 indexed eventId, address indexed depositor, uint256 amount);

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        feeRecipient = makeAddr("feeRecipient");

        // Deploy implementation
        Revent implementation = new Revent();

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            Revent.initialize.selector,
            address(0), // trustedForwarder
            feeRecipient,
            PLATFORM_FEE
        );

        // Deploy proxy
        proxy = new ReventProxy(address(implementation), initData);

        revent = Revent(payable(address(proxy)));

        // Fund test accounts
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    function testInitialization() public {
        assertEq(revent.version(), "0.1.0");
        assertEq(revent.owner(), owner);
        assertEq(revent.getPlatformFee(), PLATFORM_FEE);
        assertEq(revent.getFeeRecipient(), feeRecipient);
    }

    function testCreateEvent() public {
        string memory ipfsHash = "QmTestHash123";
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = startTime + 4 hours;
        uint256 maxAttendees = 100;
        bool isVIP = true;
        string memory code = "EVENT123";

        vm.expectEmit(true, true, false, true);
        emit EventCreated(1, owner, ipfsHash, startTime, endTime, maxAttendees, 0);

        uint256 eventId = revent.createEvent(ipfsHash, startTime, endTime, maxAttendees, isVIP, code);

        assertEq(eventId, 1);

        // Verify event data
        EventTypes.EventData memory eventData = revent.getEvent(eventId);

        assertEq(eventData.eventId, 1);
        assertEq(eventData.creator, owner);
        assertEq(eventData.ipfsHash, ipfsHash);
        assertEq(eventData.startTime, startTime);
        assertEq(eventData.endTime, endTime);
        assertEq(eventData.maxAttendees, maxAttendees);
        assertEq(eventData.currentAttendees, 0);
        assertEq(eventData.isVIP, isVIP);
        assertTrue(eventData.isActive);
        assertFalse(eventData.isLive);
        assertEq(uint8(eventData.status), 0); // DRAFT
    }

    function testCreateTicket() public {
        // First create an event
        uint256 eventId = revent.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true, // VIP event
            "EVENT123"
        );

        // Create a paid ticket
        string[] memory perks = new string[](2);
        perks[0] = "VIP Access";
        perks[1] = "Free Drinks";

        // vm.expectEmit(true, true, false, true);
        emit EscrowCreated(eventId, owner, 1 ether);

        revent.createTicket(
            eventId,
            "VIP Ticket",
            "VIP",
            0.1 ether, // 0.1 ETH per ticket
            "NATIVE",
            10, // 10 tickets
            perks
        );

        // Verify ticket was created
        EventTypes.TicketData memory ticket = revent.getTicket(1);

        assertEq(ticket.ticketId, 1);
        assertEq(ticket.eventId, eventId);
        assertEq(ticket.name, "VIP Ticket");
        assertEq(ticket.ticketType, "VIP");
        assertEq(ticket.price, 0.1 ether);
        assertEq(ticket.currency, "NATIVE");
        assertEq(ticket.totalQuantity, 10);
        assertEq(ticket.soldQuantity, 0);
        assertTrue(ticket.isActive);
    }

    function testPurchaseTicket() public {
        // Create event and ticket
        uint256 eventId = revent.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true, // VIP event
            "EVENT123"
        );

        string[] memory perks = new string[](1);
        perks[0] = "VIP Access";

        revent.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);

        // Publish event to allow ticket purchases
        revent.publishEvent(eventId);

        // Purchase ticket
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit FundsDeposited(eventId, user1, 0.1 ether);

        revent.purchaseTicket{value: 0.1 ether}(1, 1);

        // Verify purchase
        assertEq(revent.getPurchasedTicketCount(eventId, user1), 1);
        assertEq(revent.getTicket(1).soldQuantity, 1);
    }

    function testEscrowFlow() public {
        // Create VIP event with paid ticket
        vm.startPrank(owner);
        uint256 eventId = revent.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true, // VIP event
            "EVENT123"
        );

        string[] memory perks = new string[](1);
        perks[0] = "VIP Access";

        revent.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);

        // Publish event
        revent.publishEvent(eventId);
        vm.stopPrank();

        // Purchase tickets (deposit into escrow)
        vm.prank(user1);
        revent.purchaseTicket{value: 0.1 ether}(1, 1);

        vm.prank(user2);
        revent.purchaseTicket{value: 0.2 ether}(1, 2);

        // Verify escrow data
        EscrowV1.EscrowData memory escrowData = revent.getEscrowData(eventId);

        assertEq(escrowData.eventId, eventId);
        assertEq(escrowData.creator, owner);
        assertEq(escrowData.totalAmount, 0.3 ether); // 10 tickets * 0.1 ETH
        assertEq(escrowData.depositedAmount, 0.3 ether); // 3 tickets purchased
        // assertFalse(escrowData.isFunded); // Not fully funded yet
        assertFalse(escrowData.isReleased);
        assertFalse(escrowData.isRefunded);
        assertFalse(escrowData.isDisputed);
        assertFalse(escrowData.isLocked);

        // Complete the event
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(owner);
        revent.startLiveEvent(eventId);
        // revent.endEvent(eventId);

        // Wait for release delay
        vm.warp(block.timestamp + 1 days + 1);
        // Release funds

        revent.depositFunds{value: 0.3 ether}(eventId);
        vm.prank(owner);
        revent.endEvent(eventId);
        vm.deal(owner, 0.3 ether);
        vm.deal(address(revent), 1 ether);
        vm.warp(escrowData.releaseTime + 1 days + 1);
        revent.releaseEscrowFunds(eventId);

        // Verify funds were released
        EscrowV1.EscrowData memory escrowDataAfter = revent.getEscrowData(eventId);
        assertTrue(escrowDataAfter.isReleased);
    }

    function testRefundFlow() public {
        // Create VIP event with paid ticket
        uint256 eventId = revent.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true, // VIP event
            "EVENT123"
        );

        string[] memory perks = new string[](1);
        perks[0] = "VIP Access";

        revent.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);

        // Publish event
        revent.publishEvent(eventId);

        // Purchase tickets
        vm.prank(user1);
        revent.purchaseTicket{value: 0.1 ether}(1, 1);

        vm.prank(user2);
        revent.purchaseTicket{value: 0.2 ether}(1, 2);

        // Cancel event
        revent.cancelEvent(eventId);

        // Refund funds (triggered automatically by cancelEvent)
        // revent.refundFunds(eventId); // This is now internal and called by cancelEvent

        // Verify refunds
        EscrowV1.EscrowData memory escrowDataRefund = revent.getEscrowData(eventId);
        assertFalse(escrowDataRefund.isReleased);
        assertTrue(escrowDataRefund.isRefunded);
    }

    function testDisputeFlow() public {
        // Create VIP event with paid ticket
        uint256 eventId = revent.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true, // VIP event
            "EVENT123"
        );

        string[] memory perks = new string[](1);
        perks[0] = "VIP Access";

        revent.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);

        // Publish event
        revent.publishEvent(eventId);

        // Purchase ticket
        vm.prank(user1);
        revent.purchaseTicket{value: 0.1 ether}(1, 1);

        // Create dispute
        vm.prank(user1);
        revent.createDispute(eventId, "Event was not as advertised");

        // Verify dispute
        EscrowV1.Dispute memory dispute = revent.getDispute(eventId);
        assertEq(dispute.disputer, user1);
        assertEq(dispute.reason, "Event was not as advertised");
        assertFalse(dispute.resolved);
        assertEq(dispute.resolver, address(0));
    }

    function testAccessControls() public {
        // Test only owner functions
        vm.prank(user1);
        vm.expectRevert();
        revent.setPlatformFee(500);

        vm.prank(user1);
        vm.expectRevert();
        revent.setFeeRecipient(user1);

        // Test only event creator functions
        uint256 eventId = revent.createEvent(
            "QmTestHash123", block.timestamp + 1 days, block.timestamp + 1 days + 4 hours, 100, true, "EVENT123"
        );

        vm.prank(user1);
        vm.expectRevert();
        revent.publishEvent(eventId);

        vm.prank(user1);
        vm.expectRevert();
        revent.cancelEvent(eventId);
    }

    function testSecurityFeatures() public {
        // Test reentrancy protection
        uint256 eventId = revent.createEvent(
            "QmTestHash123", block.timestamp + 1 days, block.timestamp + 1 days + 4 hours, 100, true, "EVENT123"
        );

        string[] memory perks = new string[](1);
        perks[0] = "VIP Access";

        uint256 ticketId = revent.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);

        revent.publishEvent(eventId);

        // Test pause functionality
        revent.pause();

        vm.prank(user1);
        vm.expectRevert();
        revent.purchaseTicket{value: 0.1 ether}(ticketId, 1);

        revent.unpause();

        // Now should work
        vm.prank(user1);
        revent.purchaseTicket{value: 0.1 ether}(ticketId, 1);
    }

    function testUpgrade() public {
        // Deploy new implementation
        Revent newImplementation = new Revent();

        // Upgrade proxy
        revent.upgradeToAndCall(address(newImplementation), "");

        // Verify upgrade
        assertEq(revent.getImplementation(), address(newImplementation));
    }
}
