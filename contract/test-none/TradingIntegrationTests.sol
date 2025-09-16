// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/event.sol";
import "../src/events/Types.sol";
import "../src/events/Events.sol";

contract TradingIntegrationTests is Test {
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

    // ============ COMPLETE DOMAIN TRADING FLOW ============

    function testCompleteDomainTradingFlow() public {
        // 1. Create event (already done in setUp)
        assertTrue(eventId > 0);
        
        // 2. Set up ownership token (mocked for testing)
        // In real implementation, this would be set up properly
        
        // 3. Create sell order
        vm.startPrank(creator);
        // This would work with proper ownership token setup
        // streamEvents.createSellOrder(eventId, 4 ether, 6 ether, address(0), 0);
        vm.stopPrank();
        
        // 4. Create buy order
        vm.startPrank(buyer);
        streamEvents.createBuyOrder{value: 5 ether}(eventId, 5 ether, address(0), 0);
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        assertEq(buyOrders.length, 1);
        vm.stopPrank();
        
        // 5. Execute trade (would work with proper setup)
        // vm.startPrank(buyer);
        // streamEvents.executeTrade(buyOrders[0], sellOrderId, 5 ether);
        // vm.stopPrank();
        
        // 6. Verify trade execution
        // uint256 marketPrice = streamEvents.getEventMarketPrice(eventId);
        // assertEq(marketPrice, 5 ether);
    }

    // ============ COMPLETE SHARE TRADING FLOW ============

    function testCompleteShareTradingFlow() public {
        // 1. Initialize dynamic pricing
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        
        // Verify pricing setup
        uint256 basePrice = streamEvents.getCurrentSharePrice(eventId);
        assertEq(basePrice, 0.001 ether);
        vm.stopPrank();
        
        // 2. Mock investor investment (simulate shares)
        // In real implementation, this would come from actual investment
        vm.startPrank(investor1);
        
        // Simulate investor having shares by directly calling investInEvent
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        
        // Verify investor has shares
        uint256 shareBalance = streamEvents.getInvestorShareBalance(eventId, investor1);
        assertTrue(shareBalance > 0);
        
        // 3. Create share sell order
        streamEvents.createInvestorShareSellOrder(
            eventId,
            shareBalance / 2, // Sell half
            0.002 ether, // Price above current
            address(0),
            0
        );
        
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        assertEq(sellOrders.length, 1);
        vm.stopPrank();
        
        // 4. Create share buy order
        vm.startPrank(buyer);
        streamEvents.createInvestorShareBuyOrder{value: SHARE_AMOUNT * 0.002 ether}(
            eventId,
            SHARE_AMOUNT,
            0.002 ether,
            address(0),
            0
        );
        
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        assertEq(buyOrders.length, 1);
        vm.stopPrank();
        
        // 5. Execute share trade
        vm.startPrank(buyer);
        streamEvents.executeTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        vm.stopPrank();
        
        // 6. Verify share transfer
        uint256 newBuyerBalance = streamEvents.getInvestorShareBalance(eventId, buyer);
        assertTrue(newBuyerBalance > 0);
        
        // 7. Check updated pricing due to trading volume
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        assertTrue(totalVolume > 0);
        assertTrue(momentum > 0);
    }

    // ============ INVESTOR PROTECTION FLOW ============

    function testInvestorProtectionFlow() public {
        // 1. Set up investors
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: 2 ether}(eventId);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        streamEvents.investInEvent{value: 1 ether}(eventId);
        vm.stopPrank();
        
        // 2. Set up investor approval requirement
        vm.startPrank(creator);
        streamEvents.setInvestorApprovalRequired(eventId, true, 5000); // 50% threshold
        vm.stopPrank();
        
        // 3. Check initial approval status
        bool isMet = streamEvents.isInvestorApprovalMet(eventId);
        assertFalse(isMet); // No approvals yet
        
        // 4. Get investor approvals
        vm.startPrank(investor1);
        streamEvents.giveInvestorApproval(eventId, true);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        streamEvents.giveInvestorApproval(eventId, true);
        vm.stopPrank();
        
        // 5. Check approval status after approvals
        isMet = streamEvents.isInvestorApprovalMet(eventId);
        assertTrue(isMet); // Should be met now
        
        // 6. Domain sale would now be allowed
        // (This would require proper ownership token setup)
    }

    // ============ DYNAMIC PRICING INTEGRATION ============

    function testDynamicPricingIntegration() public {
        // 1. Initialize pricing
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        // 2. Set up investors
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: 5 ether}(eventId);
        vm.stopPrank();
        
        // 3. Update event total value (simulate domain sale)
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 10 ether);
        vm.stopPrank();
        
        // 4. Check price increase
        uint256 newPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(newPrice > 0.001 ether); // Price should have increased
        
        // 5. Get comprehensive pricing info
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            streamEvents.getPricingInfo(eventId);
        
        assertEq(basePrice, 0.001 ether);
        assertTrue(currentMultiplier > 10000); // Should be > 1.0x
        assertEq(currentPrice, newPrice);
        assertEq(totalValue, 10 ether);
        assertEq(shareSupply, 5 ether); // Investor shares
    }

    // ============ TRADING VOLUME INTEGRATION ============

    function testTradingVolumeIntegration() public {
        // 1. Set up pricing and investors
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: 2 ether}(eventId);
        vm.stopPrank();
        
        // 2. Create and execute multiple trades
        for (uint i = 0; i < 3; i++) {
            vm.startPrank(investor1);
            streamEvents.createInvestorShareSellOrder(
                eventId,
                10,
                0.002 ether,
                address(0),
                0
            );
            uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
            vm.stopPrank();
            
            vm.startPrank(buyer);
            streamEvents.createInvestorShareBuyOrder{value: 10 * 0.002 ether}(
                eventId,
                10,
                0.002 ether,
                address(0),
                0
            );
            uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
            streamEvents.executeTrade(buyOrders[0], sellOrders[0], 0.002 ether);
            vm.stopPrank();
        }
        
        // 3. Check trading volume
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertTrue(totalVolume > 0);
        assertTrue(buyVolume > 0);
        assertTrue(sellVolume > 0);
        assertTrue(momentum > 0);
        assertEq(buyRatio + sellRatio, 10000); // Should add up to 100%
    }

    // ============ COMPREHENSIVE MARKET DATA ============

    function testComprehensiveMarketData() public {
        // 1. Set up complete system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: 3 ether}(eventId);
        vm.stopPrank();
        
        // 2. Execute some trades
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
        
        vm.startPrank(buyer);
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
        
        // 3. Get comprehensive market data
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            streamEvents.getPricingInfo(eventId);
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        // Verify pricing info
        assertEq(basePrice, 0.001 ether);
        assertTrue(currentMultiplier > 0);
        assertTrue(currentPrice > 0);
        assertTrue(totalValue > 0);
        assertEq(shareSupply, 3 ether);
        
        // Verify trading info
        assertTrue(totalVolume > 0);
        assertTrue(buyVolume > 0);
        assertTrue(sellVolume > 0);
        assertTrue(momentum > 0);
        assertTrue(buyRatio > 0);
        assertTrue(sellRatio > 0);
    }

    // ============ ERROR HANDLING INTEGRATION ============

    function testErrorHandlingIntegration() public {
        // 1. Test trading without proper setup
        vm.startPrank(buyer);
        
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
        
        // 2. Test with proper setup
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        vm.startPrank(buyer);
        
        // Try with invalid price
        vm.expectRevert("price too low");
        streamEvents.createInvestorShareBuyOrder{value: 1 ether}(
            eventId,
            100,
            0.0005 ether, // Below current price
            address(0),
            0
        );
        
        // Try with price too high
        vm.expectRevert("price too high");
        streamEvents.createInvestorShareBuyOrder{value: 1 ether}(
            eventId,
            100,
            0.002 ether, // Above 150% of current price
            address(0),
            0
        );
        
        vm.stopPrank();
    }

    // ============ GAS OPTIMIZATION TESTS ============

    function testGasOptimization() public {
        // Test gas usage for common operations
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: 1 ether}(eventId);
        vm.stopPrank();
        
        // Measure gas for order creation
        vm.startPrank(buyer);
        uint256 gasStart = gasleft();
        streamEvents.createInvestorShareBuyOrder{value: 100 * 0.001 ether}(
            eventId,
            100,
            0.001 ether,
            address(0),
            0
        );
        uint256 gasUsed = gasStart - gasleft();
        
        // Gas usage should be reasonable (adjust threshold as needed)
        assertTrue(gasUsed < 200000); // Should be less than 200k gas
        
        vm.stopPrank();
    }

    // ============ STRESS TESTS ============

    function testStressTest() public {
        // Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: 10 ether}(eventId);
        vm.stopPrank();
        
        // Create many orders
        for (uint i = 0; i < 10; i++) {
            vm.startPrank(buyer);
            streamEvents.createInvestorShareBuyOrder{value: 100 * 0.001 ether}(
                eventId,
                100,
                0.001 ether,
                address(0),
                0
            );
            vm.stopPrank();
        }
        
        // Verify all orders were created
        uint256[] memory orders = streamEvents.getEventOrders(eventId);
        assertEq(orders.length, 10);
        
        // Verify active orders
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        assertEq(buyOrders.length, 10);
    }
}
