// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/event.sol";
import "../src/events/Types.sol";

contract PriceManagerTests is Test {
    StreamEvents public streamEvents;
    address public owner = address(0x1);
    address public creator = address(0x2);
    address public investor1 = address(0x3);
    address public investor2 = address(0x4);
    
    uint256 public eventId;
    uint256 public constant BASE_PRICE = 0.001 ether;
    uint256 public constant INVESTMENT_AMOUNT = 5 ether;

    function setUp() public {
        vm.startPrank(owner);
        streamEvents = new StreamEvents();
        vm.stopPrank();

        // Create an event
        vm.startPrank(creator);
        eventId = streamEvents.createEvent(
            "QmPriceTestEventHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            0.1 ether
        );
        vm.stopPrank();

        // Fund accounts
        vm.deal(investor1, 10 ether);
        vm.deal(investor2, 10 ether);
    }

    // ============ PRICING INITIALIZATION TESTS ============

    function testInitializeDynamicPricing() public {
        vm.startPrank(creator);
        
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        
        // Verify pricing data
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            streamEvents.getPricingInfo(eventId);
        
        assertEq(basePrice, BASE_PRICE);
        assertEq(currentMultiplier, 10000); // 1.0x multiplier
        assertEq(currentPrice, BASE_PRICE);
        assertEq(totalValue, 0); // No value yet
        assertEq(shareSupply, 0); // No shares yet
        
        vm.stopPrank();
    }

    function testInitializePricingTwice() public {
        vm.startPrank(creator);
        
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        
        // Should fail on second initialization
        vm.expectRevert("already initialized");
        streamEvents.initializeDynamicPricing(eventId, 0.002 ether);
        
        vm.stopPrank();
    }

    function testInitializePricingWithZeroPrice() public {
        vm.startPrank(creator);
        
        vm.expectRevert("invalid base price");
        streamEvents.initializeDynamicPricing(eventId, 0);
        
        vm.stopPrank();
    }

    function testInitializePricingUnauthorized() public {
        vm.startPrank(investor1);
        
        vm.expectRevert();
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        
        vm.stopPrank();
    }

    // ============ PRICE CALCULATION TESTS ============

    function testGetCurrentSharePrice() public {
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        // Before any value is set
        uint256 price = streamEvents.getCurrentSharePrice(eventId);
        assertEq(price, BASE_PRICE);
        
        // After setting value
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 10 ether);
        vm.stopPrank();
        
        price = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(price > BASE_PRICE); // Price should have increased
    }

    function testGetCurrentSharePriceNotInitialized() public {
        uint256 price = streamEvents.getCurrentSharePrice(eventId);
        assertEq(price, 0); // Should return 0 if not initialized
    }

    function testPriceCalculationWithInvestors() public {
        // 1. Initialize pricing
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        // 2. Add investors
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 3. Update total value
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 20 ether);
        vm.stopPrank();
        
        // 4. Check price calculation
        uint256 price = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(price > BASE_PRICE);
        
        // Price should be calculated as: (totalValue / shareSupply) * basePrice
        // 20 ether / 5 ether = 4x multiplier
        // 0.001 ether * 4 = 0.004 ether
        assertEq(price, 0.004 ether);
    }

    // ============ VALUE UPDATE TESTS ============

    function testUpdateEventTotalValue() public {
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 10 ether);
        vm.stopPrank();
        
        // Verify value was updated
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            streamEvents.getPricingInfo(eventId);
        
        assertEq(totalValue, 10 ether);
        assertTrue(currentPrice > BASE_PRICE);
    }

    function testUpdateEventTotalValueUnauthorized() public {
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        vm.expectRevert("unauthorized");
        streamEvents.updateEventTotalValue(eventId, 10 ether);
        vm.stopPrank();
    }

    function testUpdateEventTotalValueZero() public {
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(creator);
        vm.expectRevert("invalid value");
        streamEvents.updateEventTotalValue(eventId, 0);
        vm.stopPrank();
    }

    // ============ PRICING INFO TESTS ============

    function testGetPricingInfo() public {
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 15 ether);
        vm.stopPrank();
        
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            streamEvents.getPricingInfo(eventId);
        
        assertEq(basePrice, BASE_PRICE);
        assertTrue(currentMultiplier > 10000); // Should be > 1.0x
        assertTrue(currentPrice > BASE_PRICE);
        assertEq(totalValue, 15 ether);
        assertEq(shareSupply, INVESTMENT_AMOUNT);
    }

    function testGetPricingInfoNotInitialized() public {
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            streamEvents.getPricingInfo(eventId);
        
        assertEq(basePrice, 0);
        assertEq(currentMultiplier, 0);
        assertEq(currentPrice, 0);
        assertEq(totalValue, 0);
        assertEq(shareSupply, 0);
    }

    // ============ PRICE MOMENTUM TESTS ============

    function testPriceMomentumFromTrading() public {
        // 1. Set up pricing and investors
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Create and execute trades to generate momentum
        for (uint i = 0; i < 5; i++) {
            vm.startPrank(investor1);
            streamEvents.createInvestorShareSellOrder(
                eventId,
                10,
                BASE_PRICE * 2, // Sell at 2x price
                address(0),
                0
            );
            uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
            vm.stopPrank();
            
            vm.startPrank(investor2);
            streamEvents.createInvestorShareBuyOrder{value: 10 * BASE_PRICE * 2}(
                eventId,
                10,
                BASE_PRICE * 2,
                address(0),
                0
            );
            uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
            streamEvents.executeTrade(buyOrders[0], sellOrders[0], BASE_PRICE * 2);
            vm.stopPrank();
        }
        
        // 3. Check that momentum affected pricing
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertTrue(totalVolume > 0);
        assertTrue(momentum > 0);
        
        // Price should be affected by momentum
        uint256 finalPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(finalPrice > BASE_PRICE);
    }

    // ============ EDGE CASES ============

    function testPriceCalculationWithZeroShares() public {
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        streamEvents.updateEventTotalValue(eventId, 10 ether);
        vm.stopPrank();
        
        // With zero shares, price should still be base price
        uint256 price = streamEvents.getCurrentSharePrice(eventId);
        assertEq(price, BASE_PRICE);
    }

    function testPriceCalculationWithZeroValue() public {
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // With zero value, price should still be base price
        uint256 price = streamEvents.getCurrentSharePrice(eventId);
        assertEq(price, BASE_PRICE);
    }

    function testPriceCalculationWithVeryHighValue() public {
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: 1 ether}(eventId);
        vm.stopPrank();
        
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 1000 ether); // Very high value
        vm.stopPrank();
        
        // Price should be capped at maximum multiplier
        uint256 price = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(price > BASE_PRICE);
        assertTrue(price <= BASE_PRICE * 100); // Should be capped at 100x
    }

    // ============ GAS OPTIMIZATION TESTS ============

    function testGasUsageForPriceCalculation() public {
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // Measure gas for price calculation
        uint256 gasStart = gasleft();
        streamEvents.getCurrentSharePrice(eventId);
        uint256 gasUsed = gasStart - gasleft();
        
        // Price calculation should be gas efficient
        assertTrue(gasUsed < 10000); // Should be less than 10k gas
    }

    // ============ COMPREHENSIVE PRICING SCENARIOS ============

    function testComprehensivePricingScenario() public {
        // 1. Initialize with base price
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, 0.001 ether);
        vm.stopPrank();
        
        // 2. Add multiple investors
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: 2 ether}(eventId);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        streamEvents.investInEvent{value: 3 ether}(eventId);
        vm.stopPrank();
        
        // 3. Update total value
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 20 ether);
        vm.stopPrank();
        
        // 4. Execute trades to generate momentum
        vm.startPrank(investor1);
        streamEvents.createInvestorShareSellOrder(
            eventId,
            100,
            0.002 ether,
            address(0),
            0
        );
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        streamEvents.createInvestorShareBuyOrder{value: 100 * 0.002 ether}(
            eventId,
            100,
            0.002 ether,
            address(0),
            0
        );
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        streamEvents.executeTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        vm.stopPrank();
        
        // 5. Verify final pricing
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            streamEvents.getPricingInfo(eventId);
        
        assertEq(basePrice, 0.001 ether);
        assertTrue(currentMultiplier > 10000);
        assertTrue(currentPrice > 0.001 ether);
        assertEq(totalValue, 20 ether);
        assertEq(shareSupply, 5 ether);
        
        // 6. Verify trading info
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertTrue(totalVolume > 0);
        assertTrue(momentum > 0);
        assertEq(buyRatio + sellRatio, 10000);
    }
}
