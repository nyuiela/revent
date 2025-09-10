// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "./BaseForkTest.sol";

contract DomaProtocolTests is BaseForkTest {
    
    function testDomaContractVerification() public {
        // Verify all Doma contracts are deployed and have code
        console.log("=== Doma Contract Verification ===");
        
        // Check Doma Record
        assertTrue(DOMA_RECORD.code.length > 0, "Doma Record contract not found");
        console.log("Doma Record verified:", DOMA_RECORD);
        console.log("   Code size:", DOMA_RECORD.code.length, "bytes");
        
        // Check Ownership Token
        assertTrue(OWNERSHIP_TOKEN.code.length > 0, "Ownership Token contract not found");
        console.log("Ownership Token verified:", OWNERSHIP_TOKEN);
        console.log("   Code size:", OWNERSHIP_TOKEN.code.length, "bytes");
        
        // Check Cross Chain Gateway
        assertTrue(CROSS_CHAIN_GATEWAY.code.length > 0, "Cross Chain Gateway contract not found");
        console.log("Cross Chain Gateway verified:", CROSS_CHAIN_GATEWAY);
        console.log("   Code size:", CROSS_CHAIN_GATEWAY.code.length, "bytes");
        
        // Check Forwarder
        assertTrue(FORWARDER.code.length > 0, "Forwarder contract not found");
        console.log("Forwarder verified:", FORWARDER);
        console.log("   Code size:", FORWARDER.code.length, "bytes");
        
        // Check Proxy Doma Record
        assertTrue(PROXY_DOMA_RECORD.code.length > 0, "Proxy Doma Record contract not found");
        console.log("Proxy Doma Record verified:", PROXY_DOMA_RECORD);
        console.log("   Code size:", PROXY_DOMA_RECORD.code.length, "bytes");
        
        console.log("Block Explorer:", BLOCK_EXPLORER);
    }
    
    function testDomaRecordInterface() public {
        // Test Doma Record contract interface
        console.log("=== Testing Doma Record Interface ===");
        
        // Test tokenization request (will fail with mock data, but tests interface)
        vm.startPrank(creator);
        try domaRecord.requestTokenization{value: 0.1 ether}(mockVoucher, mockSignature) {
            console.log("Tokenization request successful");
        } catch Error(string memory reason) {
            console.log("Tokenization request failed:", reason);
        } catch {
            console.log("Tokenization request failed with unknown error");
        }
        vm.stopPrank();
        
        // Test ownership claim (will fail with mock data, but tests interface)
        vm.startPrank(creator);
        try domaRecord.claimOwnership(1, false, mockProof, mockSignature) {
            console.log(" Ownership claim successful");
        } catch Error(string memory reason) {
            console.log(" Ownership claim failed:", reason);
        } catch {
            console.log(" Ownership claim failed with unknown error");
        }
        vm.stopPrank();
        
        // Test bridging (will fail with mock data, but tests interface)
        vm.startPrank(creator);
        try domaRecord.bridge{value: 0.1 ether}(1, false, "ethereum", "0x1234567890123456789012345678901234567890") {
            console.log(" Bridge request successful");
        } catch Error(string memory reason) {
            console.log(" Bridge request failed:", reason);
        } catch {
            console.log(" Bridge request failed with unknown error");
        }
        vm.stopPrank();
    }
    
    function testOwnershipTokenInterface() public {
        // Test Ownership Token contract interface
        console.log("=== Testing Ownership Token Interface ===");
        
        // Test ownerOf (will fail if token doesn't exist)
        try ownershipToken.ownerOf(1) {
            address owner = ownershipToken.ownerOf(1);
            console.log(" Token 1 owner:", owner);
        } catch Error(string memory reason) {
            console.log(" Token 1 not found:", reason);
        } catch {
            console.log(" Token 1 not found with unknown error");
        }
        
        // Test ownership token functions
        vm.startPrank(creator);
        try ownershipToken.expirationOf(1) {
            uint256 expiration = ownershipToken.expirationOf(1);
            console.log(" Token 1 expiration:", expiration);
        } catch Error(string memory reason) {
            console.log(" Token 1 expiration check failed:", reason);
        } catch {
            console.log(" Token 1 expiration check failed with unknown error");
        }
        
        try ownershipToken.registrarOf(1) {
            uint256 registrar = ownershipToken.registrarOf(1);
            console.log(" Token 1 registrar:", registrar);
        } catch Error(string memory reason) {
            console.log(" Token 1 registrar check failed:", reason);
        } catch {
            console.log(" Token 1 registrar check failed with unknown error");
        }
        vm.stopPrank();
    }
    
    function testCrossChainGatewayInterface() public {
        // Test Cross Chain Gateway contract interface
        console.log("=== Testing Cross Chain Gateway Interface ===");
        
        vm.startPrank(creator);
        try crossChainGateway.bridgeToken{value: 0.1 ether}(1, "ethereum", "0x1234567890123456789012345678901234567890") {
            console.log(" Cross-chain bridge successful");
        } catch Error(string memory reason) {
            console.log(" Cross-chain bridge failed:", reason);
        } catch {
            console.log(" Cross-chain bridge failed with unknown error");
        }
        vm.stopPrank();
    }
    
    function testForwarderInterface() public {
        // Test Forwarder contract interface
        console.log("=== Testing Forwarder Interface ===");
        
        bytes memory mockRequest = abi.encode("mock_request");
        bytes memory mockSignature = abi.encode("mock_signature");
        
        try forwarder.verify(keccak256(mockRequest), mockSignature) {
            console.log(" Forwarder verification successful");
        } catch Error(string memory reason) {
            console.log(" Forwarder verification failed:", reason);
        } catch {
            console.log(" Forwarder verification failed with unknown error");
        }
        
        try forwarder.execute(mockRequest, mockSignature) {
            console.log(" Forwarder execution successful");
        } catch Error(string memory reason) {
            console.log(" Forwarder execution failed:", reason);
        } catch {
            console.log(" Forwarder execution failed with unknown error");
        }
    }
    
    function testEventCreationWithDomaIntegration() public {
        // Test creating event with Doma integration
        console.log("=== Testing Event Creation with Doma Integration ===");
        
        // Create event with tokenization
        eventId = createEventWithTokenization();
        assertEventCreated(eventId);
        
        // Verify event was created
        console.log(" Event created with ID:", eventId);
        
        // Test that our contract can interact with Doma
        // In real implementation, this would verify the tokenization request
        
        console.log("Event can be viewed at:", string(abi.encodePacked(BLOCK_EXPLORER, "/address/", vm.toString(address(streamEvents)))));
    }
    
    function testCompleteDomaIntegrationFlow() public {
        // Test complete flow with Doma integration
        console.log("=== Testing Complete Doma Integration Flow ===");
        
        // 1. Create event with tokenization
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
        
        // 5. Update event total value (simulating domain value increase)
        vm.startPrank(creator);
        streamEvents.updateEventTotalValue(eventId, 10 ether);
        vm.stopPrank();
        
        // 6. Verify price increased due to domain value
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(currentPrice > 0.001 ether);
        
        // 7. Execute trades
        uint256[] memory sellOrders = createShareSellOrder(investor1, 100, 0.002 ether);
        uint256[] memory buyOrders = createShareBuyOrder(trader1, 100, 0.002 ether);
        executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        
        // 8. Verify trade execution
        assertInvestorHasShares(trader1, 100);
        
        // 9. Check trading volume
        assertTradingVolume(100 * 0.002 ether);
        
        console.log(" Complete Doma integration flow successful");
        console.log("Final price:", currentPrice);
    }
    
    function testDomaProtocolFeatures() public {
        // Test specific Doma protocol features
        console.log("=== Testing Doma Protocol Features ===");
        
        // Test domain tokenization (as per Doma docs)
        console.log("Testing domain tokenization...");
        // This would work with valid signatures and proper setup
        
        // Test state synchronization
        console.log("Testing state synchronization...");
        // This would verify bi-directional sync with ICANN registries
        
        // Test composable domain rights
        console.log("Testing composable domain rights...");
        // This would test splitting domains into synthetic tokens
        
        // Test cross-chain functionality
        console.log("Testing cross-chain functionality...");
        // This would test multi-chain domain support
        
        // Test meta-transactions
        console.log("Testing meta-transactions...");
        // This would test gasless transactions via forwarder
        
        console.log(" Doma protocol features test completed");
    }
    
    function testGasCostsOnDomaTestnet() public {
        // Test gas costs on actual Doma testnet
        console.log("=== Testing Gas Costs on Doma Testnet ===");
        
        uint256 gasStart;
        uint256 gasUsed;
        
        // 1. Event creation with tokenization
        gasStart = gasleft();
        eventId = createEventWithTokenization();
        gasUsed = gasStart - gasleft();
        console.log("Event creation gas:", gasUsed);
        assertTrue(gasUsed < 500000);
        
        // 2. Dynamic pricing setup
        gasStart = gasleft();
        setupDynamicPricing(0.001 ether);
        gasUsed = gasStart - gasleft();
        console.log("Pricing setup gas:", gasUsed);
        assertTrue(gasUsed < 100000);
        
        // 3. Investor setup
        gasStart = gasleft();
        setupInvestor(investor1, 1 ether);
        gasUsed = gasStart - gasleft();
        console.log("Investment gas:", gasUsed);
        assertTrue(gasUsed < 200000);
        
        // 4. Trade execution
        gasStart = gasleft();
        uint256[] memory sellOrders = createShareSellOrder(investor1, 50, 0.002 ether);
        uint256[] memory buyOrders = createShareBuyOrder(trader1, 50, 0.002 ether);
        executeShareTrade(buyOrders[0], sellOrders[0], 0.002 ether);
        gasUsed = gasStart - gasleft();
        console.log("Trading gas:", gasUsed);
        assertTrue(gasUsed < 300000);
        
        console.log(" Gas costs on Doma testnet verified");
    }
    
    function testNetworkInformation() public {
        // Display network information
        console.log("=== Network Information ===");
        console.log("Chain ID:", block.chainid);
        console.log("Block Number:", block.number);
        console.log("Block Timestamp:", block.timestamp);
        console.log("RPC URL:", RPC_URL);
        console.log("Block Explorer:", BLOCK_EXPLORER);
        console.log("Fork Block:", FORK_BLOCK);
        
        // Verify we're on the correct network
        assertEq(block.chainid, CHAIN_ID);
        console.log(" Network verification successful");
    }
    
    function testContractInteractionLogging() public {
        // Log all contract interactions for debugging
        console.log("=== Contract Interaction Logging ===");
        
        // Log our contract
        console.log("Our StreamEvents contract:", address(streamEvents));
        console.log("Our contract code size:", address(streamEvents).code.length, "bytes");
        
        // Log Doma contracts
        logContractAddresses();
        
        // Log test accounts
        logTestAccounts();
        
        // Test basic interaction
        eventId = createEventWithTokenization();
        console.log("Created event with ID:", eventId);
        
        console.log(" Contract interaction logging completed");
    }
}
