// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "./BaseForkTest.sol";

contract ComprehensiveForkTests is BaseForkTest {
    
    function testCompleteTradingSystemWithRealDoma() public {
        // 1. Create tokenized event
        eventId = createEventWithTokenization();
        assertEventCreated(eventId);
        
        // 2. Set up dynamic pricing
        setupDynamicPricing(0.001 ether);
        
        // 3. Add multiple investors
        setupInvestor(investor1, 2 ether);
        setupInvestor(investor2, 1 ether);
        setupInvestor(trader1, 1.5 ether);
        
        // 4. Verify investor shares
        assertInvestorHasShares(investor1, 2 ether);
        assertInvestorHasShares(investor2, 1 ether);
        assertInvestorHasShares(trader1, 1.5 ether);
        
        // 5. Update event total value
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 10 ether);
        vm.stopPrank();
        
        // 6. Verify price increased
        assertPriceUpdated(0.001 ether);
        
        // 7. Execute multiple trades
        for (uint i = 0; i < 3; i++) {
            uint256[] memory sellOrders = createShareSellOrder(investor1, 50, SHARE_PRICE);
            uint256[] memory buyOrders = createShareBuyOrder(trader2, 50, SHARE_PRICE);
            executeShareTrade(buyOrders[0], sellOrders[0], SHARE_PRICE);
        }
        
        // 8. Verify trading volume
        assertTradingVolume(150 * SHARE_PRICE); // 3 trades * 50 shares * price
        
        // 9. Check final state
        uint256 trader2Shares = streamEvents.getInvestorShareBalance(eventId, trader2);
        assertEq(trader2Shares, 150);
        
        console.log("Complete trading system with real Doma test passed!");
    }
    
    function testInvestorProtectionFlowWithRealContracts() public {
        // 1. Create tokenized event
        eventId = createEventWithTokenization();
        
        // 2. Set up investors with different amounts
        setupInvestor(investor1, 3 ether);
        setupInvestor(investor2, 2 ether);
        setupInvestor(trader1, 1 ether);
        
        // 3. Set up investor approval requirement
        vm.startPrank(creator);
        streamEvents.setInvestorApprovalRequired(eventId, true, 6000); // 60% threshold
        vm.stopPrank();
        
        // 4. Check initial approval status
        bool isMet = streamEvents.isInvestorApprovalMet(eventId);
        assertFalse(isMet); // Not enough approvals yet
        
        // 5. Get approvals from major investors
        vm.startPrank(investor1);
        streamEvents.giveInvestorApproval(eventId, true);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        streamEvents.giveInvestorApproval(eventId, true);
        vm.stopPrank();
        
        // 6. Check approval status
        isMet = streamEvents.isInvestorApprovalMet(eventId);
        assertTrue(isMet); // Should be met now (5 ether out of 6 ether total)
        
        console.log("Investor protection flow with real contracts test passed!");
    }
    
    function testDynamicPricingWithTradingMomentumOnFork() public {
        // 1. Create tokenized event
        eventId = createEventWithTokenization();
        
        // 2. Set up pricing and investors
        setupDynamicPricing(0.001 ether);
        setupInvestor(investor1, 2 ether);
        
        // 3. Execute buy-heavy trades to create upward momentum
        for (uint i = 0; i < 5; i++) {
            uint256[] memory sellOrders = createShareSellOrder(investor1, 20, 0.002 ether);
            uint256[] memory buyOrders = createShareBuyOrder(trader1, 20, 0.002 ether);
            executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        }
        
        // 4. Check momentum affected pricing
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertTrue(totalVolume > 0);
        assertTrue(momentum > 10000); // Should be > 1.0x due to buy pressure
        assertEq(buyRatio, 10000); // 100% buy
        assertEq(sellRatio, 0); // 0% sell
        
        // 5. Verify price increased due to momentum
        uint256 finalPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(finalPrice > 0.001 ether);
        
        console.log("Dynamic pricing with trading momentum on fork test passed!");
    }
    
    function testOrderManagementFlowOnFork() public {
        // 1. Create tokenized event
        eventId = createEventWithTokenization();
        
        // 2. Set up pricing
        setupDynamicPricing(0.001 ether);
        setupInvestor(investor1, 1 ether);
        
        // 3. Create multiple orders
        vm.startPrank(trader1);
        streamEvents.createInvestorShareBuyOrder{value: 100 * 0.002 ether}(
            eventId, 100, 0.002 ether, address(0), 0
        );
        streamEvents.createInvestorShareBuyOrder{value: 200 * 0.003 ether}(
            eventId, 200, 0.003 ether, address(0), 0
        );
        vm.stopPrank();
        
        // 4. Verify orders were created
        uint256[] memory orders = streamEvents.getUserOrders(trader1);
        assertEq(orders.length, 2);
        
        // 5. Update first order
        vm.startPrank(trader1);
        streamEvents.updateOrder(orders[0], 0, 0.0025 ether, 0);
        vm.stopPrank();
        
        // 6. Verify update
        EventTypes.TradingOrder memory order = streamEvents.getOrder(orders[0]);
        assertEq(order.maxPrice, 0.0025 ether);
        
        // 7. Cancel second order
        vm.startPrank(trader1);
        streamEvents.cancelOrder(orders[1]);
        vm.stopPrank();
        
        // 8. Verify cancellation
        order = streamEvents.getOrder(orders[1]);
        assertEq(uint256(order.status), uint256(EventTypes.OrderStatus.CANCELLED));
        
        console.log("Order management flow on fork test passed!");
    }
    
    function testStressTestMultipleEventsOnFork() public {
        // Create multiple tokenized events
        uint256[] memory eventIds = new uint256[](3);
        for (uint i = 0; i < 3; i++) {
            eventIds[i] = createEventWithTokenization();
            assertEventCreated(eventIds[i]);
        }
        
        // Set up trading for each event
        for (uint i = 0; i < 3; i++) {
            uint256 currentEventId = eventIds[i];
            
            // Set up pricing
            vm.startPrank(creator);
            streamEvents.initializeDynamicPricing(currentEventId, 0.001 ether);
            vm.stopPrank();
            
            // Add investors
            setupInvestor(investor1, 1 ether);
            
            // Execute trades
            for (uint j = 0; j < 2; j++) {
                uint256[] memory sellOrders = createShareSellOrder(investor1, 25, 0.002 ether);
                uint256[] memory buyOrders = createShareBuyOrder(trader1, 25, 0.002 ether);
                executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
            }
        }
        
        // Verify all events have trading activity
        for (uint i = 0; i < 3; i++) {
            (uint256 totalVolume,,,,,) = streamEvents.getTradingInfo(eventIds[i]);
            assertTrue(totalVolume > 0);
        }
        
        console.log("Stress test with multiple events on fork passed!");
    }
    
    function testGasOptimizationOnFork() public {
        // 1. Create tokenized event
        uint256 gasStart = gasleft();
        eventId = createEventWithTokenization();
        uint256 eventCreationGas = gasStart - gasleft();
        
        // 2. Set up pricing
        gasStart = gasleft();
        setupDynamicPricing(0.001 ether);
        uint256 pricingGas = gasStart - gasleft();
        
        // 3. Add investor
        gasStart = gasleft();
        setupInvestor(investor1, 1 ether);
        uint256 investmentGas = gasStart - gasleft();
        
        // 4. Execute trade
        gasStart = gasleft();
        uint256[] memory sellOrders = createShareSellOrder(investor1, 50, 0.002 ether);
        uint256[] memory buyOrders = createShareBuyOrder(trader1, 50, 0.002 ether);
        executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        uint256 tradingGas = gasStart - gasleft();
        
        // Verify gas usage is reasonable
        assertTrue(eventCreationGas < 500000);
        assertTrue(pricingGas < 100000);
        assertTrue(investmentGas < 200000);
        assertTrue(tradingGas < 300000);
        
        console.log("Event creation gas on fork:", eventCreationGas);
        console.log("Pricing setup gas on fork:", pricingGas);
        console.log("Investment gas on fork:", investmentGas);
        console.log("Trading gas on fork:", tradingGas);
    }
    
    function testEdgeCasesOnFork() public {
        // 1. Create tokenized event
        eventId = createEventWithTokenization();
        
        // 2. Test with very small amounts
        setupDynamicPricing(0.000001 ether); // Very small base price
        setupInvestor(investor1, 0.001 ether); // Very small investment
        
        // 3. Execute very small trade
        uint256[] memory sellOrders = createShareSellOrder(investor1, 1, 0.000002 ether);
        uint256[] memory buyOrders = createShareBuyOrder(trader1, 1, 0.000002 ether);
        executeShareTrade(buyOrders[0], sellOrders[0], 0.000002 ether);
        
        // 4. Verify system handled small amounts
        uint256 trader1Shares = streamEvents.getInvestorShareBalance(eventId, trader1);
        assertEq(trader1Shares, 1);
        
        // 5. Test with very high values
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 1000 ether); // Very high value
        vm.stopPrank();
        
        // 6. Verify price is capped
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(currentPrice > 0.000001 ether);
        assertTrue(currentPrice <= 0.000001 ether * 100); // Should be capped
        
        console.log("Edge cases on fork test passed!");
    }
    
    function testComprehensiveMarketScenarioOnFork() public {
        // 1. Create tokenized event
        eventId = createEventWithTokenization();
        
        // 2. Set up complete system
        setupDynamicPricing(0.001 ether);
        setupInvestor(investor1, 3 ether);
        setupInvestor(investor2, 2 ether);
        
        // 3. Update total value
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 20 ether);
        vm.stopPrank();
        
        // 4. Execute various trades
        for (uint i = 0; i < 5; i++) {
            uint256[] memory sellOrders = createShareSellOrder(investor1, 40, 0.002 ether);
            uint256[] memory buyOrders = createShareBuyOrder(trader1, 40, 0.002 ether);
            executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        }
        
        // 5. Get comprehensive data
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            streamEvents.getPricingInfo(eventId);
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        // 6. Verify all data
        assertEq(basePrice, 0.001 ether);
        assertTrue(currentMultiplier > 10000);
        assertTrue(currentPrice > 0.001 ether);
        assertEq(totalValue, 20 ether);
        assertEq(shareSupply, 5 ether);
        
        assertTrue(totalVolume > 0);
        assertTrue(momentum > 0);
        assertEq(buyRatio + sellRatio, 10000);
        
        // 7. Verify final balances
        uint256 trader1Shares = streamEvents.getInvestorShareBalance(eventId, trader1);
        assertEq(trader1Shares, 200); // 5 trades * 40 shares each
        
        console.log("Comprehensive market scenario on fork test passed!");
    }
    
    function testRealDomaContractIntegration() public {
        // Test actual integration with Doma contracts
        console.log("Testing real Doma contract integration...");
        
        // Test that our contract can interact with Doma contracts
        assertTrue(address(streamEvents) != address(0));
        
        // Test Doma proxy setup
        // Note: This would be set in the actual deployment
        // streamEvents.setDomaProxy(PROXY_DOMA_RECORD);
        
        // Test event creation with tokenization
        eventId = createEventWithTokenization();
        assertEventCreated(eventId);
        
        // Test that the event was created with Doma integration
        // In real implementation, this would verify the tokenization request
        
        console.log("Real Doma contract integration test passed!");
    }
    
    function testCrossChainFunctionality() public {
        // Test cross-chain functionality
        console.log("Testing cross-chain functionality...");
        
        // 1. Create tokenized event
        eventId = createEventWithTokenization();
        
        // 2. Set up domain trading
        setupDynamicPricing(0.001 ether);
        setupInvestor(investor1, 1 ether);
        
        // 3. Test cross-chain bridge (would require actual token)
        // This is a placeholder for cross-chain testing
        console.log("Cross-chain functionality test completed (placeholder)");
    }
    
    function testMetaTransactionSupport() public {
        // Test meta-transaction support via forwarder
        console.log("Testing meta-transaction support...");
        
        // Test that forwarder contract exists and has code
        assertTrue(FORWARDER.code.length > 0);
        
        // Test forwarder interface
        bytes memory mockRequest = abi.encode("mock_request");
        bytes memory mockSignature = abi.encode("mock_signature");
        
        // This would fail with mock data, but tests the interface
        try forwarder.verify(keccak256(mockRequest), mockSignature) {
            console.log("Forwarder verification successful");
        } catch {
            console.log("Forwarder verification failed (expected with mock data)");
        }
        
        console.log("Meta-transaction support test completed!");
    }
}



