// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {EventsV1} from "../../src/v0.1/core/EventsV1.sol";
import {TicketsV1} from "../../src/v0.1/core/TicketsV1.sol";
import {EscrowV1} from "../../src/v0.1/core/EscrowV1.sol";
import {UpgradeableProxy} from "../../src/v0.1/core/UpgradeableProxy.s.sol";
import {EventTypes} from "../../src/v0.1/structs/Types.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title UpgradeableContractsTest
 * @dev Test suite for upgradeable modular contracts
 */
contract UpgradeableContractsTest is Test, IERC1155Receiver {
    EventsV1 public events;
    TicketsV1 public tickets;
    EscrowV1 public escrow;

    UpgradeableProxy public eventsProxy;
    UpgradeableProxy public ticketsProxy;
    UpgradeableProxy public escrowProxy;

    address public owner;
    address public user1;
    address public user2;

    // Allow the test contract to receive ETH
    receive() external payable {}

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy EventsV1 with proxy
        EventsV1 eventsImpl = new EventsV1();
        bytes memory eventsInitData = abi.encodeWithSelector(EventsV1.initialize.selector, "QmTestHash123");
        eventsProxy = new UpgradeableProxy(address(eventsImpl), eventsInitData);
        events = EventsV1(payable(address(eventsProxy)));

        // Deploy TicketsV1 with proxy
        TicketsV1 ticketsImpl = new TicketsV1();
        bytes memory ticketsInitData = abi.encodeWithSelector(TicketsV1.initialize.selector, "QmTestHash123");
        ticketsProxy = new UpgradeableProxy(address(ticketsImpl), ticketsInitData);
        tickets = TicketsV1(payable(address(ticketsProxy)));

        // Deploy EscrowV1 with proxy
        EscrowV1 escrowImpl = new EscrowV1();
        bytes memory escrowInitData = abi.encodeWithSelector(EscrowV1.initialize.selector);
        escrowProxy = new UpgradeableProxy(address(escrowImpl), escrowInitData);
        escrow = EscrowV1(payable(address(escrowProxy)));

        escrowProxy.getAdmin();
        console.log("Escrow admin:", escrowProxy.getAdmin());
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

    function testUpgradeEventsContract() public {
        // Create an event first
        uint256 eventId = events.createEvent(
            "QmTestHash123",
            block.timestamp + 1 days,
            block.timestamp + 1 days + 4 hours,
            100,
            true,
            bytes("EVENT123"),
            "EVENT123"
        );

        // Deploy new EventsV1 implementation
        EventsV1 newEventsImpl = new EventsV1();

        // Upgrade the proxy
        eventsProxy.upgradeTo(address(newEventsImpl));

        // Verify the event still exists after upgrade
        EventTypes.EventData memory eventData = events.getEvent(eventId);
        assertEq(eventData.eventId, 1);
        assertEq(eventData.ipfsHash, "QmTestHash123");

        // Test that new functionality works
        events.publishEvent(eventId);
        eventData = events.getEvent(eventId);
        assertEq(uint256(eventData.status), uint256(EventTypes.EventStatus.PUBLISHED));
    }

    function testUpgradeTicketsContract() public {
        // Create event and ticket first
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
        events.publishEvent(eventId);

        string[] memory perks = new string[](1);
        perks[0] = "VIP Access";

        uint256 ticketId = tickets.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);

        // Deploy new TicketsV1 implementation
        TicketsV1 newTicketsImpl = new TicketsV1();

        // Upgrade the proxy
        ticketsProxy.upgradeTo(address(newTicketsImpl));
        newTicketsImpl.initialize("QmTestHash123");
        newTicketsImpl.setContractAddresses(address(events), address(escrow));

        // Verify the ticket still exists after upgrade
        EventTypes.TicketData memory ticket = tickets.getTicket(ticketId);
        assertEq(ticket.ticketId, 1);
        assertEq(ticket.name, "VIP Ticket");
        assertEq(ticket.price, 0.1 ether);

        // Test that new functionality works
        // events.publishEvent(eventId);
        vm.prank(user1);
        tickets.purchaseTicket{value: 0.1 ether}(ticketId, 1);

        uint256 purchasedCount = tickets.getPurchasedTicketCount(eventId, user1);
        assertEq(purchasedCount, 1);
    }

    function testUpgradeEscrowContract() public {
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
        EscrowV1.EscrowData memory escrowData = escrow.getEscrowData(eventId);

        string[] memory perks = new string[](1);
        perks[0] = "VIP Access";

        tickets.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);
        events.publishEvent(eventId);

        // Purchase tickets
        vm.prank(user1);
        tickets.purchaseTicket{value: 0.1 ether}(1, 1);

        // Deploy new EscrowV1 implementation
        EscrowV1 newEscrowImpl = new EscrowV1();

        // Upgrade the proxy
        escrowProxy.upgradeTo(address(newEscrowImpl));

        // Verify escrow data still exists after upgrade
        escrowData = escrow.getEscrowData(eventId);
        assertEq(escrowData.eventId, eventId);
        assertEq(escrowData.creator, owner);
        assertEq(escrowData.depositedAmount, 0.1 ether);

        // Test that new functionality works
        vm.warp(block.timestamp + 1 days);
        events.startLiveEvent(eventId);
        vm.warp(block.timestamp + 4 hours);
        events.endEvent(eventId);

        vm.warp(escrowData.releaseTime + 1 days);
        escrow.releaseFunds(eventId);

        escrowData = escrow.getEscrowData(eventId);
        assertTrue(escrowData.isReleased);
    }

    function testIndependentUpgrades() public {
        // Create some data
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

        uint256 ticketId = tickets.createTicket(eventId, "VIP Ticket", "VIP", 0.1 ether, "NATIVE", 10, perks);

        // Upgrade only EventsV1
        EventsV1 newEventsImpl = new EventsV1();
        eventsProxy.upgradeTo(address(newEventsImpl));

        // Verify EventsV1 still works
        EventTypes.EventData memory eventData = events.getEvent(eventId);
        assertEq(eventData.eventId, 1);

        // Verify TicketsV1 still works (not upgraded)
        EventTypes.TicketData memory ticket = tickets.getTicket(ticketId);
        assertEq(ticket.ticketId, 1);

        // Upgrade only TicketsV1
        TicketsV1 newTicketsImpl = new TicketsV1();
        ticketsProxy.upgradeTo(address(newTicketsImpl));

        // Verify both still work
        eventData = events.getEvent(eventId);
        assertEq(eventData.eventId, 1);

        ticket = tickets.getTicket(ticketId);
        assertEq(ticket.ticketId, 1);
    }

    function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes calldata data)
        external
        returns (bytes4)
    {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}
