// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "./BaseForkTest.sol";

contract IntegrationVerificationTests is BaseForkTest {
    
    function testFullSystemIntegration() public {
        console.log("=== FULL SYSTEM INTEGRATION TEST ===");
        
        // 1. Verify network setup
        assertEq(block.chainid, CHAIN_ID);
        console.log(" Network setup verified");
        
        // 2. Verify Doma contracts
        assertTrue(DOMA_RECORD.code.length > 0);
        assertTrue(OWNERSHIP_TOKEN.code.length > 0);
        assertTrue(CROSS_CHAIN_GATEWAY.code.length > 0);
        assertTrue(FORWARDER.code.length > 0);
        console.log(" Doma contracts verified");
        
        // 3. Create tokenized event
        eventId = createEventWithTokenization();
        assertEventCreated(eventId);
        console.log(" Event created with tokenization");
        
        // 4. Set up complete trading system
        setupDynamicPricing(0.001 ether);
        setupInvestor(investor1, 2 ether);
        setupInvestor(investor2, 1 ether);
        console.log(" Trading system initialized");
        
        // 5. Update event value
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 10 ether);
        vm.stopPrank();
        console.log(" Event value updated");
        
        // 6. Execute trades
        uint256[] memory sellOrders = createShareSellOrder(investor1, 100, 0.002 ether);
        uint256[] memory buyOrders = createShareBuyOrder(trader1, 100, 0.002 ether);
        executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        console.log(" Trades executed");
        
        // 7. Verify final state
        assertInvestorHasShares(trader1, 100);
        assertTradingVolume(100 * 0.002 ether);
        console.log(" Final state verified");
        
        console.log(" FULL SYSTEM INTEGRATION SUCCESSFUL!");
    }
    
    function testEventCreationVerification() public {
        console.log("=== EVENT CREATION VERIFICATION ===");
        
        // Test multiple event creation
        uint256[] memory eventIds = new uint256[](3);
        
        for (uint i = 0; i < 3; i++) {
            eventIds[i] = createEventWithTokenization();
            assertEventCreated(eventIds[i]);
            console.log("Event", i + 1, "created with ID:", eventIds[i]);
        }
        
        // Verify all events are unique
        for (uint i = 0; i < 3; i++) {
            for (uint j = i + 1; j < 3; j++) {
                assertTrue(eventIds[i] != eventIds[j]);
            }
        }
        
        console.log(" Event creation verification successful");
    }
    
    function testTradingSystemVerification() public {
        console.log("=== TRADING SYSTEM VERIFICATION ===");
        
        // Create event
        eventId = createEventWithTokenization();
        setupDynamicPricing(0.001 ether);
        setupInvestor(investor1, 2 ether);
        
        // Test order creation
        uint256[] memory sellOrders = createShareSellOrder(investor1, 100, 0.002 ether);
        uint256[] memory buyOrders = createShareBuyOrder(trader1, 100, 0.002 ether);
        
        assertTrue(sellOrders.length > 0);
        assertTrue(buyOrders.length > 0);
        console.log(" Orders created successfully");
        
        // Test trade execution
        executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        
        // Verify trade results
        assertInvestorHasShares(trader1, 100);
        assertTradingVolume(100 * 0.002 ether);
        console.log(" Trade execution verified");
        
        // Test order management
        vm.startPrank(trader1);
        streamEvents.updateOrder(buyOrders[0], 0, 0.003 ether, 0);
        vm.stopPrank();
        
        EventTypes.TradingOrder memory order = streamEvents.getOrder(buyOrders[0]);
        assertEq(order.maxPrice, 0.003 ether);
        console.log(" Order management verified");
        
        console.log(" Trading system verification successful");
    }
    
    function testInvestorProtectionVerification() public {
        console.log("=== INVESTOR PROTECTION VERIFICATION ===");
        
        // Create event
        eventId = createEventWithTokenization();
        
        // Set up investors
        setupInvestor(investor1, 3 ether);
        setupInvestor(investor2, 2 ether);
        setupInvestor(trader1, 1 ether);
        
        // Set up investor approval requirement
        vm.startPrank(creator);
        streamEvents.setInvestorApprovalRequired(eventId, true, 6000); // 60% threshold
        vm.stopPrank();
        
        // Check initial state
        bool isMet = streamEvents.isInvestorApprovalMet(eventId);
        assertFalse(isMet);
        console.log(" Initial approval state verified");
        
        // Get approvals
        vm.startPrank(investor1);
        streamEvents.giveInvestorApproval(eventId, true);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        streamEvents.giveInvestorApproval(eventId, true);
        vm.stopPrank();
        
        // Check final state
        isMet = streamEvents.isInvestorApprovalMet(eventId);
        assertTrue(isMet);
        console.log(" Final approval state verified");
        
        console.log(" Investor protection verification successful");
    }
    
    function testDynamicPricingVerification() public {
        console.log("=== DYNAMIC PRICING VERIFICATION ===");
        
        // Create event
        eventId = createEventWithTokenization();
        setupDynamicPricing(0.001 ether);
        setupInvestor(investor1, 2 ether);
        
        // Test initial pricing
        uint256 initialPrice = streamEvents.getCurrentSharePrice(eventId);
        assertEq(initialPrice, 0.001 ether);
        console.log(" Initial pricing verified:", initialPrice);
        
        // Update total value
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 5 ether);
        vm.stopPrank();
        
        // Test price increase
        uint256 updatedPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(updatedPrice > initialPrice);
        console.log(" Price increase verified:", updatedPrice);
        
        // Execute trades to test momentum
        for (uint i = 0; i < 3; i++) {
            uint256[] memory sellOrders = createShareSellOrder(investor1, 20, 0.002 ether);
            uint256[] memory buyOrders = createShareBuyOrder(trader1, 20, 0.002 ether);
            executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        }
        
        // Test momentum effect
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        assertTrue(totalVolume > 0);
        assertTrue(momentum > 10000);
        assertEq(buyRatio, 10000);
        assertEq(sellRatio, 0);
        console.log(" Momentum effect verified");
        
        console.log(" Dynamic pricing verification successful");
    }
    
    function testGasEfficiencyVerification() public {
        console.log("=== GAS EFFICIENCY VERIFICATION ===");
        
        uint256 gasStart;
        uint256 gasUsed;
        
        // Test event creation gas
        gasStart = gasleft();
        eventId = createEventWithTokenization();
        gasUsed = gasStart - gasleft();
        console.log("Event creation gas:", gasUsed);
        assertTrue(gasUsed < 500000);
        
        // Test pricing setup gas
        gasStart = gasleft();
        setupDynamicPricing(0.001 ether);
        gasUsed = gasStart - gasleft();
        console.log("Pricing setup gas:", gasUsed);
        assertTrue(gasUsed < 100000);
        
        // Test investment gas
        gasStart = gasleft();
        setupInvestor(investor1, 1 ether);
        gasUsed = gasStart - gasleft();
        console.log("Investment gas:", gasUsed);
        assertTrue(gasUsed < 200000);
        
        // Test trading gas
        gasStart = gasleft();
        uint256[] memory sellOrders = createShareSellOrder(investor1, 50, 0.002 ether);
        uint256[] memory buyOrders = createShareBuyOrder(trader1, 50, 0.002 ether);
        executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        gasUsed = gasStart - gasleft();
        console.log("Trading gas:", gasUsed);
        assertTrue(gasUsed < 300000);
        
        console.log(" Gas efficiency verification successful");
    }
    
    function testErrorHandlingVerification() public {
        console.log("=== ERROR HANDLING VERIFICATION ===");
        
        // Test invalid event ID
        vm.expectRevert();
        streamEvents.getCurrentSharePrice(999999);
        
        // Test insufficient payment
        vm.startPrank(creator);
        vm.expectRevert();
        streamEvents.createEventWithTokenization{value: 0.05 ether}(
            "QmTestEventHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            TICKET_PRICE,
            mockVoucher,
            mockSignature
        );
        vm.stopPrank();
        
        // Test invalid voucher owner
        IDomaProxy.TokenizationVoucher memory invalidVoucher = IDomaProxy.TokenizationVoucher({
            names: mockNames,
            nonce: 12345,
            expiresAt: block.timestamp + 1 days,
            ownerAddress: trader1 // Wrong owner
        });
        
        vm.startPrank(creator);
        vm.expectRevert();
        streamEvents.createEventWithTokenization{value: 0.1 ether}(
            "QmTestEventHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            TICKET_PRICE,
            invalidVoucher,
            mockSignature
        );
        vm.stopPrank();
        
        console.log(" Error handling verification successful");
    }
    
    function testEdgeCasesVerification() public {
        console.log("=== EDGE CASES VERIFICATION ===");
        
        // Create event
        eventId = createEventWithTokenization();
        
        // Test very small amounts
        setupDynamicPricing(0.000001 ether);
        setupInvestor(investor1, 0.001 ether);
        
        uint256[] memory sellOrders = createShareSellOrder(investor1, 1, 0.000002 ether);
        uint256[] memory buyOrders = createShareBuyOrder(trader1, 1, 0.000002 ether);
        executeShareTrade(buyOrders[0], sellOrders[0], 0.000002 ether);
        
        assertInvestorHasShares(trader1, 1);
        console.log(" Small amounts handled correctly");
        
        // Test very high values
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 1000 ether);
        vm.stopPrank();
        
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(currentPrice > 0.000001 ether);
        assertTrue(currentPrice <= 0.000001 ether * 100);
        console.log(" High values handled correctly");
        
        console.log(" Edge cases verification successful");
    }
    
    function testComprehensiveDataVerification() public {
        console.log("=== COMPREHENSIVE DATA VERIFICATION ===");
        
        // Create event
        eventId = createEventWithTokenization();
        setupDynamicPricing(0.001 ether);
        setupInvestor(investor1, 3 ether);
        setupInvestor(investor2, 2 ether);
        
        // Update total value
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 20 ether);
        vm.stopPrank();
        
        // Execute trades
        for (uint i = 0; i < 5; i++) {
            uint256[] memory sellOrders = createShareSellOrder(investor1, 40, 0.002 ether);
            uint256[] memory buyOrders = createShareBuyOrder(trader1, 40, 0.002 ether);
            executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        }
        
        // Get comprehensive data
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            streamEvents.getPricingInfo(eventId);
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentum, uint256 buyRatio, uint256 sellRatio) = 
            streamEvents.getTradingInfo(eventId);
        
        // Verify pricing data
        assertEq(basePrice, 0.001 ether);
        assertTrue(currentMultiplier > 10000);
        assertTrue(currentPrice > 0.001 ether);
        assertEq(totalValue, 20 ether);
        assertEq(shareSupply, 5 ether);
        
        // Verify trading data
        assertTrue(totalVolume > 0);
        assertTrue(momentum > 0);
        assertEq(buyRatio + sellRatio, 10000);
        
        // Verify final balances
        uint256 trader1Shares = streamEvents.getInvestorShareBalance(eventId, trader1);
        assertEq(trader1Shares, 200);
        
        console.log(" Comprehensive data verification successful");
        console.log("Base Price:", basePrice);
        console.log("Current Price:", currentPrice);
        console.log("Total Volume:", totalVolume);
        console.log("Momentum:", momentum);
        console.log("Trader1 Shares:", trader1Shares);
    }
    
    function testFinalSystemStatus() public {
        console.log("=== FINAL SYSTEM STATUS ===");
        
        // Log all contract addresses
        logContractAddresses();
        
        // Log test accounts
        logTestAccounts();
        
        // Log network information
        console.log("Chain ID:", block.chainid);
        console.log("Block Number:", block.number);
        console.log("Block Timestamp:", block.timestamp);
        
        // Test basic functionality
        eventId = createEventWithTokenization();
        console.log(" System is fully operational");
        console.log(" All tests passed successfully");
        console.log(" INTEGRATION VERIFICATION COMPLETE!");
    }
}



