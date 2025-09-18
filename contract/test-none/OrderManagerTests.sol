// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/event.sol";
import "../src/events/Types.sol";

contract OrderManagerTests is Test {
    StreamEvents public streamEvents;
    address public owner = address(0x1);
    address public creator = address(0x2);
    address public buyer1 = address(0x3);
    address public buyer2 = address(0x4);
    address public seller1 = address(0x5);
    address public seller2 = address(0x6);
    
    uint256 public eventId;
    uint256 public constant ORDER_PRICE = 1 ether;
    uint256 public constant SHARE_AMOUNT = 100;
    uint256 public constant SHARE_PRICE = 0.01 ether;

    function setUp() public {
        vm.startPrank(owner);
        streamEvents = new StreamEvents();
        vm.stopPrank();

        // Create an event
        vm.startPrank(creator);
        eventId = streamEvents.createEvent(
            "QmOrderTestEventHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            0.1 ether
        );
        vm.stopPrank();

        // Fund accounts
        vm.deal(buyer1, 10 ether);
        vm.deal(buyer2, 10 ether);
        vm.deal(seller1, 10 ether);
        vm.deal(seller2, 10 ether);
    }

    // ============ ORDER CREATION TESTS ============

    function testCreateBuyOrder() public {
        vm.startPrank(buyer1);
        
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        // Verify order was created
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        assertEq(orders.length, 1);
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orders[0]);
        assertEq(order.eventId, eventId);
        assertEq(order.creator, buyer1);
        assertEq(order.maxPrice, ORDER_PRICE);
        assertEq(uint256(order.orderType), uint256(EventTypes.OrderType.BUY));
        assertEq(uint256(order.tradingType), uint256(EventTypes.TradingType.DOMAIN));
        assertEq(uint256(order.status), uint256(EventTypes.OrderStatus.ACTIVE));
        
        vm.stopPrank();
    }

    function testCreateMultipleBuyOrders() public {
        vm.startPrank(buyer1);
        
        // Create multiple orders
        streamEvents.createBuyOrder{value: ORDER_PRICE}(eventId, ORDER_PRICE, address(0), 0);
        streamEvents.createBuyOrder{value: ORDER_PRICE * 2}(eventId, ORDER_PRICE * 2, address(0), 0);
        streamEvents.createBuyOrder{value: ORDER_PRICE * 3}(eventId, ORDER_PRICE * 3, address(0), 0);
        
        // Verify all orders were created
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        assertEq(orders.length, 3);
        
        // Verify active orders
        uint256[] memory activeOrders = streamEvents.getActiveBuyOrders(eventId);
        assertEq(activeOrders.length, 3);
        
        vm.stopPrank();
    }

    function testCreateOrderWithExpiration() public {
        vm.startPrank(buyer1);
        
        uint256 expirationTime = block.timestamp + 1 hours;
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            expirationTime
        );
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(streamEvents.getUserOrders(buyer1)[0]);
        assertEq(order.expirationTime, expirationTime);
        
        vm.stopPrank();
    }

    function testCreateOrderWithDefaultExpiration() public {
        vm.startPrank(buyer1);
        
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0 // 0 means use default
        );
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(streamEvents.getUserOrders(buyer1)[0]);
        assertTrue(order.expirationTime > block.timestamp);
        
        vm.stopPrank();
    }

    // ============ ORDER UPDATE TESTS ============

    function testUpdateOrder() public {
        vm.startPrank(buyer1);
        
        // Create order
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        
        // Update order
        uint256 newMaxPrice = ORDER_PRICE * 2;
        streamEvents.updateOrder(orderId, 0, newMaxPrice, 0);
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orderId);
        assertEq(order.maxPrice, newMaxPrice);
        assertTrue(order.updatedAt > order.createdAt);
        
        vm.stopPrank();
    }

    function testUpdateOrderWithExpiration() public {
        vm.startPrank(buyer1);
        
        // Create order
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        
        // Update with new expiration
        uint256 newExpiration = block.timestamp + 2 hours;
        streamEvents.updateOrder(orderId, 0, ORDER_PRICE, newExpiration);
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orderId);
        assertEq(order.expirationTime, newExpiration);
        
        vm.stopPrank();
    }

    function testUpdateOrderInvalidPriceRange() public {
        vm.startPrank(buyer1);
        
        // Create order
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        
        // Try to update with invalid price range
        vm.expectRevert("invalid price range");
        streamEvents.updateOrder(orderId, ORDER_PRICE * 2, ORDER_PRICE, 0);
        
        vm.stopPrank();
    }

    function testUpdateOrderInvalidExpiration() public {
        vm.startPrank(buyer1);
        
        // Create order
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        
        // Try to update with past expiration
        vm.expectRevert("invalid expiration");
        streamEvents.updateOrder(orderId, 0, ORDER_PRICE, block.timestamp - 1);
        
        vm.stopPrank();
    }

    function testUpdateOrderUnauthorized() public {
        vm.startPrank(buyer1);
        
        // Create order
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        vm.stopPrank();
        
        // Try to update someone else's order
        vm.startPrank(seller1);
        vm.expectRevert("not order creator");
        streamEvents.updateOrder(orderId, 0, ORDER_PRICE * 2, 0);
        vm.stopPrank();
    }

    function testUpdateNonExistentOrder() public {
        vm.startPrank(buyer1);
        
        vm.expectRevert();
        streamEvents.updateOrder(999, 0, ORDER_PRICE, 0);
        
        vm.stopPrank();
    }

    function testUpdateInactiveOrder() public {
        vm.startPrank(buyer1);
        
        // Create order
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        
        // Cancel order
        streamEvents.cancelOrder(orderId);
        
        // Try to update cancelled order
        vm.expectRevert("order not active");
        streamEvents.updateOrder(orderId, 0, ORDER_PRICE * 2, 0);
        
        vm.stopPrank();
    }

    // ============ ORDER CANCELLATION TESTS ============

    function testCancelOrder() public {
        vm.startPrank(buyer1);
        
        // Create order
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        
        // Cancel order
        streamEvents.cancelOrder(orderId);
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orderId);
        assertEq(uint256(order.status), uint256(EventTypes.OrderStatus.CANCELLED));
        
        // Verify order is removed from active orders
        uint256[] memory activeOrders = streamEvents.getActiveBuyOrders(eventId);
        assertEq(activeOrders.length, 0);
        
        vm.stopPrank();
    }

    function testCancelOrderRefund() public {
        vm.startPrank(buyer1);
        
        uint256 initialBalance = buyer1.balance;
        
        // Create order with ETH
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        
        // Cancel order
        streamEvents.cancelOrder(orderId);
        
        // Verify ETH was refunded
        assertEq(buyer1.balance, initialBalance);
        
        vm.stopPrank();
    }

    function testCancelOrderUnauthorized() public {
        vm.startPrank(buyer1);
        
        // Create order
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        vm.stopPrank();
        
        // Try to cancel someone else's order
        vm.startPrank(seller1);
        vm.expectRevert("not order creator");
        streamEvents.cancelOrder(orderId);
        vm.stopPrank();
    }

    function testCancelNonExistentOrder() public {
        vm.startPrank(buyer1);
        
        vm.expectRevert();
        streamEvents.cancelOrder(999);
        
        vm.stopPrank();
    }

    function testCancelInactiveOrder() public {
        vm.startPrank(buyer1);
        
        // Create order
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        
        // Cancel order
        streamEvents.cancelOrder(orderId);
        
        // Try to cancel again
        vm.expectRevert("order not active");
        streamEvents.cancelOrder(orderId);
        
        vm.stopPrank();
    }

    // ============ VIEW FUNCTION TESTS ============

    function testGetOrder() public {
        vm.startPrank(buyer1);
        
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orders[0]);
        
        assertEq(order.orderId, orders[0]);
        assertEq(order.eventId, eventId);
        assertEq(order.creator, buyer1);
        assertEq(order.maxPrice, ORDER_PRICE);
        assertEq(uint256(order.orderType), uint256(EventTypes.OrderType.BUY));
        assertEq(uint256(order.tradingType), uint256(EventTypes.TradingType.DOMAIN));
        assertEq(uint256(order.status), uint256(EventTypes.OrderStatus.ACTIVE));
        
        vm.stopPrank();
    }

    function testGetEventOrders() public {
        vm.startPrank(buyer1);
        streamEvents.createBuyOrder{value: ORDER_PRICE}(eventId, ORDER_PRICE, address(0), 0);
        vm.stopPrank();
        
        vm.startPrank(buyer2);
        streamEvents.createBuyOrder{value: ORDER_PRICE * 2}(eventId, ORDER_PRICE * 2, address(0), 0);
        vm.stopPrank();
        
        uint256[] memory orders = streamEvents.getEventOrders(eventId);
        assertEq(orders.length, 2);
    }

    function testGetUserOrders() public {
        vm.startPrank(buyer1);
        
        streamEvents.createBuyOrder{value: ORDER_PRICE}(eventId, ORDER_PRICE, address(0), 0);
        streamEvents.createBuyOrder{value: ORDER_PRICE * 2}(eventId, ORDER_PRICE * 2, address(0), 0);
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        assertEq(orders.length, 2);
        
        vm.stopPrank();
    }

    function testGetActiveBuyOrders() public {
        vm.startPrank(buyer1);
        streamEvents.createBuyOrder{value: ORDER_PRICE}(eventId, ORDER_PRICE, address(0), 0);
        vm.stopPrank();
        
        vm.startPrank(buyer2);
        streamEvents.createBuyOrder{value: ORDER_PRICE * 2}(eventId, ORDER_PRICE * 2, address(0), 0);
        vm.stopPrank();
        
        uint256[] memory activeOrders = streamEvents.getActiveBuyOrders(eventId);
        assertEq(activeOrders.length, 2);
    }

    function testGetActiveSellOrders() public {
        // This would require setting up ownership token for domain trading
        // For now, just test the function exists
        uint256[] memory activeOrders = streamEvents.getActiveSellOrders(eventId);
        assertEq(activeOrders.length, 0);
    }

    // ============ SHARE TRADING ORDER TESTS ============

    function testCreateInvestorShareBuyOrder() public {
        // 1. Initialize pricing
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        vm.startPrank(buyer1);
        
        streamEvents.createInvestorShareBuyOrder{value: SHARE_AMOUNT * SHARE_PRICE}(
            eventId,
            SHARE_AMOUNT,
            SHARE_PRICE,
            address(0),
            0
        );
        
        // Verify order was created
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        assertEq(orders.length, 1);
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orders[0]);
        assertEq(order.eventId, eventId);
        assertEq(order.creator, buyer1);
        assertEq(order.shareAmount, SHARE_AMOUNT);
        assertEq(order.pricePerShare, SHARE_PRICE);
        assertEq(uint256(order.tradingType), uint256(EventTypes.TradingType.INVESTOR_SHARES));
        
        vm.stopPrank();
    }

    function testCreateInvestorShareSellOrder() public {
        // 1. Initialize pricing
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        // 2. Mock investor having shares
        vm.startPrank(buyer1);
        streamEvents.investInEvent{value: 1 ether}(eventId);
        vm.stopPrank();
        
        vm.startPrank(buyer1);
        
        streamEvents.createInvestorShareSellOrder(
            eventId,
            SHARE_AMOUNT,
            SHARE_PRICE,
            address(0),
            0
        );
        
        // Verify order was created
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        assertEq(orders.length, 1);
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orders[0]);
        assertEq(order.eventId, eventId);
        assertEq(order.creator, buyer1);
        assertEq(order.shareAmount, SHARE_AMOUNT);
        assertEq(order.pricePerShare, SHARE_PRICE);
        assertEq(uint256(order.tradingType), uint256(EventTypes.TradingType.INVESTOR_SHARES));
        
        vm.stopPrank();
    }

    // ============ EDGE CASES ============

    function testOrderExpiration() public {
        vm.startPrank(buyer1);
        
        // Create order with short expiration
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            block.timestamp + 1 seconds
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        
        // Fast forward past expiration
        vm.warp(block.timestamp + 2 seconds);
        
        // Order should still exist but be expired
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orderId);
        assertTrue(block.timestamp > order.expirationTime);
        
        vm.stopPrank();
    }

    function testOrderWithZeroPrice() public {
        vm.startPrank(buyer1);
        
        vm.expectRevert("price too low");
        streamEvents.createBuyOrder{value: 0}(
            eventId,
            0,
            address(0),
            0
        );
        
        vm.stopPrank();
    }

    function testOrderWithVeryHighPrice() public {
        vm.startPrank(buyer1);
        
        uint256 veryHighPrice = 1000 ether;
        vm.expectRevert("price too high");
        streamEvents.createBuyOrder{value: veryHighPrice}(
            eventId,
            veryHighPrice,
            address(0),
            0
        );
        
        vm.stopPrank();
    }

    // ============ GAS OPTIMIZATION TESTS ============

    function testGasUsageForOrderCreation() public {
        vm.startPrank(buyer1);
        
        uint256 gasStart = gasleft();
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        uint256 gasUsed = gasStart - gasleft();
        
        // Order creation should be gas efficient
        assertTrue(gasUsed < 150000); // Should be less than 150k gas
        
        vm.stopPrank();
    }

    function testGasUsageForOrderUpdate() public {
        vm.startPrank(buyer1);
        
        // Create order
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        
        // Measure gas for update
        uint256 gasStart = gasleft();
        streamEvents.updateOrder(orderId, 0, ORDER_PRICE * 2, 0);
        uint256 gasUsed = gasStart - gasleft();
        
        // Order update should be gas efficient
        assertTrue(gasUsed < 50000); // Should be less than 50k gas
        
        vm.stopPrank();
    }

    // ============ STRESS TESTS ============

    function testStressTestManyOrders() public {
        // Create many orders
        for (uint i = 0; i < 10; i++) {
            vm.startPrank(buyer1);
            streamEvents.createBuyOrder{value: ORDER_PRICE}(
                eventId,
                ORDER_PRICE,
                address(0),
                0
            );
            vm.stopPrank();
        }
        
        // Verify all orders were created
        uint256[] memory orders = streamEvents.getEventOrders(eventId);
        assertEq(orders.length, 10);
        
        // Verify active orders
        uint256[] memory activeOrders = streamEvents.getActiveBuyOrders(eventId);
        assertEq(activeOrders.length, 10);
    }

    function testStressTestOrderUpdates() public {
        vm.startPrank(buyer1);
        
        // Create order
        streamEvents.createBuyOrder{value: ORDER_PRICE}(
            eventId,
            ORDER_PRICE,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(buyer1);
        uint256 orderId = orders[0];
        
        // Update order multiple times
        for (uint i = 0; i < 5; i++) {
            streamEvents.updateOrder(orderId, 0, ORDER_PRICE + i, 0);
        }
        
        // Verify final state
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orderId);
        assertEq(order.maxPrice, ORDER_PRICE + 4);
        
        vm.stopPrank();
    }
}
