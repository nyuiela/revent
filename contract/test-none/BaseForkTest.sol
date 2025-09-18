// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/event.sol";
import "../src/events/Types.sol";
import "../src/doma/interfaces/IDomaProxy.sol";
import "../src/doma/interfaces/IOwnershipToken.sol";
import "./mocks/MockDomaProxy.sol";

// Doma Protocol Interfaces
interface IDomaRecord {
    function requestTokenization(IDomaProxy.TokenizationVoucher calldata voucher, bytes calldata signature) external payable;
    function claimOwnership(uint256 tokenId, bool isSynthetic, IDomaProxy.ProofOfContactsVoucher calldata proof, bytes calldata signature) external payable;
    function bridge(uint256 tokenId, bool isSynthetic, string calldata targetChainId, string calldata targetOwnerAddress) external payable;
    function requestDetokenization(uint256 tokenId, bool isSynthetic) external;
}

interface ICrossChainGateway {
    function bridgeToken(uint256 tokenId, string calldata targetChainId, string calldata targetOwnerAddress) external payable;
}

interface IForwarder {
    function verify(bytes32 structHash, bytes calldata signature) external view returns (bool);
    function execute(bytes calldata request, bytes calldata signature) external payable;
}

contract BaseForkTest is Test {
    // Doma Protocol Contract Addresses (Testnet)
    address constant DOMA_RECORD = 0xF6A92E0f8bEa4174297B0219d9d47fEe335f84f8;
    address constant CROSS_CHAIN_GATEWAY = 0xCE1476C791ff195e462632bf9Eb22f3d3cA07388;
    address constant FORWARDER = 0xf17beC16794e018E2F0453a1282c3DA3d121f410;
    address constant OWNERSHIP_TOKEN = 0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f;
    address constant PROXY_DOMA_RECORD = 0xb1508299A01c02aC3B70c7A8B0B07105aaB29E99;
    
    // Mock contracts for local testing
    MockDomaProxy public mockDomaProxy;
    
    // Testnet Configuration
    string constant RPC_URL = "https://rpc-testnet.doma.xyz";
    uint256 constant CHAIN_ID = 97476;
    uint256 constant FORK_BLOCK = 1000000; // Adjust as needed
    string constant BLOCK_EXPLORER = "https://explorer-doma-dev-ix58nm4rnd.t.conduit.xyz";
    
    // Test Accounts
    address public owner = address(0x1);
    address public creator = address(0x2);
    address public investor1 = address(0x3);
    address public investor2 = address(0x4);
    address public trader1 = address(0x5);
    address public trader2 = address(0x6);
    address public registrar = address(0x7);
    
    // Contract Instances
    StreamEvents public streamEvents;
    IDomaRecord public domaRecord;
    IOwnershipToken public ownershipToken;
    ICrossChainGateway public crossChainGateway;
    IForwarder public forwarder;
    
    // Test Constants
    uint256 public constant TICKET_PRICE = 0.1 ether;
    uint256 public constant INVESTMENT_AMOUNT = 1 ether;
    uint256 public constant SHARE_AMOUNT = 100;
    uint256 public constant SHARE_PRICE = 0.01 ether;
    
    // Mock Data
    IDomaProxy.NameInfo[] public mockNames;
    IDomaProxy.TokenizationVoucher public mockVoucher;
    IDomaProxy.ProofOfContactsVoucher public mockProof;
    bytes public mockSignature;
    
    // Test State
    uint256 public eventId;
    uint256 public tokenId;
    
    function setUp() public {
        // Only fork if not running locally
        if (block.chainid != 31337) {
            // Fork the Doma testnet
            vm.createFork(RPC_URL, FORK_BLOCK);
            
            // Verify we're on the correct chain
            assertEq(block.chainid, CHAIN_ID);
        }
        
        // Initialize contract instances
        domaRecord = IDomaRecord(DOMA_RECORD);
        ownershipToken = IOwnershipToken(OWNERSHIP_TOKEN);
        crossChainGateway = ICrossChainGateway(CROSS_CHAIN_GATEWAY);
        forwarder = IForwarder(FORWARDER);
        
        // Deploy our contracts
        vm.startPrank(owner);
        streamEvents = new StreamEvents();
        
        // Deploy mock Doma proxy for local testing
        mockDomaProxy = new MockDomaProxy();
        
        // Set up Doma integration (use mock for local testing)
        address domaProxyAddress = block.chainid == 31337 ? address(mockDomaProxy) : PROXY_DOMA_RECORD;
        streamEvents.setDomaConfig(domaProxyAddress, OWNERSHIP_TOKEN, FORWARDER, 0, "doma");
        
        // Set up proper order value limits for testing
        streamEvents.setOrderValueLimits(0.001 ether, 1000 ether);
        streamEvents.setTradingFee(100); // 1%
        streamEvents.setOrderExpirationTime(7 days);
        
        vm.stopPrank();
        
        // Fund test accounts
        vm.deal(creator, 10 ether);
        vm.deal(investor1, 20 ether);
        vm.deal(investor2, 20 ether);
        vm.deal(trader1, 20 ether);
        vm.deal(trader2, 20 ether);
        vm.deal(registrar, 10 ether);
        
        // Set up mock Doma data
        _setupMockDomaData();
        
        console.log("BaseForkTest setup complete");
        console.log("Chain ID:", block.chainid);
        console.log("Doma Record:", DOMA_RECORD);
        console.log("Ownership Token:", OWNERSHIP_TOKEN);
    }
    
    function _setupMockDomaData() internal {
        // Create mock name info
        mockNames.push(IDomaProxy.NameInfo({
            sld: "testevent",
            tld: "eth"
        }));
        
        // Create mock tokenization voucher
        mockVoucher = IDomaProxy.TokenizationVoucher({
            names: mockNames,
            nonce: 12345,
            expiresAt: block.timestamp + 1 days,
            ownerAddress: creator
        });
        
        // Create mock proof of contacts voucher
        mockProof = IDomaProxy.ProofOfContactsVoucher({
            registrantHandle: 67890,
            proofSource: IDomaProxy.ProofOfContactsSource.Registrar,
            nonce: 54321,
            expiresAt: block.timestamp + 1 days
        });
        
        // Create mock signature (in real implementation, this would be a valid signature)
        mockSignature = abi.encodePacked("mock_signature_for_testing");
    }
    
    // ============ HELPER FUNCTIONS ============
    
    function createEventWithTokenization() internal returns (uint256) {
        vm.startPrank(creator);
        uint256 newEventId = streamEvents.createEventWithTokenization{value: 0.1 ether}(
            "QmTestEventHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            TICKET_PRICE,
            mockVoucher,
            mockSignature
        );
        vm.stopPrank();
        return newEventId;
    }
    
    function createEventWithoutTokenization() internal returns (uint256) {
        vm.startPrank(creator);
        uint256 newEventId = streamEvents.createEvent(
            "QmTestEventHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            TICKET_PRICE
        );
        vm.stopPrank();
        return newEventId;
    }
    
    function setupInvestor(address investor, uint256 amount) internal {
        vm.startPrank(investor);
        streamEvents.investInEvent{value: amount}(eventId);
        vm.stopPrank();
    }
    
    function setupDynamicPricing(uint256 basePrice) internal {
        vm.startPrank(creator);
        streamEvents.initializeDynamicPricing(eventId, basePrice);
        vm.stopPrank();
    }
    
    function createShareSellOrder(address seller, uint256 shareAmount, uint256 pricePerShare) internal returns (uint256[] memory) {
        vm.startPrank(seller);
        streamEvents.createInvestorShareSellOrder(
            eventId,
            shareAmount,
            pricePerShare,
            address(0),
            0
        );
        uint256[] memory sellOrders = streamEvents.getActiveSellOrders(eventId);
        vm.stopPrank();
        return sellOrders;
    }
    
    function createShareBuyOrder(address buyer, uint256 shareAmount, uint256 pricePerShare) internal returns (uint256[] memory) {
        vm.startPrank(buyer);
        streamEvents.createInvestorShareBuyOrder{value: shareAmount * pricePerShare}(
            eventId,
            shareAmount,
            pricePerShare,
            address(0),
            0
        );
        uint256[] memory buyOrders = streamEvents.getActiveBuyOrders(eventId);
        vm.stopPrank();
        return buyOrders;
    }
    
    function executeShareTrade(uint256 buyOrderId, uint256 sellOrderId, uint256 executionPrice) internal {
        vm.startPrank(trader1);
        streamEvents.executeTrade(buyOrderId, sellOrderId, executionPrice);
        vm.stopPrank();
    }
    
    // ============ DOMA INTEGRATION HELPERS ============
    
    function requestDomainTokenization() internal {
        vm.startPrank(creator);
        domaRecord.requestTokenization{value: 0.1 ether}(mockVoucher, mockSignature);
        vm.stopPrank();
    }
    
    function claimDomainOwnership(uint256 tokenIdToClaim) internal {
        vm.startPrank(creator);
        domaRecord.claimOwnership(tokenIdToClaim, false, mockProof, mockSignature);
        vm.stopPrank();
    }
    
    function bridgeDomain(uint256 tokenIdToBridge, string memory targetChainId, string memory targetOwnerAddress) internal {
        vm.startPrank(creator);
        domaRecord.bridge{value: 0.1 ether}(tokenIdToBridge, false, targetChainId, targetOwnerAddress);
        vm.stopPrank();
    }
    
    function checkOwnershipToken(uint256 tokenIdToCheck) internal view returns (address) {
        return ownershipToken.ownerOf(tokenIdToCheck);
    }
    
    function approveOwnershipToken(address to, uint256 tokenIdToApprove) internal {
        // Note: IOwnershipToken doesn't have approve function
        // This is a placeholder for future implementation
        console.log("Approval not available for IOwnershipToken");
    }
    
    function setApprovalForAllOwnershipToken(address operator, bool approved) internal {
        // Note: IOwnershipToken doesn't have setApprovalForAll function
        // This is a placeholder for future implementation
        console.log("SetApprovalForAll not available for IOwnershipToken");
    }
    
    // ============ ASSERTION HELPERS ============
    
    function assertEventCreated(uint256 eventIdToCheck) internal {
        assertTrue(eventIdToCheck > 0);
        console.log("Event created with ID:", eventIdToCheck);
    }
    
    function assertInvestorHasShares(address investor, uint256 expectedShares) internal {
        uint256 actualShares = streamEvents.getInvestorShareBalance(eventId, investor);
        assertEq(actualShares, expectedShares);
        console.log("Investor has shares:");
        console.log(actualShares);
    }
    
    function assertPriceUpdated(uint256 expectedMinPrice) internal {
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(currentPrice >= expectedMinPrice);
        console.log("Current share price:", currentPrice);
    }
    
    function assertTradingVolume(uint256 expectedMinVolume) internal {
        (uint256 totalVolume,,,,,) = streamEvents.getTradingInfo(eventId);
        assertTrue(totalVolume >= expectedMinVolume);
        console.log("Trading volume:", totalVolume);
    }
    
    function assertDomainOwnership(uint256 tokenIdToCheck, address expectedOwner) internal {
        address actualOwner = checkOwnershipToken(tokenIdToCheck);
        assertEq(actualOwner, expectedOwner);
        console.log("Domain owned by:");
        console.log(actualOwner);
    }
    
    // ============ UTILITY FUNCTIONS ============
    
    function getCurrentBlock() internal view returns (uint256) {
        return block.number;
    }
    
    function getCurrentTimestamp() internal view returns (uint256) {
        return block.timestamp;
    }
    
    function advanceTime(uint256 secondsToAdvance) internal {
        vm.warp(block.timestamp + secondsToAdvance);
    }
    
    function advanceBlocks(uint256 blocksToAdvance) internal {
        vm.roll(block.number + blocksToAdvance);
    }
    
    function logContractAddresses() internal {
        console.log("=== Contract Addresses ===");
        console.log("StreamEvents:", address(streamEvents));
        console.log("Doma Record:", DOMA_RECORD);
        console.log("Ownership Token:", OWNERSHIP_TOKEN);
        console.log("Cross Chain Gateway:", CROSS_CHAIN_GATEWAY);
        console.log("Forwarder:", FORWARDER);
        console.log("Proxy Doma Record:", PROXY_DOMA_RECORD);
        console.log("Block Explorer:", BLOCK_EXPLORER);
    }
    
    function logTestAccounts() internal {
        console.log("=== Test Accounts ===");
        console.log("Owner:", owner);
        console.log("Creator:", creator);
        console.log("Investor1:", investor1);
        console.log("Investor2:", investor2);
        console.log("Trader1:", trader1);
        console.log("Trader2:", trader2);
        console.log("Registrar:", registrar);
    }
}
