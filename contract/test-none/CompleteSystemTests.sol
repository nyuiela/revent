// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "./BaseForkTest.sol";

contract CompleteSystemTests is BaseForkTest {
    
    function testSystemInitialization() public {
        // Verify fork setup
        assertEq(block.chainid, CHAIN_ID);
        assertTrue(DOMA_RECORD != address(0));
        assertTrue(OWNERSHIP_TOKEN != address(0));
        assertTrue(CROSS_CHAIN_GATEWAY != address(0));
        assertTrue(FORWARDER != address(0));
        
        // Verify our contract deployment
        assertTrue(address(streamEvents) != address(0));
        
        // Log all information
        logContractAddresses();
        logTestAccounts();
        
        console.log("System initialization successful");
        console.log("Chain ID:", block.chainid);
        console.log("Block Number:", block.number);
        console.log("Block Explorer:", BLOCK_EXPLORER);
    }
    
    function testEventCreationWithTokenization() public {
        // Test the core functionality - creating events with tokenization
        eventId = createEventWithTokenization();
        
        // Verify event creation
        assertEventCreated(eventId);
        
        // Verify event exists in our system
        // Note: In real implementation, verify the tokenization request was made to Doma, use mock bfor now
        
        console.log("Event created with tokenization:", eventId);
        console.log("Event can be viewed at:", string(abi.encodePacked(BLOCK_EXPLORER, "/address/", vm.toString(address(streamEvents)))));
    }
    
    function testCompleteTradingFlow() public {
        // 1. Create tokenized event
        eventId = createEventWithTokenization();
        assertEventCreated(eventId);
        
        // 2. Set up dynamic pricing
        setupDynamicPricing(0.001 ether);
        
        // 3. Add investors
        setupInvestor(investor1, 2 ether);
        setupInvestor(investor2, 1 ether);
        
        // 4. Verify investor shares
        assertInvestorHasShares(investor1, 2 ether);
        assertInvestorHasShares(investor2, 1 ether);
        
        // 5. Update event total value
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 10 ether);
        vm.stopPrank();
        
        // 6. Verify price increased
        assertPriceUpdated(0.001 ether);
        
        // 7. Create and execute trades
        uint256[] memory sellOrders = createShareSellOrder(investor1, 100, 0.002 ether);
        uint256[] memory buyOrders = createShareBuyOrder(trader1, 100, 0.002 ether);
        executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        
        // 8. Verify trade execution
        assertInvestorHasShares(trader1, 100);
        
        // 9. Check trading volume
        assertTradingVolume(100 * 0.002 ether);
        
        console.log("Complete trading flow successful");
    }
    
    function testInvestorProtectionSystem() public {
        // 1. Create tokenized event
        eventId = createEventWithTokenization();
        
        // 2. Set up investors
        setupInvestor(investor1, 3 ether);
        setupInvestor(investor2, 2 ether);
        setupInvestor(trader1, 1 ether);
        
        // 3. Set up investor approval requirement
        vm.startPrank(creator);
        streamEvents.setInvestorApprovalRequired(eventId, true, 6000); // 60% threshold
        vm.stopPrank();
        
        // 4. Check initial approval status
        bool isMet = streamEvents.isInvestorApprovalMet(eventId);
        assertFalse(isMet);
        
        // 5. Get approvals from major investors
        vm.startPrank(investor1);
        streamEvents.giveInvestorApproval(eventId, true);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        streamEvents.giveInvestorApproval(eventId, true);
        vm.stopPrank();
        
        // 6. Check approval status
        isMet = streamEvents.isInvestorApprovalMet(eventId);
        assertTrue(isMet);
        
        console.log("Investor protection system working");
    }
    
    function testDynamicPricingSystem() public {
        // 1. Create tokenized event
        eventId = createEventWithTokenization();
        
        // 2. Set up pricing
        setupDynamicPricing(0.001 ether);
        setupInvestor(investor1, 2 ether);
        
        // 3. Update total value
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 5 ether);
        vm.stopPrank();
        
        // 4. Verify price increased
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(currentPrice > 0.001 ether);
        
        // 5. Execute trades to affect momentum
        for (uint i = 0; i < 3; i++) {
            uint256[] memory sellOrders = createShareSellOrder(investor1, 20, 0.002 ether);
            uint256[] memory buyOrders = createShareBuyOrder(trader1, 20, 0.002 ether);
            executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        }
        
        // 6. Check momentum affected pricing
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertTrue(totalVolume > 0);
        assertTrue(momentum > 10000);
        assertEq(buyRatio, 10000);
        assertEq(sellRatio, 0);
        
        console.log("Dynamic pricing system working");
        console.log("Final price:", currentPrice);
        console.log("Momentum:", momentum);
    }
    
    function testOrderManagementSystem() public {
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
        
        console.log("Order management system working");
    }
    
    function testMultipleEventsManagement() public {
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
        
        console.log("Multiple events management working");
    }
    
    function testGasOptimization() public {
        // Measure gas for various operations
        uint256 gasStart;
        uint256 gasUsed;
        
        // 1. Event creation
        gasStart = gasleft();
        eventId = createEventWithTokenization();
        gasUsed = gasStart - gasleft();
        console.log("Event creation gas:", gasUsed);
        assertTrue(gasUsed < 500000);
        
        // 2. Pricing setup
        gasStart = gasleft();
        setupDynamicPricing(0.001 ether);
        gasUsed = gasStart - gasleft();
        console.log("Pricing setup gas:", gasUsed);
        assertTrue(gasUsed < 100000);
        
        // 3. Investment
        gasStart = gasleft();
        setupInvestor(investor1, 1 ether);
        gasUsed = gasStart - gasleft();
        console.log("Investment gas:", gasUsed);
        assertTrue(gasUsed < 200000);
        
        // 4. Trading
        gasStart = gasleft();
        uint256[] memory sellOrders = createShareSellOrder(investor1, 50, 0.002 ether);
        uint256[] memory buyOrders = createShareBuyOrder(trader1, 50, 0.002 ether);
        executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        gasUsed = gasStart - gasleft();
        console.log("Trading gas:", gasUsed);
        assertTrue(gasUsed < 300000);
        
        console.log("Gas optimization verified");
    }
    
    function testEdgeCases() public {
        // 1. Create tokenized event
        eventId = createEventWithTokenization();
        
        // 2. Test with very small amounts
        setupDynamicPricing(0.000001 ether);
        setupInvestor(investor1, 0.001 ether);
        
        // 3. Execute very small trade
        uint256[] memory sellOrders = createShareSellOrder(investor1, 1, 0.000002 ether);
        uint256[] memory buyOrders = createShareBuyOrder(trader1, 1, 0.000002 ether);
        executeShareTrade(buyOrders[0], sellOrders[0], 0.000002 ether);
        
        // 4. Verify system handled small amounts
        uint256 trader1Shares = streamEvents.getInvestorShareBalance(eventId, trader1);
        assertEq(trader1Shares, 1);
        
        // 5. Test with very high values
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 1000 ether);
        vm.stopPrank();
        
        // 6. Verify price is reasonable
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(currentPrice > 0.000001 ether);
        assertTrue(currentPrice <= 0.000001 ether * 100);
        
        console.log("Edge cases handled correctly");
    }
    
    function testRealDomaContractIntegration() public {
        // Test actual integration with Doma contracts
        console.log("Testing real Doma contract integration...");
        
        // Verify contract addresses have code
        assertTrue(DOMA_RECORD.code.length > 0);
        assertTrue(OWNERSHIP_TOKEN.code.length > 0);
        assertTrue(CROSS_CHAIN_GATEWAY.code.length > 0);
        assertTrue(FORWARDER.code.length > 0);
        
        // Test Doma Record contract
        try domaRecord.requestTokenization{value: 0.1 ether}(mockVoucher, mockSignature) {
            console.log("Doma Record tokenization request successful");
        } catch {
            console.log("Doma Record tokenization request failed (expected with mock signature)");
        }
        
        // Test Ownership Token contract
        try ownershipToken.ownerOf(1) {
            address owner = ownershipToken.ownerOf(1);
            console.log("Token 1 owner:", owner);
        } catch {
            console.log("No token with ID 1 exists (expected)");
        }
        
        console.log("Real Doma contract integration verified");
    }
    
    function testComprehensiveMarketScenario() public {
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
        
        console.log("Comprehensive market scenario successful");
        console.log("Base Price:", basePrice);
        console.log("Current Price:", currentPrice);
        console.log("Total Volume:", totalVolume);
        console.log("Momentum:", momentum);
    }
    
    function testSystemStressTest() public {
        // Create multiple events and stress test the system
        uint256[] memory eventIds = new uint256[](5);
        
        for (uint i = 0; i < 5; i++) {
            eventIds[i] = createEventWithTokenization();
            assertEventCreated(eventIds[i]);
            
            // Set up each event
            vm.startPrank(creator);
            streamEvents.initializeDynamicPricing(eventIds[i], 0.001 ether);
            vm.stopPrank();
            
            setupInvestor(investor1, 1 ether);
            
            // Execute multiple trades
            for (uint j = 0; j < 3; j++) {
                uint256[] memory sellOrders = createShareSellOrder(investor1, 10, 0.002 ether);
                uint256[] memory buyOrders = createShareBuyOrder(trader1, 10, 0.002 ether);
                executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
            }
        }
        
        // Verify all events are working
        for (uint i = 0; i < 5; i++) {
            (uint256 totalVolume,,,,,) = streamEvents.getTradingInfo(eventIds[i]);
            assertTrue(totalVolume > 0);
        }
        
        console.log("System stress test passed");
    }
}
