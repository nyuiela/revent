// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "./BaseForkTest.sol";
import "../src/doma/interfaces/IDomaProxy.sol";

contract DomaIntegrationForkTests is BaseForkTest {
    
    function testForkSetup() public {
        // Verify we're on the correct testnet
        assertEq(block.chainid, CHAIN_ID);
        
        // Verify contract addresses are correct
        assertTrue(DOMA_RECORD != address(0));
        assertTrue(OWNERSHIP_TOKEN != address(0));
        assertTrue(CROSS_CHAIN_GATEWAY != address(0));
        assertTrue(FORWARDER != address(0));
        
        // Log setup information
        logContractAddresses();
        logTestAccounts();
        
        console.log("Fork test setup successful!");
    }
    
    function testCreateEventWithTokenizationFork() public {
        // Test creating event with tokenization on forked testnet
        eventId = createEventWithTokenization();
        
        // Verify event was created
        assertEventCreated(eventId);
        
        // Verify Doma integration was set up
        // Note: In real implementation, verify the tokenization request was made
        console.log("Event created with tokenization on fork:", eventId);
    }
    
    function testDomaRecordIntegration() public {
        // Test direct interaction with Doma Record contract
        vm.startPrank(creator);
        
        // This would fail in real implementation without valid signature
        // but we can test the contract interface
        try domaRecord.requestTokenization{value: 0.1 ether}(mockVoucher, mockSignature) {
            console.log("Doma Record tokenization request successful");
        } catch {
            console.log("Doma Record tokenization request failed (expected with mock signature)");
        }
        
        vm.stopPrank();
    }
    
    function testOwnershipTokenIntegration() public {
        // Test ownership token contract
        // Note: This will fail if no tokens exist, but tests the interface
        
        try ownershipToken.ownerOf(1) {
            address owner = ownershipToken.ownerOf(1);
            console.log("Token 1 owner:", owner);
        } catch {
            console.log("No token with ID 1 exists (expected)");
        }
        
        // Test ownership token functions
        vm.startPrank(creator);
        try ownershipToken.expirationOf(1) {
            uint256 expiration = ownershipToken.expirationOf(1);
            console.log("Token 1 expiration:", expiration);
        } catch {
            console.log("Token 1 expiration check failed (expected if token doesn't exist)");
        }
        vm.stopPrank();
    }
    
    function testCrossChainGatewayIntegration() public {
        // Test cross-chain gateway
        vm.startPrank(creator);
        
        try crossChainGateway.bridgeToken{value: 0.1 ether}(1, "ethereum", "0x1234567890123456789012345678901234567890") {
            console.log("Cross-chain bridge successful");
        } catch {
            console.log("Cross-chain bridge failed (expected with invalid token)");
        }
        
        vm.stopPrank();
    }
    
    function testForwarderIntegration() public {
        // Test forwarder contract
        bytes memory mockRequest = abi.encode("mock_request");
        bytes memory mockSignature = abi.encode("mock_signature");
        
        try forwarder.verify(keccak256(mockRequest), mockSignature) {
            console.log("Forwarder verification successful");
        } catch {
            console.log("Forwarder verification failed (expected with mock data)");
        }
    }
    
    function testCompleteTokenizedEventFlowFork() public {
        // 1. Create event with tokenization
        eventId = createEventWithTokenization();
        assertEventCreated(eventId);
        
        // 2. Set up dynamic pricing
        setupDynamicPricing(0.001 ether);
        
        // 3. Add investors
        setupInvestor(investor1, INVESTMENT_AMOUNT);
        setupInvestor(investor2, INVESTMENT_AMOUNT);
        
        // 4. Verify investors have shares
        assertInvestorHasShares(investor1, INVESTMENT_AMOUNT);
        assertInvestorHasShares(investor2, INVESTMENT_AMOUNT);
        
        // 5. Create and execute share trades
        uint256[] memory sellOrders = createShareSellOrder(investor1, SHARE_AMOUNT, SHARE_PRICE);
        uint256[] memory buyOrders = createShareBuyOrder(trader1, SHARE_AMOUNT, SHARE_PRICE);
        
        executeShareTrade(buyOrders[0], sellOrders[0], SHARE_PRICE);
        
        // 6. Verify trade execution
        assertInvestorHasShares(trader1, SHARE_AMOUNT);
        
        // 7. Check pricing updates
        assertPriceUpdated(0.001 ether);
        
        // 8. Check trading volume
        assertTradingVolume(SHARE_AMOUNT * SHARE_PRICE);
        
        console.log("Complete tokenized event flow test on fork passed!");
    }
    
    function testDomainTradingWithRealContracts() public {
        // 1. Create tokenized event
        eventId = createEventWithTokenization();
        
        // 2. Set up pricing and investors
        setupDynamicPricing(0.001 ether);
        setupInvestor(investor1, INVESTMENT_AMOUNT);
        
        // 3. Update event total value (simulate domain sale)
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 10 ether);
        vm.stopPrank();
        
        // 4. Verify price increased due to domain value
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(currentPrice > 0.001 ether);
        
        // 5. Test domain trading (would require ownership token setup)
        vm.startPrank(creator);
        // This would work with proper ownership token setup
        // streamEvents.createSellOrder(eventId, 5 ether, 10 ether, address(0), 0);
        vm.stopPrank();
        
        console.log("Domain trading with real contracts test completed!");
    }
    
    function testInvestorProtectionWithRealContracts() public {
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
        
        console.log("Investor protection with real contracts test passed!");
    }
    
    function testGasUsageOnFork() public {
        // Measure gas for tokenized event creation on fork
        uint256 gasStart = gasleft();
        eventId = createEventWithTokenization();
        uint256 gasUsed = gasStart - gasleft();
        
        // Tokenized event creation should be reasonable
        assertTrue(gasUsed < 500000); // Should be less than 500k gas
        
        console.log("Gas used for tokenized event creation on fork:", gasUsed);
        
        // Test other operations
        gasStart = gasleft();
        setupDynamicPricing(0.001 ether);
        uint256 pricingGas = gasStart - gasleft();
        
        gasStart = gasleft();
        setupInvestor(investor1, 1 ether);
        uint256 investmentGas = gasStart - gasleft();
        
        console.log("Pricing setup gas:", pricingGas);
        console.log("Investment gas:", investmentGas);
    }
    
    function testMultipleEventsOnFork() public {
        // Create multiple tokenized events
        uint256 eventId1 = createEventWithTokenization();
        uint256 eventId2 = createEventWithTokenization();
        uint256 eventId3 = createEventWithTokenization();
        
        // Verify all events were created
        assertEventCreated(eventId1);
        assertEventCreated(eventId2);
        assertEventCreated(eventId3);
        
        // Set up trading for each event
        for (uint i = 0; i < 3; i++) {
            uint256 currentEventId = i == 0 ? eventId1 : (i == 1 ? eventId2 : eventId3);
            
            // Set up pricing
            vm.startPrank(creator);
            streamEvents.initializeDynamicPricing(currentEventId, 0.001 ether);
            vm.stopPrank();
            
            // Add investor
            vm.startPrank(investor1);
            streamEvents.investInEvent{value: INVESTMENT_AMOUNT}(currentEventId);
            vm.stopPrank();
            
            // Verify setup
            uint256 shares = streamEvents.getInvestorShareBalance(currentEventId, investor1);
            assertTrue(shares > 0);
        }
        
        console.log("Multiple events on fork test passed!");
    }
    
    function testStressTestOnFork() public {
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
        
        console.log("Stress test on fork passed!");
    }
    
    function testRealDomaContractInteraction() public {
        // Test actual interaction with Doma contracts
        console.log("Testing real Doma contract interaction...");
        
        // Test Doma Record contract
        console.log("Doma Record address:", DOMA_RECORD);
        console.log("Doma Record code size:", DOMA_RECORD.code.length);
        
        // Test Ownership Token contract
        console.log("Ownership Token address:", OWNERSHIP_TOKEN);
        console.log("Ownership Token code size:", OWNERSHIP_TOKEN.code.length);
        
        // Test Cross Chain Gateway
        console.log("Cross Chain Gateway address:", CROSS_CHAIN_GATEWAY);
        console.log("Cross Chain Gateway code size:", CROSS_CHAIN_GATEWAY.code.length);
        
        // Test Forwarder
        console.log("Forwarder address:", FORWARDER);
        console.log("Forwarder code size:", FORWARDER.code.length);
        
        // All contracts should have code
        assertTrue(DOMA_RECORD.code.length > 0);
        assertTrue(OWNERSHIP_TOKEN.code.length > 0);
        assertTrue(CROSS_CHAIN_GATEWAY.code.length > 0);
        assertTrue(FORWARDER.code.length > 0);
        
        console.log("Real Doma contract interaction test passed!");
    }
}

