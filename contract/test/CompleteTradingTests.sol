// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/event.sol";
import "../src/events/Types.sol";

contract CompleteTradingTests is Test {
    StreamEvents public streamEvents;
    address public owner = address(0x1);
    address public creator = address(0x2);
    address public investor1 = address(0x3);
    address public investor2 = address(0x4);
    address public trader1 = address(0x5);
    address public trader2 = address(0x6);
    
    uint256 public eventId;
    uint256 public constant TICKET_PRICE = 0.1 ether;
    uint256 public constant INVESTMENT_AMOUNT = 2 ether;
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
            "QmCompleteTradingTestEventHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            TICKET_PRICE
        );
        vm.stopPrank();

        // Fund accounts
        vm.deal(investor1, 20 ether);
        vm.deal(investor2, 20 ether);
        vm.deal(trader1, 20 ether);
        vm.deal(trader2, 20 ether);
    }

    // ============ COMPLETE SYSTEM INTEGRATION TESTS ============

    function testCompleteTradingSystemFlow() public {
        // 1. Initialize dynamic pricing
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        // 2. Add investors
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 3. Verify initial state
        uint256 totalInvested = streamEvents.getTotalInvested(eventId);
        assertEq(totalInvested, INVESTMENT_AMOUNT * 2);
        
        address[] memory investors = streamEvents.getEventInvestors(eventId);
        assertEq(investors.length, 2);
        
        // 4. Create share trading orders
        vm.startPrank(investor1);
        streamEvents.createInvestorShareSellOrder(
            eventId,
            SHARE_AMOUNT,
            SHARE_PRICE,
            address(0),
            0
        );
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        vm.stopPrank();
        
        vm.startPrank(trader1);
        streamEvents.createInvestorShareBuyOrder{value: SHARE_AMOUNT * SHARE_PRICE}(
            eventId,
            SHARE_AMOUNT,
            SHARE_PRICE,
            address(0),
            0
        );
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        vm.stopPrank();
        
        // 5. Execute trade
        vm.startPrank(trader1);
        streamEvents.executeTrade(buyOrders[0], sellOrders[0], SHARE_PRICE);
        vm.stopPrank();
        
        // 6. Verify trade execution
        uint256 trader1Shares = streamEvents.getInvestorShareBalance(eventId, trader1);
        assertTrue(trader1Shares > 0);
        
        // 7. Check pricing updates
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(currentPrice > 0.001 ether); // Price should have increased due to trading
        
        // 8. Check trading volume
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        assertTrue(totalVolume > 0);
        assertTrue(momentum > 0);
    }

    function testInvestorProtectionFlow() public {
        // 1. Set up investors
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Set up investor approval requirement
        vm.startPrank(creator);
        streamEvents.setInvestorApprovalRequired(eventId, true, 5000); // 50% threshold
        vm.stopPrank();
        
        // 3. Get investor approvals
        vm.startPrank(investor1);
        streamEvents.giveInvestorApproval(eventId, true);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        streamEvents.giveInvestorApproval(eventId, true);
        vm.stopPrank();
        
        // 4. Check approval status
        bool isMet = streamEvents.isInvestorApprovalMet(eventId);
        
        assertTrue(isMet);
    }

    function testDynamicPricingWithTrading() public {
        // 1. Initialize pricing
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        // 2. Add investors
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 3. Update total value (simulate domain sale)
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 10 ether);
        vm.stopPrank();
        
        // 4. Check price increase
        uint256 priceAfterValueUpdate = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(priceAfterValueUpdate > 0.001 ether);
        
        // 5. Execute trades to generate momentum
        for (uint i = 0; i < 3; i++) {
            vm.startPrank(investor1);
            streamEvents.createInvestorShareSellOrder(
                eventId,
                50,
                priceAfterValueUpdate * 2,
                address(0),
                0
            );
            uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
            vm.stopPrank();
            
            vm.startPrank(trader1);
            streamEvents.createInvestorShareBuyOrder{value: 50 * priceAfterValueUpdate * 2}(
                eventId,
                50,
                priceAfterValueUpdate * 2,
                address(0),
                0
            );
            uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
            streamEvents.executeTrade(buyOrders[0], sellOrders[0], priceAfterValueUpdate * 2);
            vm.stopPrank();
        }
        
        // 6. Check final price with momentum
        uint256 finalPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(finalPrice > priceAfterValueUpdate);
        
        // 7. Verify comprehensive market data
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertTrue(currentPrice > 0.001 ether); // currentPrice > base
        assertTrue(totalVolume > 0); // totalVolume
        assertTrue(momentum > 0); // momentum
        
        assertTrue(buyVolume > 0); // buyVolume
        assertTrue(sellVolume > 0); // sellVolume
        assertTrue(momentum > 0); // momentumFactor
    }

    // ============ ERROR HANDLING INTEGRATION TESTS ============

    function testErrorHandlingIntegration() public {
        // 1. Test trading without proper setup
        vm.startPrank(trader1);
        
        // Try to create share order without pricing
        vm.expectRevert("dynamic pricing not initialized");
        streamEvents.createInvestorShareBuyOrder{value: 1 ether}(
            eventId,
            100,
            0.01 ether,
            address(0),
            0
        );
        
        vm.stopPrank();
        
        // 2. Set up pricing
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        // 3. Try with invalid price
        vm.startPrank(trader1);
        vm.expectRevert("price too low");
        streamEvents.createInvestorShareBuyOrder{value: 1 ether}(
            eventId,
            100,
            0.0005 ether, // Below current price
            address(0),
            0
        );
        
        vm.stopPrank();
    }

    // ============ GAS OPTIMIZATION INTEGRATION TESTS ============

    function testGasOptimizationIntegration() public {
        // 1. Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Measure gas for complete trading flow
        vm.startPrank(investor1);
        streamEvents.createInvestorShareSellOrder(
            eventId,
            SHARE_AMOUNT,
            SHARE_PRICE,
            address(0),
            0
        );
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        vm.stopPrank();
        
        vm.startPrank(trader1);
        uint256 gasStart = gasleft();
        streamEvents.createInvestorShareBuyOrder{value: SHARE_AMOUNT * SHARE_PRICE}(
            eventId,
            SHARE_AMOUNT,
            SHARE_PRICE,
            address(0),
            0
        );
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        streamEvents.executeTrade(buyOrders[0], sellOrders[0], SHARE_PRICE);
        uint256 gasUsed = gasStart - gasleft();
        vm.stopPrank();
        
        // Complete trading flow should be gas efficient
        assertTrue(gasUsed < 400000); // Should be less than 400k gas
    }

    // ============ STRESS TESTING INTEGRATION ============

    function testStressTestIntegration() public {
        // 1. Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: 10 ether}(eventId);
        vm.stopPrank();
        
        // 2. Create many orders
        for (uint i = 0; i < 5; i++) {
            vm.startPrank(trader1);
            streamEvents.createInvestorShareBuyOrder{value: 100 * 0.001 ether}(
                eventId,
                100,
                0.001 ether,
                address(0),
                0
            );
            vm.stopPrank();
        }
        
        // 3. Verify all orders were created
        uint256[] memory orders = streamEvents.getEventOrders(eventId);
        assertEq(orders.length, 5);
        
        // 4. Execute all trades
        for (uint i = 0; i < 5; i++) {
            vm.startPrank(investor1);
            streamEvents.createInvestorShareSellOrder(
                eventId,
                100,
                0.001 ether,
                address(0),
                0
            );
            uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
            vm.stopPrank();
            
            vm.startPrank(trader1);
            uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
            streamEvents.executeTrade(buyOrders[0], sellOrders[0], 0.001 ether);
            vm.stopPrank();
        }
        
        // 5. Verify final state
        uint256 trader1Shares = streamEvents.getInvestorShareBalance(eventId, trader1);
        assertEq(trader1Shares, 500); // 5 trades * 100 shares each
        
        // 6. Check trading volume
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        assertTrue(totalVolume > 0);
        assertTrue(momentum > 0);
    }

    // ============ COMPREHENSIVE MARKET SCENARIOS ============

    function testComprehensiveMarketScenario() public {
        // 1. Initialize complete system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        // 2. Add multiple investors
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: 3 ether}(eventId);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        streamEvents.investInEvent{value: 2 ether}(eventId);
        vm.stopPrank();
        
        // 3. Update total value
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 15 ether);
        vm.stopPrank();
        
        // 4. Execute various trades
        for (uint i = 0; i < 3; i++) {
            vm.startPrank(investor1);
            streamEvents.createInvestorShareSellOrder(
                eventId,
                50,
                0.002 ether,
                address(0),
                0
            );
            uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
            vm.stopPrank();
            
            vm.startPrank(trader1);
            streamEvents.createInvestorShareBuyOrder{value: 50 * 0.002 ether}(
                eventId,
                50,
                0.002 ether,
                address(0),
                0
            );
            uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
            streamEvents.executeTrade(buyOrders[0], sellOrders[0], 0.002 ether);
            vm.stopPrank();
        }
        
        // 5. Verify comprehensive market data
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        // Pricing info
        assertTrue(currentPrice > 0.001 ether); // currentPrice > base
        
        // Trading info
        assertTrue(totalVolume > 0); // totalVolume
        assertTrue(buyVolume > 0); // buyVolume
        assertTrue(sellVolume > 0); // sellVolume
        assertTrue(momentum > 0); // momentumFactor
        assertTrue(buyRatio > 0); // buyRatio
        assertTrue(sellRatio > 0); // sellRatio
        
        // 6. Verify investor balances
        uint256 investor1Shares = streamEvents.getInvestorShareBalance(eventId, investor1);
        uint256 investor2Shares = streamEvents.getInvestorShareBalance(eventId, investor2);
        uint256 trader1Shares = streamEvents.getInvestorShareBalance(eventId, trader1);
        
        assertTrue(investor1Shares > 0);
        assertTrue(investor2Shares > 0);
        assertTrue(trader1Shares > 0);
        
        // 7. Verify total shares
        uint256 totalShares = investor1Shares + investor2Shares + trader1Shares;
        assertEq(totalShares, 5 ether); // Should equal total investment
    }

    // ============ EDGE CASE INTEGRATION TESTS ============

    function testEdgeCaseIntegration() public {
        // 1. Test with very small amounts
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.000001 ether); // Very small base price
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: 0.001 ether}(eventId);
        vm.stopPrank();
        
        // 2. Execute very small trade
        vm.startPrank(investor1);
        streamEvents.createInvestorShareSellOrder(
            eventId,
            1, // Very small amount
            0.000002 ether,
            address(0),
            0
        );
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        vm.stopPrank();
        
        vm.startPrank(trader1);
        streamEvents.createInvestorShareBuyOrder{value: 1 * 0.000002 ether}(
            eventId,
            1,
            0.000002 ether,
            address(0),
            0
        );
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        streamEvents.executeTrade(buyOrders[0], sellOrders[0], 0.000002 ether);
        vm.stopPrank();
        
        // 3. Verify system handled small amounts correctly
        uint256 trader1Shares = streamEvents.getInvestorShareBalance(eventId, trader1);
        assertEq(trader1Shares, 1);
        
        // 4. Check pricing still works
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(currentPrice > 0);
    }

    // ============ PERFORMANCE INTEGRATION TESTS ============

    function testPerformanceIntegration() public {
        // 1. Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: 5 ether}(eventId);
        vm.stopPrank();
        
        // 2. Measure performance of multiple operations
        uint256 gasStart = gasleft();
        
        // Create order
        vm.startPrank(trader1);
        streamEvents.createInvestorShareBuyOrder{value: 100 * 0.001 ether}(
            eventId,
            100,
            0.001 ether,
            address(0),
            0
        );
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        vm.stopPrank();
        
        // Create matching sell order
        vm.startPrank(investor1);
        streamEvents.createInvestorShareSellOrder(
            eventId,
            100,
            0.001 ether,
            address(0),
            0
        );
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        vm.stopPrank();
        
        // Execute trade
        vm.startPrank(trader1);
        streamEvents.executeTrade(buyOrders[0], sellOrders[0], 0.001 ether);
        vm.stopPrank();
        
        // Get market data
        streamEvents.getCurrentSharePrice(eventId);
        streamEvents.getTradingInfo(eventId);
        
        uint256 gasUsed = gasStart - gasleft();
        
        // Complete flow should be efficient
        assertTrue(gasUsed < 500000); // Should be less than 500k gas
    }
}
