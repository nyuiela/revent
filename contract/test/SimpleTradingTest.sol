// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/event.sol";
import "../src/events/Types.sol";

contract SimpleTradingTest is Test {
    StreamEvents public streamEvents;
    address public owner = address(0x1);
    address public creator = address(0x2);
    address public investor1 = address(0x3);
    address public trader1 = address(0x4);
    
    uint256 public eventId;
    uint256 public constant TICKET_PRICE = 0.1 ether;
    uint256 public constant INVESTMENT_AMOUNT = 1 ether;

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
        vm.deal(trader1, 10 ether);
    }

    function testBasicTradingFlow() public {
        // 1. Initialize dynamic pricing
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        // 2. Add investor
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 3. Verify investor has shares
        uint256 shareBalance = streamEvents.getInvestorShareBalance(eventId, investor1);
        assertTrue(shareBalance > 0);
        
        // 4. Create share sell order
        vm.startPrank(investor1);
        streamEvents.createInvestorShareSellOrder(
            eventId,
            100,
            0.002 ether,
            address(0),
            0
        );
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        assertEq(sellOrders.length, 1);
        vm.stopPrank();
        
        // 5. Create share buy order
        vm.startPrank(trader1);
        streamEvents.createInvestorShareBuyOrder{value: 100 * 0.002 ether}(
            eventId,
            100,
            0.002 ether,
            address(0),
            0
        );
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        assertEq(buyOrders.length, 1);
        vm.stopPrank();
        
        // 6. Execute trade
        vm.startPrank(trader1);
        streamEvents.executeTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        vm.stopPrank();
        
        // 7. Verify trade execution
        uint256 trader1Shares = streamEvents.getInvestorShareBalance(eventId, trader1);
        assertTrue(trader1Shares > 0);
        
        // 8. Check pricing updates
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(currentPrice > 0.001 ether);
        
        // 9. Check trading volume
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        assertTrue(totalVolume > 0);
        assertTrue(momentum > 0);
    }

    function testOrderManagement() public {
        vm.startPrank(trader1);
        
        // Create buy order
        streamEvents.createBuyOrder{value: 1 ether}(
            eventId,
            1 ether,
            address(0),
            0
        );
        
        uint256[] memory orders = streamEvents.getUserOrders(trader1);
        assertEq(orders.length, 1);
        
        // Update order
        streamEvents.updateOrder(orders[0], 0, 1.5 ether, 0);
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orders[0]);
        assertEq(order.maxPrice, 1.5 ether);
        
        // Cancel order
        streamEvents.cancelOrder(orders[0]);
        
        order = streamEvents.getOrder(orders[0]);
        assertEq(uint256(order.status), uint256(EventTypes.OrderStatus.CANCELLED));
        
        vm.stopPrank();
    }

    function testDynamicPricing() public {
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 5 ether);
        vm.stopPrank();
        
        uint256 price = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(price > 0.001 ether);
        
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            streamEvents.getPricingInfo(eventId);
        
        assertEq(basePrice, 0.001 ether);
        assertTrue(currentMultiplier > 10000);
        assertEq(totalValue, 5 ether);
        assertEq(shareSupply, INVESTMENT_AMOUNT);
    }

    function testInvestorProtection() public {
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        vm.startPrank(creator);
        streamEvents.setInvestorApprovalRequired(eventId, true, 5000);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.giveInvestorApproval(eventId, true);
        vm.stopPrank();
        
        bool isMet = streamEvents.isInvestorApprovalMet(eventId);
        assertTrue(isMet);
    }
}



