// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/v0.1/core/ReventTrading.sol";
import "../src/doma/interfaces/IDomaProxy.sol";
import "../src/doma/interfaces/IOwnershipToken.sol";
import "../src/events/Types.sol";

// Mock EventsV1 contract for testing
contract MockEventsV1 {
    mapping(uint256 => EventTypes.EventData) public events;
    mapping(uint256 => bool) public eventExists;
    uint256 public nextEventId = 1;
    
    function createEvent(
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        bool isVIP,
        bytes memory data,
        string memory slug
    ) external returns (uint256) {
        uint256 eventId = nextEventId++;
        events[eventId] = EventTypes.EventData({
            eventId: eventId,
            creator: msg.sender,
            ipfsHash: ipfsHash,
            startTime: startTime,
            endTime: endTime,
            maxAttendees: maxAttendees,
            currentAttendees: 0,
            isVIP: isVIP,
            isActive: true,
            isLive: false,
            status: EventTypes.EventStatus.DRAFT,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        eventExists[eventId] = true;
        return eventId;
    }
    
    function getEvent(uint256 eventId) external view returns (EventTypes.EventData memory) {
        return events[eventId];
    }
    
    function eventExistsCheck(uint256 eventId) external view returns (bool) {
        return eventExists[eventId];
    }
    
    function getEventStatus(uint256 eventId) external view returns (EventTypes.EventStatus) {
        return events[eventId].status;
    }
    
    function registerForEvent(uint256 eventId, bytes memory data) external returns (uint256 fee) {
        require(eventExists[eventId], "Event does not exist");
        events[eventId].currentAttendees++;
        return 0.01 ether; // Mock fee
    }
    
    function publishEvent(uint256 eventId) external {
        require(eventExists[eventId], "Event does not exist");
        events[eventId].status = EventTypes.EventStatus.PUBLISHED;
    }
}

// Mock Doma proxy for testing
contract MockDomaProxy {
    function requestTokenization(
        IDomaProxy.TokenizationVoucher calldata voucher,
        bytes calldata registrarSignature
    ) external payable {
        // Mock implementation
    }
    
    function claimOwnership(
        uint256 tokenId,
        bool isSynthetic,
        IDomaProxy.ProofOfContactsVoucher calldata proof,
        bytes calldata proofSignature
    ) external payable {
        // Mock implementation
    }
    
    function bridge(
        uint256 tokenId,
        bool isSynthetic,
        string calldata targetChainId,
        string calldata targetOwnerAddress
    ) external payable {
        // Mock implementation
    }
    
    receive() external payable {}
}

// Mock ownership token for testing
contract MockOwnershipToken {
    mapping(uint256 => address) public owners;
    
    function ownerOf(uint256 tokenId) external view returns (address) {
        return owners[tokenId];
    }
    
    function setOwner(uint256 tokenId, address owner) external {
        owners[tokenId] = owner;
    }
}

contract ReventTradingTest is Test {
    ReventTrading public reventTrading;
    MockEventsV1 public mockEventsV1;
    MockDomaProxy public mockDomaProxy;
    MockOwnershipToken public mockOwnershipToken;
    
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public user3 = address(0x3);
    address public feeRecipient = address(0x4);
    
    function setUp() public {
        // Deploy mock contracts
        mockEventsV1 = new MockEventsV1();
        mockDomaProxy = new MockDomaProxy();
        mockOwnershipToken = new MockOwnershipToken();
        
        // Deploy ReventTrading with mock EventsV1
        reventTrading = new ReventTrading(address(mockEventsV1));
        
        // Set up configuration
        reventTrading.setFeeRecipient(feeRecipient);
        reventTrading.setTradingFee(100); // 1%
        reventTrading.setOrderValueLimits(0.0000001 ether, 1000 ether);
        reventTrading.setOrderExpirationTime(7 days);
        reventTrading.setEventsContract(address(mockEventsV1));
        reventTrading.setDomaProxy(address(mockDomaProxy));
        reventTrading.setOwnershipToken(address(mockOwnershipToken));
        
        // Fund users
        vm.deal(user1, 30 ether);
        vm.deal(user2, 30 ether);
        vm.deal(user3, 30 ether);
    }
    
    function testInitialization() public {
        assertEq(address(reventTrading.eventsContract()), address(mockEventsV1));
        assertEq(reventTrading.owner(), address(this));
        assertEq(reventTrading.feeRecipient(), feeRecipient);
        assertEq(reventTrading.tradingFeeBps(), 100);
        assertEq(reventTrading.minOrderValue(), 0.0000001 ether);
        assertEq(reventTrading.maxOrderValue(), 1000 ether);
        assertEq(reventTrading.orderExpirationTime(), 7 days);
        assertEq(reventTrading.domaProxy(), address(mockDomaProxy));
        assertEq(reventTrading.ownershipToken(), address(mockOwnershipToken));
    }
    
    function testCreateEventWithTokenization() public {
        // Create event with tokenization
        string memory ipfsHash = "QmTestHash";
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 2 days;
        uint256 maxAttendees = 100;
        
        vm.startPrank(user1);
        
        // Create voucher
        IDomaProxy.TokenizationVoucher memory voucher = IDomaProxy.TokenizationVoucher({
            names: new IDomaProxy.NameInfo[](1),
            nonce: 1,
            expiresAt: block.timestamp + 1 days,
            ownerAddress: user1
        });
        voucher.names[0] = IDomaProxy.NameInfo({
            sld: "test",
            tld: "event"
        });
        
        // Provide ETH for the contract to forward
        vm.deal(address(reventTrading), 0.1 ether);
        
        uint256 eventId = reventTrading.createEventWithTokenization{value: 0.1 ether}(
            ipfsHash,
            startTime,
            endTime,
            maxAttendees,
            0.01 ether, // registrationFee
            voucher,
            "" // registrarSignature
        );
        vm.stopPrank();
        
        assertEq(eventId, 1);
        assertTrue(reventTrading.eventExistsCheck(eventId));
    }
    
    function testInvestInEvent() public {
        // First create an event
        vm.startPrank(user1);
        uint256 eventId = mockEventsV1.createEvent(
            "QmTestHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            false,
            "",
            ""
        );
        vm.stopPrank();
        
        // Invest in the event
        vm.startPrank(user2);
        reventTrading.investInEvent{value: 1 ether}(eventId);
        vm.stopPrank();
        
        // Check investment
        assertEq(reventTrading.getInvestorShareBalance(eventId, user2), 1 ether);
        assertEq(reventTrading.getTotalInvested(eventId), 1 ether);
        assertTrue(reventTrading.isInvestor(eventId, user2));
    }
    
    function testRegisterForEventWithRevenuePool() public {
        // Create and publish event
        vm.startPrank(user1);
        uint256 eventId = mockEventsV1.createEvent(
            "QmTestHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            false,
            "",
            ""
        );
        mockEventsV1.publishEvent(eventId);
        vm.stopPrank();
        
        // Ensure fee recipient has balance
        vm.deal(feeRecipient, 1 ether);
        
        // Register for event with revenue pool
        vm.startPrank(user2);
        reventTrading.registerForEventWithRevenuePool{value: 0.1 ether}(eventId);
        vm.stopPrank();
        
        // Check that user is registered
        EventTypes.EventData memory eventData = mockEventsV1.getEvent(eventId);
        assertEq(eventData.currentAttendees, 1);
    }
    
    function testAdminFunctions() public {
        // Test setting Doma proxy
        address newDomaProxy = address(0x6);
        vm.startPrank(address(this));
        reventTrading.setDomaProxy(newDomaProxy);
        vm.stopPrank();
        assertEq(reventTrading.domaProxy(), newDomaProxy);
        
        // Test setting ownership token
        address newOwnershipToken = address(0x7);
        vm.startPrank(address(this));
        reventTrading.setOwnershipToken(newOwnershipToken);
        vm.stopPrank();
        assertEq(reventTrading.ownershipToken(), newOwnershipToken);
        
        // Test setting fee recipient
        address newFeeRecipient = address(0x8);
        vm.startPrank(address(this));
        reventTrading.setFeeRecipient(newFeeRecipient);
        vm.stopPrank();
        assertEq(reventTrading.feeRecipient(), newFeeRecipient);
        
        // Test setting trading fee
        vm.startPrank(address(this));
        reventTrading.setTradingFee(200); // 2%
        vm.stopPrank();
        assertEq(reventTrading.tradingFeeBps(), 200);
        
        // Test setting order limits
        vm.startPrank(address(this));
        reventTrading.setOrderValueLimits(0.001 ether, 500 ether);
        vm.stopPrank();
        assertEq(reventTrading.minOrderValue(), 0.001 ether);
        assertEq(reventTrading.maxOrderValue(), 500 ether);
        
        // Test setting order expiration
        vm.startPrank(address(this));
        reventTrading.setOrderExpirationTime(14 days);
        vm.stopPrank();
        assertEq(reventTrading.orderExpirationTime(), 14 days);
    }
    
    function testEmergencyFunctions() public {
        // Send ETH to contract
        vm.deal(address(reventTrading), 1 ether);
        
        // Emergency withdraw
        reventTrading.emergencyWithdraw();
        
        assertEq(address(reventTrading).balance, 0);
    }
    
    function testDomaIntegration() public {
        // Create event
        vm.startPrank(user1);
        uint256 eventId = mockEventsV1.createEvent(
            "QmTestHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            false,
            "",
            ""
        );
        vm.stopPrank();
        
        // Set Doma token ID
        vm.startPrank(address(this));
        reventTrading.setDomaTokenId(eventId, 123);
        vm.stopPrank();
        
        // Test Doma functions
        assertEq(reventTrading.getDomaTokenId(eventId), 123);
        assertEq(reventTrading.getDomaStatus(eventId), 0);
    }
    
    function testRevenueSharing() public {
        // Create event and invest
        vm.startPrank(user1);
        uint256 eventId = mockEventsV1.createEvent(
            "QmTestHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            false,
            "",
            ""
        );
        mockEventsV1.publishEvent(eventId);
        vm.stopPrank();
        
        // Invest in event
        vm.startPrank(user2);
        reventTrading.investInEvent{value: 1 ether}(eventId);
        vm.stopPrank();
        
        // Register for event (generates revenue)
        vm.startPrank(user1);
        reventTrading.registerForEventWithRevenuePool{value: 0.1 ether}(eventId);
        vm.stopPrank();
        
        // Check revenue accrued
        assertTrue(reventTrading.getRevenueAccrued(eventId) > 0);
        
        // Claim revenue
        vm.startPrank(user2);
        uint256 balanceBefore = user2.balance;
        reventTrading.claimRevenue(eventId);
        uint256 balanceAfter = user2.balance;
        vm.stopPrank();
        
        assertTrue(balanceAfter > balanceBefore);
    }
    
    // ============ PRICE MANAGER TESTS ============
    
    function testPriceManager() public {
        // Create event
        vm.startPrank(user1);
        uint256 eventId = mockEventsV1.createEvent(
            "QmTestHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            false,
            "",
            ""
        );
        vm.stopPrank();
        
        // Invest in event first
        vm.startPrank(user2);
        reventTrading.investInEvent{value: 1 ether}(eventId);
        vm.stopPrank();
        
        // Initialize dynamic pricing
        vm.startPrank(user1);
        reventTrading.initializeDynamicPricing(eventId, 0.01 ether);
        vm.stopPrank();
        
        // Check pricing info
        (uint256 basePrice, uint256 currentMultiplier, uint256 currentPrice, uint256 totalValue, uint256 shareSupply) = 
            reventTrading.getPricingInfo(eventId);
        
        assertEq(basePrice, 0.01 ether);
        assertEq(currentMultiplier, 10000); // 1.0x
        assertEq(currentPrice, 0.01 ether);
        assertEq(shareSupply, 1 ether);
        
        // Update event total value
        vm.startPrank(user1);
        reventTrading.updateEventTotalValue(eventId, 2 ether);
        vm.stopPrank();
        
        // Check updated pricing
        (basePrice, currentMultiplier, currentPrice, totalValue, shareSupply) = 
            reventTrading.getPricingInfo(eventId);
        
        assertEq(basePrice, 0.01 ether);
        assertEq(currentPrice, 0.005 ether); // Should be 0.5x due to total value increase (2 ether / 1 ether = 2x value per share, but price is base * multiplier)
    }
    
    // ============ VOLUME MANAGER TESTS ============
    
    function testVolumeManager() public {
        // Create event
        vm.startPrank(user1);
        uint256 eventId = mockEventsV1.createEvent(
            "QmTestHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            false,
            "",
            ""
        );
        vm.stopPrank();
        
        // Check initial trading info
        (uint256 totalVolume, uint256 buyVolume, uint256 sellVolume, uint256 momentumFactor, uint256 buyRatio, uint256 sellRatio) = 
            reventTrading.getTradingInfo(eventId);
        
        assertEq(totalVolume, 0);
        assertEq(buyVolume, 0);
        assertEq(sellVolume, 0);
        assertEq(momentumFactor, 0);
        assertEq(buyRatio, 5000); // 50%
        assertEq(sellRatio, 5000); // 50%
    }
    
    // ============ ORDER MANAGER TESTS ============
    
    function testOrderManagement() public {
        // Create event
        vm.startPrank(user1);
        uint256 eventId = mockEventsV1.createEvent(
            "QmTestHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            false,
            "",
            ""
        );
        vm.stopPrank();
        
        // Set up ownership token
        mockOwnershipToken.setOwner(123, user1);
        reventTrading.setDomaTokenId(eventId, 123);
        
        // Create sell order
        vm.startPrank(user1);
        reventTrading.createSellOrder{value: 0.1 ether}(
            eventId,
            0.01 ether, // minPrice
            0.1 ether,  // maxPrice
            address(0), // ETH
            0           // expiration
        );
        vm.stopPrank();
        
        // Create buy order
        vm.startPrank(user2);
        reventTrading.createBuyOrder{value: 0.1 ether}(
            eventId,
            0.1 ether,  // maxPrice
            address(0), // ETH
            0           // expiration
        );
        vm.stopPrank();
        
        // Check orders were created
        uint256[] memory buyOrders = reventTrading.getActiveBuyOrders(eventId);
        uint256[] memory sellOrders = reventTrading.getActiveSellOrders(eventId);
        
        assertTrue(buyOrders.length > 0);
        assertTrue(sellOrders.length > 0);
        
        // Test order details
        EventTypes.TradingOrder memory buyOrder = reventTrading.getOrder(buyOrders[0]);
        assertEq(buyOrder.creator, user2);
        assertEq(buyOrder.eventId, eventId);
        assertEq(uint256(buyOrder.orderType), uint256(EventTypes.OrderType.BUY));
        assertEq(uint256(buyOrder.tradingType), uint256(EventTypes.TradingType.DOMAIN));
        
        EventTypes.TradingOrder memory sellOrder = reventTrading.getOrder(sellOrders[0]);
        assertEq(sellOrder.creator, user1);
        assertEq(sellOrder.eventId, eventId);
        assertEq(uint256(sellOrder.orderType), uint256(EventTypes.OrderType.SELL));
        assertEq(uint256(sellOrder.tradingType), uint256(EventTypes.TradingType.DOMAIN));
        
        // Test order update
        vm.startPrank(user2);
        reventTrading.updateOrder(
            buyOrders[0],
            0.05 ether, // newMinPrice
            0.08 ether, // newMaxPrice
            block.timestamp + 1 days // newExpirationTime
        );
        vm.stopPrank();
        
        // Check order was updated
        EventTypes.TradingOrder memory updatedOrder = reventTrading.getOrder(buyOrders[0]);
        assertEq(updatedOrder.minPrice, 0.05 ether);
        assertEq(updatedOrder.maxPrice, 0.08 ether);
        
        // Test order cancellation
        vm.startPrank(user2);
        reventTrading.cancelOrder(buyOrders[0]);
        vm.stopPrank();
        
        // Verify order is cancelled
        EventTypes.TradingOrder memory cancelledOrder = reventTrading.getOrder(buyOrders[0]);
        assertEq(uint256(cancelledOrder.status), uint256(EventTypes.OrderStatus.CANCELLED));
    }
    
    function testInvestorShareTrading() public {
        // Create event and invest
        vm.startPrank(user1);
        uint256 eventId = mockEventsV1.createEvent(
            "QmTestHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            false,
            "",
            ""
        );
        vm.stopPrank();
        
        // Invest in event
        vm.startPrank(user2);
        reventTrading.investInEvent{value: 1 ether}(eventId);
        vm.stopPrank();
        
        // Initialize dynamic pricing
        vm.startPrank(user1);
        reventTrading.initializeDynamicPricing(eventId, 0.01 ether);
        vm.stopPrank();
        
        // Create investor share sell order
        vm.startPrank(user2);
        reventTrading.createInvestorShareSellOrder{value: 0.1 ether}(
            eventId,
            10, // shareAmount
            0.01 ether, // pricePerShare
            address(0), // ETH
            0 // expirationTime
        );
        vm.stopPrank();
        
        // Create investor share buy order
        vm.startPrank(user3);
        reventTrading.createInvestorShareBuyOrder{value: 0.2 ether}(
            eventId,
            20, // shareAmount
            0.01 ether, // pricePerShare
            address(0), // ETH
            0 // expirationTime
        );
        vm.stopPrank();
        
        // Check orders were created
        uint256[] memory buyOrders = reventTrading.getActiveBuyOrders(eventId);
        uint256[] memory sellOrders = reventTrading.getActiveSellOrders(eventId);
        
        assertTrue(buyOrders.length > 0);
        assertTrue(sellOrders.length > 0);
        
        // Test order details
        EventTypes.TradingOrder memory buyOrder = reventTrading.getOrder(buyOrders[0]);
        assertEq(buyOrder.creator, user3);
        assertEq(buyOrder.shareAmount, 20);
        assertEq(buyOrder.pricePerShare, 0.01 ether);
        assertEq(uint256(buyOrder.tradingType), uint256(EventTypes.TradingType.INVESTOR_SHARES));
        
        EventTypes.TradingOrder memory sellOrder = reventTrading.getOrder(sellOrders[0]);
        assertEq(sellOrder.creator, user2);
        assertEq(sellOrder.shareAmount, 10);
        assertEq(sellOrder.pricePerShare, 0.01 ether);
        assertEq(uint256(sellOrder.tradingType), uint256(EventTypes.TradingType.INVESTOR_SHARES));
    }
    
    function testUserOrders() public {
        // Create event
        vm.startPrank(user1);
        uint256 eventId = mockEventsV1.createEvent(
            "QmTestHash",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            100,
            false,
            "",
            ""
        );
        vm.stopPrank();
        
        // Set up ownership token
        mockOwnershipToken.setOwner(123, user1);
        reventTrading.setDomaTokenId(eventId, 123);
        
        // Create multiple orders
        vm.startPrank(user1);
        reventTrading.createSellOrder{value: 0.1 ether}(
            eventId,
            0.01 ether,
            0.1 ether,
            address(0),
            0
        );
        vm.stopPrank();
        
        vm.startPrank(user2);
        reventTrading.createBuyOrder{value: 0.1 ether}(
            eventId,
            0.1 ether,
            address(0),
            0
        );
        vm.stopPrank();
        
        // Check user orders
        uint256[] memory user1Orders = reventTrading.getUserOrders(user1);
        uint256[] memory user2Orders = reventTrading.getUserOrders(user2);
        
        assertEq(user1Orders.length, 1);
        assertEq(user2Orders.length, 1);
        
        // Check event orders
        uint256[] memory eventOrders = reventTrading.getEventOrders(eventId);
        assertEq(eventOrders.length, 2);
    }

    receive() external payable {}
}