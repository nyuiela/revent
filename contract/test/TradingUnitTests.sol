// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/event.sol";
import "../src/events/Types.sol";
import "../src/events/Events.sol";

contract TradingUnitTests is Test {
    StreamEvents public streamEvents;
    address public owner = address(0x1);
    address public creator = address(0x2);
    address public investor1 = address(0x3);
    address public investor2 = address(0x4);
    address public buyer = address(0x5);
    address public seller = address(0x6);
    
    uint256 public eventId;
    uint256 public constant TICKET_PRICE = 0.1 ether;
    uint256 public constant INVESTMENT_AMOUNT = 1 ether;
    uint256 public constant DOMAIN_PRICE = 5 ether;
    uint256 public constant SHARE_AMOUNT = 100;
    uint256 public constant SHARE_PRICE = 0.01 ether;

    function setUp() public {
        vm.startPrank(owner);
        streamEvents = new StreamEvents();
        vm.stopPrank();

        // Create an event
        vm.startPrank(creator);
        eventId = streamEvents.createEvent(
            "QmTestEventHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            TICKET_PRICE
        );
        vm.stopPrank();

        // Fund accounts
        vm.deal(investor1, 10 ether);
        vm.deal(investor2, 10 ether);
        vm.deal(buyer, 10 ether);
        vm.deal(seller, 10 ether);
    }

    // ============ DOMAIN TRADING TESTS ============

    function testCreateSellOrder() public {
        vm.startPrank(creator);
        
        // Mock ownership token (simplified for testing)
        // In real implementation, you'd need to set up the ownership token
        
        vm.expectRevert("ownership not set");
        streamEvents.createSellOrder(eventId, 1 ether, 2 ether, address(0), 0);
        
        vm.stopPrank();
    }

    function testCreateBuyOrder() public {
        vm.startPrank(buyer);
        
        streamEvents.createBuyOrder(eventId, 2 ether, address(0), 0);
        
        // Verify order was created
        uint256[] memory orders = streamEvents.getUserOrders(buyer);
        assertEq(orders.length, 1);
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orders[0]);
        assertEq(order.eventId, eventId);
        assertEq(order.creator, buyer);
        assertEq(order.maxPrice, 2 ether);
        assertEq(uint256(order.orderType), uint256(EventTypes.OrderType.BUY));
        assertEq(uint256(order.tradingType), uint256(EventTypes.TradingType.DOMAIN));
        
        vm.stopPrank();
    }

    function testCreateBuyOrderWithETH() public {
        vm.startPrank(buyer);
        
        // Should fail with insufficient ETH
        vm.expectRevert("insufficient ETH");
        streamEvents.createBuyOrder{value: 1 ether}(eventId, 2 ether, address(0), 0);
        
        // Should succeed with sufficient ETH
        streamEvents.createBuyOrder{value: 2 ether}(eventId, 2 ether, address(0), 0);
        
        vm.stopPrank();
    }

    function testUpdateOrder() public {
        vm.startPrank(buyer);
        
        // Create order
        streamEvents.createBuyOrder{value: 2 ether}(eventId, 2 ether, address(0), 0);
        uint256[] memory orders = streamEvents.getUserOrders(buyer);
        uint256 orderId = orders[0];
        
        // Update order
        streamEvents.updateOrder(orderId, 0, 1.5 ether, 0);
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orderId);
        assertEq(order.maxPrice, 1.5 ether);
        
        vm.stopPrank();
    }

    function testCancelOrder() public {
        vm.startPrank(buyer);
        
        // Create order
        streamEvents.createBuyOrder{value: 2 ether}(eventId, 2 ether, address(0), 0);
        uint256[] memory orders = streamEvents.getUserOrders(buyer);
        uint256 orderId = orders[0];
        
        // Cancel order
        streamEvents.cancelOrder(orderId);
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orderId);
        assertEq(uint256(order.status), uint256(EventTypes.OrderStatus.CANCELLED));
        
        // Should refund ETH
        uint256 balanceAfter = buyer.balance;
        assertEq(balanceAfter, 10 ether); // Original balance restored
        
        vm.stopPrank();
    }

    // ============ INVESTOR SHARE TRADING TESTS ============

    function testInitializeDynamicPricing() public {
        vm.startPrank(creator);
        
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        
        // Check pricing info
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            streamEvents.getPricingInfo(eventId);
        
        assertEq(basePrice, 0.001 ether);
        assertEq(currentMultiplier, 10000); // 1.0x
        assertEq(currentPrice, 0.001 ether);
        
        vm.stopPrank();
    }

    function testCreateInvestorShareSellOrder() public {
        // First initialize pricing
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        // Mock investor having shares
        // In real implementation, investor would have shares from investment
        
        vm.startPrank(investor1);
        
        // Should fail without shares
        vm.expectRevert("insufficient shares");
        streamEvents.createInvestorShareSellOrder(eventId, SHARE_AMOUNT, SHARE_PRICE, address(0), 0);
        
        vm.stopPrank();
    }

    function testCreateInvestorShareBuyOrder() public {
        // First initialize pricing
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        vm.startPrank(buyer);
        
        // Should fail with price too low
        vm.expectRevert("price too low");
        streamEvents.createInvestorShareBuyOrder(eventId, SHARE_AMOUNT, 0.0005 ether, address(0), 0);
        
        // Should succeed with valid price
        streamEvents.createInvestorShareBuyOrder{value: SHARE_AMOUNT * SHARE_PRICE}(
            eventId, SHARE_AMOUNT, SHARE_PRICE, address(0), 0
        );
        
        vm.stopPrank();
    }

    function testGetCurrentSharePrice() public {
        vm.startPrank(creator);
        
        // Before initialization
        uint256 price = streamEvents.getCurrentSharePrice(eventId);
        assertEq(price, 0);
        
        // After initialization
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        price = streamEvents.getCurrentSharePrice(eventId);
        assertEq(price, 0.001 ether);
        
        vm.stopPrank();
    }

    function testUpdateEventTotalValue() public {
        vm.startPrank(creator);
        
        // Initialize pricing
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        
        // Update total value
        streamEvents.updateEventTotalValue(eventId, 10 ether);
        
        // Check pricing info
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            streamEvents.getPricingInfo(eventId);
        
        assertEq(totalValue, 10 ether);
        assertTrue(currentPrice > basePrice); // Price should have increased
        
        vm.stopPrank();
    }

    // ============ INVESTOR PROTECTION TESTS ============

    function testSetInvestorApprovalRequired() public {
        vm.startPrank(creator);
        
        streamEvents.setInvestorApprovalRequired(eventId, true, 5000); // 50% threshold
        
        // Check approval status
        bool isMet = streamEvents.isInvestorApprovalMet(eventId);
        assertTrue(isMet); // Should be met when no investors
        
        vm.stopPrank();
    }

    function testGiveInvestorApproval() public {
        vm.startPrank(creator);
        streamEvents.setInvestorApprovalRequired(eventId, true, 5000);
        vm.stopPrank();
        
        // Mock investor having shares
        // In real implementation, investor would have shares from investment
        
        vm.startPrank(investor1);
        
        // Should fail without shares
        vm.expectRevert("not an investor");
        streamEvents.giveInvestorApproval(eventId, true);
        
        vm.stopPrank();
    }

    // ============ VIEW FUNCTION TESTS ============

    function testGetEventOrders() public {
        vm.startPrank(buyer);
        
        // Create multiple orders
        streamEvents.createBuyOrder{value: 2 ether}(eventId, 2 ether, address(0), 0);
        streamEvents.createBuyOrder{value: 1.5 ether}(eventId, 1.5 ether, address(0), 0);
        
        uint256[] memory orders = streamEvents.getEventOrders(eventId);
        assertEq(orders.length, 2);
        
        vm.stopPrank();
    }

    function testGetActiveBuyOrders() public {
        vm.startPrank(buyer);
        
        streamEvents.createBuyOrder{value: 2 ether}(eventId, 2 ether, address(0), 0);
        
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        assertEq(buyOrders.length, 1);
        
        vm.stopPrank();
    }

    function testGetActiveSellOrders() public {
        // This would require setting up ownership token
        // For now, just test the function exists
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        assertEq(sellOrders.length, 0);
    }

    function testGetUserOrders() public {
        vm.startPrank(buyer);
        
        streamEvents.createBuyOrder{value: 2 ether}(eventId, 2 ether, address(0), 0);
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer);
        assertEq(orders.length, 1);
        
        vm.stopPrank();
    }

    function testGetEventMarketPrice() public {
        uint256 price = streamEvents.getEventMarketPrice(eventId);
        assertEq(price, 0); // No trades yet
    }

    function testGetInvestorShareBalance() public {
        uint256 balance = streamEvents.getInvestorShareBalance(eventId, investor1);
        assertEq(balance, 0); // No investment yet
    }

    function testGetTotalInvested() public {
        uint256 total = streamEvents.getTotalInvested(eventId);
        assertEq(total, 0); // No investment yet
    }

    function testGetEventInvestors() public {
        address[] memory investors = streamEvents.getEventInvestors(eventId);
        assertEq(investors.length, 0); // No investors yet
    }

    function testIsInvestor() public {
        bool isInvestor = streamEvents.isInvestor(eventId, investor1);
        assertFalse(isInvestor); // Not an investor yet
    }

    // ============ EDGE CASES AND ERROR TESTS ============

    function testCreateOrderWithInvalidPriceRange() public {
        vm.startPrank(buyer);
        
        // Min price > max price should fail
        vm.expectRevert("invalid price range");
        streamEvents.createBuyOrder{value: 2 ether}(eventId, 1 ether, address(0), 0);
        
        vm.stopPrank();
    }

    function testCreateOrderWithExpiredTime() public {
        vm.startPrank(buyer);
        
        // Expiration time in the past should fail
        vm.expectRevert("invalid expiration");
        streamEvents.createBuyOrder{value: 2 ether}(eventId, 2 ether, address(0), block.timestamp - 1);
        
        vm.stopPrank();
    }

    function testUpdateNonExistentOrder() public {
        vm.startPrank(buyer);
        
        // Update non-existent order should fail
        vm.expectRevert();
        streamEvents.updateOrder(999, 0, 1 ether, 0);
        
        vm.stopPrank();
    }

    function testCancelNonExistentOrder() public {
        vm.startPrank(buyer);
        
        // Cancel non-existent order should fail
        vm.expectRevert();
        streamEvents.cancelOrder(999);
        
        vm.stopPrank();
    }

    function testUnauthorizedOrderUpdate() public {
        vm.startPrank(buyer);
        streamEvents.createBuyOrder{value: 2 ether}(eventId, 2 ether, address(0), 0);
        uint256[] memory orders = streamEvents.getUserOrders(buyer);
        uint256 orderId = orders[0];
        vm.stopPrank();
        
        // Try to update someone else's order
        vm.startPrank(seller);
        vm.expectRevert("not order creator");
        streamEvents.updateOrder(orderId, 0, 1 ether, 0);
        vm.stopPrank();
    }

    function testUnauthorizedOrderCancel() public {
        vm.startPrank(buyer);
        streamEvents.createBuyOrder{value: 2 ether}(eventId, 2 ether, address(0), 0);
        uint256[] memory orders = streamEvents.getUserOrders(buyer);
        uint256 orderId = orders[0];
        vm.stopPrank();
        
        // Try to cancel someone else's order
        vm.startPrank(seller);
        vm.expectRevert("not order creator");
        streamEvents.cancelOrder(orderId);
        vm.stopPrank();
    }
}
