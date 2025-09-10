// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/event.sol";
import "../src/events/Types.sol";
import "../src/doma/interfaces/IDomaProxy.sol";
import "./mocks/MockDomaProxy.sol";

contract BaseTradingTest is Test {
    StreamEvents public streamEvents;
    address public owner = address(0x1);
    address public creator = address(0x2);
    address public investor1 = address(0x3);
    address public investor2 = address(0x4);
    address public trader1 = address(0x5);
    address public trader2 = address(0x6);
    MockDomaProxy public domaProxy;
    
    uint256 public eventId;
    uint256 public constant TICKET_PRICE = 0.1 ether;
    uint256 public constant INVESTMENT_AMOUNT = 1 ether;
    uint256 public constant SHARE_AMOUNT = 100;
    uint256 public constant SHARE_PRICE = 0.01 ether;

    // Mock Doma data structures
    IDomaProxy.NameInfo[] public mockNames;
    IDomaProxy.TokenizationVoucher public mockVoucher;
    IDomaProxy.ProofOfContactsVoucher public mockProof;
    bytes public mockSignature;

    function setUp() public {
        vm.startPrank(owner);
        streamEvents = new StreamEvents();
        
        // Deploy mock Doma proxy
        domaProxy = new MockDomaProxy();
        
        // Set up Doma configuration (mock for testing)
        streamEvents.setDomaConfig(address(domaProxy), address(0x8), address(0x9), 0, "test");
        
        // Set up proper order value limits for testing
        streamEvents.setOrderValueLimits(0.001 ether, 1000 ether);
        streamEvents.setTradingFee(100); // 1%
        streamEvents.setOrderExpirationTime(7 days);
        
        vm.stopPrank();

        // Fund accounts
        vm.deal(creator, 10 ether);
        vm.deal(investor1, 20 ether);
        vm.deal(investor2, 20 ether);
        vm.deal(trader1, 20 ether);
        vm.deal(trader2, 20 ether);

        // Set up mock Doma data
        _setupMockDomaData();
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

        // Create mock signature (just dummy bytes)
        mockSignature = abi.encodePacked("mock_signature");
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

    // ============ ASSERTION HELPERS ============

    function assertEventCreated(uint256 eventIdToCheck) internal {
        assertTrue(eventIdToCheck > 0);
        // Additional event validation can be added here
    }

    function assertInvestorHasShares(address investor, uint256 expectedShares) internal {
        uint256 actualShares = streamEvents.getInvestorShareBalance(eventId, investor);
        assertEq(actualShares, expectedShares);
    }

    function assertPriceUpdated(uint256 expectedMinPrice) internal {
        uint256 currentPrice = streamEvents.getCurrentSharePrice(eventId);
        assertTrue(currentPrice >= expectedMinPrice);
    }

    function assertTradingVolume(uint256 expectedMinVolume) internal {
        (uint256 totalVolume,,,,,) = streamEvents.getTradingInfo(eventId);
        assertTrue(totalVolume >= expectedMinVolume);
    }
}
