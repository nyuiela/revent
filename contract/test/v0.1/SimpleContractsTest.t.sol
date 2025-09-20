// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {EventsV1} from "../../src/v0.1/core/EventsV1.sol";
import {TicketsV1} from "../../src/v0.1/core/TicketsV1.sol";
import {EscrowV1} from "../../src/v0.1/core/EscrowV1.sol";
import {EventTypes} from "../../src/v0.1/structs/Types.sol";
import {IEscrowV1} from "../../src/v0.1/interfaces/IEscrowV1.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title SimpleContractsTest
 * @dev Test suite for simple contract deployment (no proxies)
 */
contract SimpleContractsTest is Test, IERC1155Receiver {
    EventsV1 public events;
    TicketsV1 public tickets;
    EscrowV1 public escrow;

    address public owner;
    address public user1;
    address public user2;

    // Allow the test contract to receive ETH
    receive() external payable {}

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy contracts directly
        events = new EventsV1();
        tickets = new TicketsV1();
        escrow = new EscrowV1();

        events.initialize("hash");
        escrow.initialize();
        tickets.initialize("hash");

        events.setEscrow(address(escrow));

        // Set up cross-references
        tickets.setContractAddresses(address(events), address(escrow));
        escrow.setContractAddresses(address(events), address(tickets));

        // Fund test users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    function testInitialization() public view {
        assertEq(events.version(), "1.0.0");
        assertEq(tickets.version(), "1.0.0");
        assertEq(escrow.version(), "1.0.0");
        assertEq(events.owner(), owner);
        assertEq(tickets.owner(), owner);
        assertEq(escrow.owner(), owner);
    }

    function testCreateEvent() public {
        string memory ipfsHash = "QmTestHash123";
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 1 days + 4 hours;
        uint256 maxAttendees = 100;
        bool isVIP = true;
        bytes memory data = "EVENT123";

        uint256 eventId = events.createEvent(ipfsHash, startTime, endTime, maxAttendees, isVIP, data, "EVENT123");

        assertEq(eventId, 1);

        // Verify event data
        EventTypes.EventData memory eventData = events.getEvent(eventId);
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
        uint256 eventId = events.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            bytes("EVENT123"),
            "EVENT123"
        );

        string[] memory perks = new string[](2);
        perks[0] = "VIP Access";
        perks[1] = "Free Drinks";

        uint256 ticketId = tickets.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);

        assertEq(ticketId, 1);

        // Verify ticket data
        EventTypes.TicketData memory ticket = tickets.getTicket(ticketId);
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
        uint256 eventId = events.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            bytes("EVENT123"),
            "EVENT123"
        );

        // Test publish event
        events.publishEvent(eventId);
        EventTypes.EventData memory eventData = events.getEvent(eventId);
        assertEq(uint256(eventData.status), uint256(EventTypes.EventStatus.PUBLISHED));

        // Test start live event
        vm.warp(block.timestamp + 1 days);
        events.startLiveEvent(eventId);
        eventData = events.getEvent(eventId);
        assertEq(uint256(eventData.status), uint256(EventTypes.EventStatus.LIVE));

        // Test end event
        vm.warp(block.timestamp + 4 hours);
        events.endEvent(eventId);
        eventData = events.getEvent(eventId);
        assertEq(uint256(eventData.status), uint256(EventTypes.EventStatus.COMPLETED));
    }

    function testAttendeeRegistration() public {
        // Create and publish event
        uint256 eventId = events.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            bytes("EVENT123"),
            "EVENT123"
        );
        events.publishEvent(eventId);

        // Register for event
        vm.prank(user1);
        events.registerForEvent(eventId, "");

        // Verify registration
        EventTypes.AttendeeData memory attendee = events.getAttendee(eventId, user1);
        assertEq(attendee.attendeeAddress, user1);
        assertEq(attendee.eventId, eventId);
        assertFalse(attendee.isConfirmed);
        assertFalse(attendee.hasAttended);
        assertTrue(attendee.registeredAt > 0);

        // Verify attendee count
        assertEq(events.getAttendeeCount(eventId), 1);
        assertEq(events.getEvent(eventId).currentAttendees, 1);
    }

    function testAttendeeConfirmation() public {
        // Create and publish event
        uint256 eventId = events.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            bytes("EVENT123"),
            "EVENT123"
        );
        events.publishEvent(eventId);
        vm.warp(block.timestamp + 1 days);
        events.startLiveEvent(eventId);

        // Set confirmation code
        events.setConfirmationCode(eventId, "CONFIRM123");

        // Register for event
        vm.prank(user1);
        events.registerForEvent(eventId, "");

        // Confirm attendance
        vm.prank(user1);
        events.confirmAttendance(eventId, "CONFIRM123");

        // Verify confirmation
        EventTypes.AttendeeData memory attendee = events.getAttendee(eventId, user1);
        assertTrue(attendee.isConfirmed);
        assertTrue(attendee.hasAttended);
        assertTrue(attendee.confirmedAt > 0);
    }

    function testTicketPurchase() public {
        // Create event and ticket
        uint256 eventId = events.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            bytes("EVENT123"),
            "EVENT123"
        );

        string[] memory perks = new string[](1);
        perks[0] = "VIP Access";

        tickets.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);
        events.publishEvent(eventId);
        escrow.createEscrow(eventId);

        // Purchase ticket
        vm.prank(user1);
        tickets.purchaseTicket{value: 0.1 ether}(1, 1);

        // Verify purchase
        uint256 purchasedCount = tickets.getPurchasedTicketCount(eventId, user1);
        assertEq(purchasedCount, 1);

        EventTypes.TicketData memory ticket = tickets.getTicket(1);
        assertEq(ticket.soldQuantity, 1);
    }

    function testEscrowFlow() public {
        // Create VIP event with paid ticket
        uint256 eventId = events.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            bytes("EVENT123"),
            "EVENT123"
        );
        escrow.createEscrow(eventId);

        string[] memory perks = new string[](1);
        perks[0] = "VIP Access";

        tickets.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);
        events.publishEvent(eventId);

        // Purchase tickets
        vm.prank(user1);
        tickets.purchaseTicket{value: 0.1 ether}(1, 1);

        vm.prank(user2);
        tickets.purchaseTicket{value: 0.2 ether}(1, 2);

        // Verify escrow data
        IEscrowV1.EscrowData memory escrowData = escrow.getEscrowData(eventId);
        assertEq(escrowData.eventId, eventId);
        assertEq(escrowData.creator, owner);
        // assertEq(escrowData.totalAmount, 0.3 ether); // 10 tickets * 0.1 ether
        assertEq(escrowData.depositedAmount, 0.3 ether); // 0.1 + 0.2 ether
        assertTrue(escrowData.isFunded); // Not fully funded yet

        // Complete the event lifecycle
        vm.warp(block.timestamp + 1 days + 1);
        events.startLiveEvent(eventId);
        vm.warp(block.timestamp + 4 hours);
        events.endEvent(eventId);

        // Release funds
        vm.warp(escrowData.releaseTime + 1 days);
        escrow.releaseFunds(eventId);

        // Verify funds were released
        escrowData = escrow.getEscrowData(eventId);
        assertTrue(escrowData.isReleased);
    }

    function testPauseUnpause() public {
        // Test pause
        events.pause();
        tickets.pause();
        escrow.pause();

        assertTrue(events.paused());
        assertTrue(tickets.paused());
        assertTrue(escrow.paused());

        // Test that functions are paused
        vm.expectRevert();
        events.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            bytes("EVENT123"),
            "EVENT123"
        );

        // Test unpause
        events.unpause();
        tickets.unpause();
        escrow.unpause();

        assertFalse(events.paused());
        assertFalse(tickets.paused());
        assertFalse(escrow.paused());

        // Test that functions work again
        uint256 eventId = events.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            bytes("EVENT123"),
            "EVENT123"
        );
        assertEq(eventId, 1);
    }
    // ERC1155 Receiver Implementation

    function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes calldata data)
        external
        returns (bytes4)
    {
        // Return the function selector to indicate successful receipt
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4) {
        // Return the function selector to indicate successful receipt
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}
