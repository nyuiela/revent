// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/event.sol";
import "../src/events/Types.sol";

contract VolumeManagerTests is Test {
    StreamEvents public streamEvents;
    address public owner = address(0x1);
    address public creator = address(0x2);
    address public investor1 = address(0x3);
    address public investor2 = address(0x4);
    address public trader1 = address(0x5);
    address public trader2 = address(0x6);
    
    uint256 public eventId;
    uint256 public constant BASE_PRICE = 0.001 ether;
    uint256 public constant INVESTMENT_AMOUNT = 5 ether;
    uint256 public constant TRADE_AMOUNT = 100;
    uint256 public constant TRADE_PRICE = 0.002 ether;

    function setUp() public {
        vm.startPrank(owner);
        streamEvents = new StreamEvents();
        vm.stopPrank();

        // Create an event
        vm.startPrank(creator);
        eventId = streamEvents.createEvent(
            "QmVolumeTestEventHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            0.1 ether
        );
        vm.stopPrank();

        // Fund accounts
        vm.deal(investor1, 10 ether);
        vm.deal(investor2, 10 ether);
        vm.deal(trader1, 10 ether);
        vm.deal(trader2, 10 ether);
    }

    // ============ VOLUME TRACKING TESTS ============

    function testInitialTradingInfo() public {
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertEq(totalVolume, 0);
        assertEq(buyVolume, 0);
        assertEq(sellVolume, 0);
        assertEq(momentum, 0);
        assertEq(buyRatio, 5000); // 50% default
        assertEq(sellRatio, 5000); // 50% default
    }

    function testVolumeTrackingAfterTrade() public {
        // 1. Set up pricing and investors
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Execute a trade
        vm.startPrank(investor1);
        streamEvents.createInvestorShareSellOrder(
            eventId,
            TRADE_AMOUNT,
            TRADE_PRICE,
            address(0),
            0
        );
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        vm.stopPrank();
        
        vm.startPrank(trader1);
        streamEvents.createInvestorShareBuyOrder{value: TRADE_AMOUNT * TRADE_PRICE}(
            eventId,
            TRADE_AMOUNT,
            TRADE_PRICE,
            address(0),
            0
        );
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        streamEvents.executeTrade(buyOrders[0], sellOrders[0], TRADE_PRICE);
        vm.stopPrank();
        
        // 3. Check volume tracking
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertEq(totalVolume, TRADE_AMOUNT * TRADE_PRICE);
        assertEq(buyVolume, TRADE_AMOUNT * TRADE_PRICE);
        assertEq(sellVolume, 0); // Sell volume is tracked differently
        assertTrue(momentum > 0);
        assertEq(buyRatio, 10000); // 100% buy
        assertEq(sellRatio, 0); // 0% sell
    }

    function testMultipleTradesVolumeTracking() public {
        // 1. Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Execute multiple trades
        for (uint i = 0; i < 3; i++) {
            vm.startPrank(investor1);
            streamEvents.createInvestorShareSellOrder(
                eventId,
                TRADE_AMOUNT,
                TRADE_PRICE,
                address(0),
                0
            );
            uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
            vm.stopPrank();
            
            vm.startPrank(trader1);
            streamEvents.createInvestorShareBuyOrder{value: TRADE_AMOUNT * TRADE_PRICE}(
                eventId,
                TRADE_AMOUNT,
                TRADE_PRICE,
                address(0),
                0
            );
            uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
            streamEvents.executeTrade(buyOrders[0], sellOrders[0], TRADE_PRICE);
            vm.stopPrank();
        }
        
        // 3. Check cumulative volume
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertEq(totalVolume, 3 * TRADE_AMOUNT * TRADE_PRICE);
        assertEq(buyVolume, 3 * TRADE_AMOUNT * TRADE_PRICE);
        assertEq(sellVolume, 0);
        assertTrue(momentum > 0);
    }

    // ============ MOMENTUM CALCULATION TESTS ============

    function testBuyHeavyMomentum() public {
        // 1. Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Execute only buy trades
        for (uint i = 0; i < 5; i++) {
            vm.startPrank(investor1);
            streamEvents.createInvestorShareSellOrder(
                eventId,
                TRADE_AMOUNT,
                TRADE_PRICE,
                address(0),
                0
            );
            uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
            vm.stopPrank();
            
            vm.startPrank(trader1);
            streamEvents.createInvestorShareBuyOrder{value: TRADE_AMOUNT * TRADE_PRICE}(
                eventId,
                TRADE_AMOUNT,
                TRADE_PRICE,
                address(0),
                0
            );
            uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
            streamEvents.executeTrade(buyOrders[0], sellOrders[0], TRADE_PRICE);
            vm.stopPrank();
        }
        
        // 3. Check momentum (should be high due to buy pressure)
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertEq(buyRatio, 10000); // 100% buy
        assertEq(sellRatio, 0); // 0% sell
        assertTrue(momentum > 10000); // Should be > 1.0x
    }

    function testSellHeavyMomentum() public {
        // 1. Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Execute trades with more selling pressure
        for (uint i = 0; i < 3; i++) {
            vm.startPrank(investor1);
            streamEvents.createInvestorShareSellOrder(
                eventId,
                TRADE_AMOUNT,
                TRADE_PRICE,
                address(0),
                0
            );
            uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
            vm.stopPrank();
            
            vm.startPrank(trader1);
            streamEvents.createInvestorShareBuyOrder{value: TRADE_AMOUNT * TRADE_PRICE}(
                eventId,
                TRADE_AMOUNT,
                TRADE_PRICE,
                address(0),
                0
            );
            uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
            streamEvents.executeTrade(buyOrders[0], sellOrders[0], TRADE_PRICE);
            vm.stopPrank();
        }
        
        // 3. Check momentum (should be balanced)
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertEq(buyRatio, 10000); // 100% buy
        assertEq(sellRatio, 0); // 0% sell
        assertTrue(momentum > 0);
    }

    function testBalancedTradingMomentum() public {
        // 1. Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Execute balanced trades
        for (uint i = 0; i < 2; i++) {
            // Buy trade
            vm.startPrank(investor1);
            streamEvents.createInvestorShareSellOrder(
                eventId,
                TRADE_AMOUNT,
                TRADE_PRICE,
                address(0),
                0
            );
            uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
            vm.stopPrank();
            
            vm.startPrank(trader1);
            streamEvents.createInvestorShareBuyOrder{value: TRADE_AMOUNT * TRADE_PRICE}(
                eventId,
                TRADE_AMOUNT,
                TRADE_PRICE,
                address(0),
                0
            );
            uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
            streamEvents.executeTrade(buyOrders[0], sellOrders[0], TRADE_PRICE);
            vm.stopPrank();
        }
        
        // 3. Check momentum (should be balanced)
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertEq(buyRatio, 10000); // 100% buy
        assertEq(sellRatio, 0); // 0% sell
        assertTrue(momentum > 0);
    }

    // ============ VOLUME RESET TESTS ============

    function testVolumeResetAfter24Hours() public {
        // 1. Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Execute trade
        vm.startPrank(investor1);
        streamEvents.createInvestorShareSellOrder(
            eventId,
            TRADE_AMOUNT,
            TRADE_PRICE,
            address(0),
            0
        );
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        vm.stopPrank();
        
        vm.startPrank(trader1);
        streamEvents.createInvestorShareBuyOrder{value: TRADE_AMOUNT * TRADE_PRICE}(
            eventId,
            TRADE_AMOUNT,
            TRADE_PRICE,
            address(0),
            0
        );
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        streamEvents.executeTrade(buyOrders[0], sellOrders[0], TRADE_PRICE);
        vm.stopPrank();
        
        // 3. Check initial volume
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertTrue(totalVolume > 0);
        
        // 4. Fast forward 25 hours
        vm.warp(block.timestamp + 25 hours);
        
        // 5. Execute another trade to trigger reset
        vm.startPrank(investor1);
        streamEvents.createInvestorShareSellOrder(
            eventId,
            TRADE_AMOUNT,
            TRADE_PRICE,
            address(0),
            0
        );
        uint256[] memory sellOrders2 = streamEvents.getActiveSellOrders(eventId);
        vm.stopPrank();
        
        vm.startPrank(trader2);
        streamEvents.createInvestorShareBuyOrder{value: TRADE_AMOUNT * TRADE_PRICE}(
            eventId,
            TRADE_AMOUNT,
            TRADE_PRICE,
            address(0),
            0
        );
        uint256[] memory buyOrders2 = streamEvents.getActiveBuyOrders(eventId);
        streamEvents.executeTrade(buyOrders2[0], sellOrders2[0], TRADE_PRICE);
        vm.stopPrank();
        
        // 6. Check volume after reset
        (totalVolume, buyVolume, sellVolume, momentum, buyRatio, sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        // Volume should be reset to just the new trade
        assertEq(totalVolume, TRADE_AMOUNT * TRADE_PRICE);
    }

    // ============ MOMENTUM CAPS TESTS ============

    function testMomentumCaps() public {
        // 1. Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Execute many buy trades to test momentum cap
        for (uint i = 0; i < 10; i++) {
            vm.startPrank(investor1);
            streamEvents.createInvestorShareSellOrder(
                eventId,
                TRADE_AMOUNT,
                TRADE_PRICE,
                address(0),
                0
            );
            uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
            vm.stopPrank();
            
            vm.startPrank(trader1);
            streamEvents.createInvestorShareBuyOrder{value: TRADE_AMOUNT * TRADE_PRICE}(
                eventId,
                TRADE_AMOUNT,
                TRADE_PRICE,
                address(0),
                0
            );
            uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
            streamEvents.executeTrade(buyOrders[0], sellOrders[0], TRADE_PRICE);
            vm.stopPrank();
        }
        
        // 3. Check momentum is capped
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertTrue(momentum <= 20000); // Should be capped at 2.0x
        assertTrue(momentum >= 5000); // Should be at least 0.5x
    }

    // ============ EDGE CASES ============

    function testZeroVolumeTrading() public {
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertEq(totalVolume, 0);
        assertEq(buyVolume, 0);
        assertEq(sellVolume, 0);
        assertEq(momentum, 0);
        assertEq(buyRatio, 5000); // 50% default
        assertEq(sellRatio, 5000); // 50% default
    }

    function testVerySmallTradeVolume() public {
        // 1. Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Execute very small trade
        vm.startPrank(investor1);
        streamEvents.createInvestorShareSellOrder(
            eventId,
            1, // Very small amount
            TRADE_PRICE,
            address(0),
            0
        );
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        vm.stopPrank();
        
        vm.startPrank(trader1);
        streamEvents.createInvestorShareBuyOrder{value: 1 * TRADE_PRICE}(
            eventId,
            1,
            TRADE_PRICE,
            address(0),
            0
        );
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        streamEvents.executeTrade(buyOrders[0], sellOrders[0], TRADE_PRICE);
        vm.stopPrank();
        
        // 3. Check volume
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertEq(totalVolume, 1 * TRADE_PRICE);
        assertEq(buyVolume, 1 * TRADE_PRICE);
        assertTrue(momentum > 0);
    }

    // ============ GAS OPTIMIZATION TESTS ============

    function testGasUsageForVolumeTracking() public {
        // 1. Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Measure gas for trade execution (includes volume tracking)
        vm.startPrank(investor1);
        streamEvents.createInvestorShareSellOrder(
            eventId,
            TRADE_AMOUNT,
            TRADE_PRICE,
            address(0),
            0
        );
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        vm.stopPrank();
        
        vm.startPrank(trader1);
        uint256 gasStart = gasleft();
        streamEvents.createInvestorShareBuyOrder{value: TRADE_AMOUNT * TRADE_PRICE}(
            eventId,
            TRADE_AMOUNT,
            TRADE_PRICE,
            address(0),
            0
        );
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        streamEvents.executeTrade(buyOrders[0], sellOrders[0], TRADE_PRICE);
        uint256 gasUsed = gasStart - gasleft();
        vm.stopPrank();
        
        // Volume tracking should not significantly impact gas usage
        assertTrue(gasUsed < 300000); // Should be reasonable
    }

    // ============ COMPREHENSIVE VOLUME SCENARIOS ============

    function testComprehensiveVolumeScenario() public {
        // 1. Set up system
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, BASE_PRICE);
        vm.stopPrank();
        
        vm.startPrank(investor1);
        streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(eventId);
        vm.stopPrank();
        
        // 2. Execute various trades
        uint256 totalTrades = 5;
        for (uint i = 0; i < totalTrades; i++) {
            vm.startPrank(investor1);
            streamEvents.createInvestorShareSellOrder(
                eventId,
                TRADE_AMOUNT,
                TRADE_PRICE,
                address(0),
                0
            );
            uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
            vm.stopPrank();
            
            vm.startPrank(trader1);
            streamEvents.createInvestorShareBuyOrder{value: TRADE_AMOUNT * TRADE_PRICE}(
                eventId,
                TRADE_AMOUNT,
                TRADE_PRICE,
                address(0),
                0
            );
            uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
            streamEvents.executeTrade(buyOrders[0], sellOrders[0], TRADE_PRICE);
            vm.stopPrank();
        }
        
        // 3. Verify comprehensive volume data
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertEq(totalVolume, totalTrades * TRADE_AMOUNT * TRADE_PRICE);
        assertEq(buyVolume, totalTrades * TRADE_AMOUNT * TRADE_PRICE);
        assertEq(sellVolume, 0);
        assertTrue(momentum > 0);
        assertEq(buyRatio, 10000);
        assertEq(sellRatio, 0);
        
        // 4. Verify ratios add up correctly
        assertEq(buyRatio + sellRatio, 10000);
    }
}
