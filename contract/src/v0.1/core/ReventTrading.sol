// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../../events/Types.sol";
import "../../doma/interfaces/IDomaProxy.sol";
import "../../doma/interfaces/IOwnershipToken.sol";
import "../../utils/counter.sol";

// Simple interface for EventsV1 to avoid import conflicts
interface IEventsV1 {
    function createEvent(
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        bool isVIP,
        bytes memory data,
        string memory slug
    ) external returns (uint256);
    
    function getEvent(uint256 eventId) external view returns (EventTypes.EventData memory);
    function eventExistsCheck(uint256 eventId) external view returns (bool);
    function getEventStatus(uint256 eventId) external view returns (EventTypes.EventStatus);
    function registerForEvent(uint256 eventId, bytes memory data) external returns (uint256 fee);
}

/**
 * @title ReventTrading
 * @dev Streamlined trading contract with PriceManager, VolumeManager, and OrderManager functionality
 */
contract ReventTrading is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;

    // Reference to the EventsV1 contract
    IEventsV1 public eventsContract;

    // Essential storage
    address public domaProxy;
    address public ownershipToken;
    address public feeRecipient;
    
    // Investment tracking
    mapping(uint256 => uint256) public totalInvested; // eventId => total ETH invested
    mapping(uint256 => mapping(address => uint256)) public investorShares; // eventId => investor => amount
    mapping(uint256 => uint256) public revenueAccrued; // net revenue accrued per event
    mapping(uint256 => mapping(address => uint256)) public revenueClaimed; // eventId => investor => cumulative claimed
    mapping(uint256 => address[]) public eventInvestors; // eventId => list of investor addresses
    mapping(uint256 => mapping(address => bool)) public isEventInvestor; // eventId => investor => is investor
    
    // Doma integration
    mapping(uint256 => uint256) public eventToDomaTokenId; // eventId => tokenId
    mapping(uint256 => uint8) public eventToDomaStatus; // 0-None,1-Requested,2-Minted,3-Claimed
    
    // Platform settings
    uint256 public platformFee = 250; // basis points
    uint256 public investorBps = 5000; // 50% to investors
    uint256 public minRegistrationFee = 0.001 ether;
    uint256 public maxRegistrationFee = 1 ether;

    // ============ PRICE MANAGER FUNCTIONALITY ============
    
    // Dynamic share pricing system
    mapping(uint256 => uint256) public eventShareBasePrice; // eventId => base price per share (in wei)
    mapping(uint256 => uint256) public eventShareMultiplier; // eventId => current price multiplier (basis points)
    mapping(uint256 => uint256) public eventTotalValue; // eventId => total event value (domain + revenue)
    mapping(uint256 => uint256) public eventShareSupply; // eventId => total share supply (totalInvested)
    mapping(uint256 => uint256) public lastPriceUpdate; // eventId => last price update timestamp

    // ============ VOLUME MANAGER FUNCTIONALITY ============
    
    // Trading-based price momentum
    mapping(uint256 => uint256) public eventTradingVolume; // eventId => total trading volume (24h)
    mapping(uint256 => uint256) public eventBuyVolume; // eventId => buy volume (24h)
    mapping(uint256 => uint256) public eventSellVolume; // eventId => sell volume (24h)
    mapping(uint256 => uint256) public eventLastTradingUpdate; // eventId => last trading volume reset
    mapping(uint256 => uint256) public eventPriceMomentum; // eventId => price momentum factor (basis points)

    // ============ ORDER MANAGER FUNCTIONALITY ============
    
    Counters.Counter internal _orderIds;
    mapping(uint256 => EventTypes.TradingOrder) public orders; // orderId => TradingOrder
    mapping(uint256 => uint256[]) public eventOrders; // eventId => orderIds
    mapping(address => uint256[]) public userOrders; // user => orderIds
    mapping(uint256 => uint256[]) public activeBuyOrders; // eventId => orderIds (buy orders)
    mapping(uint256 => uint256[]) public activeSellOrders; // eventId => orderIds (sell orders)
    mapping(uint256 => uint256) public eventCurrentPrice; // eventId => current market price

    // Trading fees and limits
    uint256 public tradingFeeBps = 100; // 1% trading fee
    uint256 public minOrderValue = 0.001 ether; // minimum order value
    uint256 public maxOrderValue = 1000 ether; // maximum order value
    uint256 public orderExpirationTime = 7 days; // default order expiration

    // Events
    event EventsContractUpdated(address oldContract, address newContract);
    event DomaProxyUpdated(address oldProxy, address newProxy);
    event OwnershipTokenUpdated(address oldToken, address newToken);
    event DomaBridged(uint256 indexed eventId, string targetChainId, string targetOwnerAddress);
    event DomaRequested(uint256 indexed eventId, uint256 tokenId);
    event AttendeeRegistered(uint256 indexed eventId, address indexed attendee, string confirmationCode, uint256 fee);
    event RevenueClaimed(uint256 indexed eventId, address indexed investor, uint256 amount);
    event OrderCreated(uint256 indexed orderId, uint256 indexed eventId, address indexed creator, EventTypes.OrderType orderType);
    event OrderUpdated(uint256 indexed orderId, uint256 newMinPrice, uint256 newMaxPrice, uint256 newExpirationTime);
    event OrderCancelled(uint256 indexed orderId);
    event TradeExecuted(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 price);
    event InvestorSharePriceUpdated(uint256 indexed eventId, uint256 oldPrice, uint256 newPrice, address currency);
    event TradingFeeUpdated(uint256 oldFee, uint256 newFee);
    event OrderValueLimitsUpdated(uint256 minOrderValue, uint256 maxOrderValue);
    event OrderExpirationTimeUpdated(uint256 oldExpiration, uint256 newExpiration);

    constructor(address _eventsContract) Ownable(msg.sender) {
        require(_eventsContract != address(0), "invalid events contract");
        eventsContract = IEventsV1(_eventsContract);
    }

    // ============ ADMIN FUNCTIONS ============

    function setEventsContract(address _eventsContract) external onlyOwner {
        require(_eventsContract != address(0), "invalid events contract");
        address oldContract = address(eventsContract);
        eventsContract = IEventsV1(_eventsContract);
        emit EventsContractUpdated(oldContract, _eventsContract);
    }

    function setDomaProxy(address _domaProxy) external onlyOwner {
        address oldProxy = domaProxy;
        domaProxy = _domaProxy;
        emit DomaProxyUpdated(oldProxy, _domaProxy);
    }

    function setOwnershipToken(address _ownershipToken) external onlyOwner {
        address oldToken = ownershipToken;
        ownershipToken = _ownershipToken;
        emit OwnershipTokenUpdated(oldToken, _ownershipToken);
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    function setDomaTokenId(uint256 eventId, uint256 tokenId) external onlyOwner {
        eventToDomaTokenId[eventId] = tokenId;
    }

    function setTradingFee(uint256 _tradingFeeBps) external onlyOwner {
        require(_tradingFeeBps <= 1000, "fee too high"); // max 10%
        uint256 oldFee = tradingFeeBps;
        tradingFeeBps = _tradingFeeBps;
        emit TradingFeeUpdated(oldFee, _tradingFeeBps);
    }

    function setOrderValueLimits(uint256 _minOrderValue, uint256 _maxOrderValue) external onlyOwner {
        require(_minOrderValue < _maxOrderValue, "invalid limits");
        minOrderValue = _minOrderValue;
        maxOrderValue = _maxOrderValue;
        emit OrderValueLimitsUpdated(_minOrderValue, _maxOrderValue);
    }

    function setOrderExpirationTime(uint256 _expirationTime) external onlyOwner {
        require(_expirationTime >= 1 hours, "expiration too short");
        uint256 oldExpiration = orderExpirationTime;
        orderExpirationTime = _expirationTime;
        emit OrderExpirationTimeUpdated(oldExpiration, _expirationTime);
    }

    // ============ DOMA INTEGRATION ============

    function createEventWithTokenization(
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee,
        IDomaProxy.TokenizationVoucher calldata voucher,
        bytes calldata registrarSignature
    ) external payable returns (uint256) {
        require(domaProxy != address(0), "doma proxy not set");
        require(voucher.ownerAddress == _msgSender(), "voucher owner != sender");

        // Create event through EventsV1 contract
        uint256 eventId = eventsContract.createEvent(
            ipfsHash,
            startTime,
            endTime,
            maxAttendees,
            false, // isVIP
            "", // data
            "" // slug
        );

        // Request tokenization
        IDomaProxy(domaProxy).requestTokenization{value: msg.value}(voucher, registrarSignature);
        emit DomaRequested(eventId, 0); // tokenId would be set when minted

        return eventId;
    }

    function claimEventDomain(
        uint256 eventId,
        bool isSynthetic,
        IDomaProxy.ProofOfContactsVoucher calldata proof,
        bytes calldata proofSignature
    ) external payable {
        require(domaProxy != address(0), "doma proxy not set");
        require(eventsContract.eventExistsCheck(eventId), "event does not exist");
        require(eventsContract.getEvent(eventId).creator == _msgSender(), "not event creator");
        
        uint256 tokenId = eventToDomaTokenId[eventId];
        require(tokenId != 0, "token not linked");
        
        IDomaProxy(domaProxy).claimOwnership{value: msg.value}(tokenId, isSynthetic, proof, proofSignature);
        eventToDomaStatus[eventId] = 3; // Claimed
    }

    function bridgeEventDomain(
        uint256 eventId,
        bool isSynthetic,
        string calldata targetChainId,
        string calldata targetOwnerAddress
    ) external payable {
        require(domaProxy != address(0), "doma proxy not set");
        require(eventsContract.eventExistsCheck(eventId), "event does not exist");
        require(eventsContract.getEvent(eventId).creator == _msgSender(), "not event creator");
        
        uint256 tokenId = eventToDomaTokenId[eventId];
        require(tokenId != 0, "token not linked");
        
        IDomaProxy(domaProxy).bridge{value: msg.value}(tokenId, isSynthetic, targetChainId, targetOwnerAddress);
        emit DomaBridged(eventId, targetChainId, targetOwnerAddress);
    }

    // ============ INVESTMENT FUNCTIONS ============

    function investInEvent(uint256 eventId) external payable {
        require(eventsContract.eventExistsCheck(eventId), "event does not exist");
        require(msg.value > 0, "no value");
        
        // Track if this is a new investor
        bool isNewInvestor = investorShares[eventId][_msgSender()] == 0;
        
        totalInvested[eventId] += msg.value;
        investorShares[eventId][_msgSender()] += msg.value;
        
        // Add to investor list if new investor
        if (isNewInvestor) {
            eventInvestors[eventId].push(_msgSender());
            isEventInvestor[eventId][_msgSender()] = true;
        }
    }

    function registerForEventWithRevenuePool(uint256 eventId) external payable {
        require(eventsContract.eventExistsCheck(eventId), "event does not exist");
        
        // Get event data from EventsV1
        EventTypes.EventData memory eventData = eventsContract.getEvent(eventId);
        require(eventData.status == EventTypes.EventStatus.PUBLISHED, "not open");

        address sender = _msgSender();
        string memory confirmationCode = _generateConfirmationCode(eventId, sender);
        
        // Register through EventsV1
        eventsContract.registerForEvent(eventId, "");
        
        // Handle revenue distribution
        uint256 platformFeeAmount = (msg.value * platformFee) / 10000;
        uint256 net = msg.value - platformFeeAmount;
        
        // Transfer platform fee
        if (platformFeeAmount > 0) {
            address feeRecipientAddr = feeRecipient == address(0) ? owner() : feeRecipient;
            (bool success, ) = payable(feeRecipientAddr).call{value: platformFeeAmount}("");
            require(success, "fee transfer failed");
        }

        // Split net into investor pool and creator immediate payout
        uint256 toInvestors = (net * investorBps) / 10000;
        uint256 toCreator = net - toInvestors;
        revenueAccrued[eventId] += toInvestors;
        
        // Transfer to creator
        if (toCreator > 0) {
            (bool success, ) = payable(eventData.creator).call{value: toCreator}("");
            require(success, "creator transfer failed");
        }

        // Update event total value for dynamic pricing
        uint256 currentTotalValue = eventTotalValue[eventId] + toInvestors;
        eventTotalValue[eventId] = currentTotalValue;
        
        // Trigger share price update if dynamic pricing is initialized
        if (eventShareBasePrice[eventId] > 0) {
            _updateSharePrice(eventId);
        }

        emit AttendeeRegistered(eventId, sender, confirmationCode, msg.value);
    }

    function claimRevenue(uint256 eventId) external {
        uint256 invested = investorShares[eventId][_msgSender()];
        require(invested > 0, "no shares");
        uint256 total = totalInvested[eventId];
        require(total > 0, "no total");
        uint256 entitled = (revenueAccrued[eventId] * invested) / total;
        uint256 already = revenueClaimed[eventId][_msgSender()];
        require(entitled > already, "nothing to claim");
        uint256 payout = entitled - already;
        revenueClaimed[eventId][_msgSender()] = entitled;
        (bool ok, ) = payable(_msgSender()).call{value: payout}("");
        require(ok, "payout failed");
        emit RevenueClaimed(eventId, _msgSender(), payout);
    }

    function tipDomainOwner(uint256 eventId) external payable {
        require(msg.value > 0, "no value");
        require(ownershipToken != address(0), "ownership not set");
        uint256 tokenId = eventToDomaTokenId[eventId];
        require(tokenId != 0, "token not linked");
        address to = IOwnershipToken(ownershipToken).ownerOf(tokenId);
        (bool ok, ) = payable(to).call{value: msg.value}("");
        require(ok, "tip failed");
    }

    // ============ PRICE MANAGER FUNCTIONS ============

    function initializeDynamicPricing(uint256 eventId, uint256 basePricePerShare) external {
        require(eventsContract.eventExistsCheck(eventId), "event does not exist");
        require(eventsContract.getEvent(eventId).creator == _msgSender(), "not event creator");
        require(basePricePerShare > 0, "invalid base price");
        require(eventShareBasePrice[eventId] == 0, "already initialized");
        
        eventShareBasePrice[eventId] = basePricePerShare;
        eventShareMultiplier[eventId] = 10000; // 1.0x multiplier
        eventShareSupply[eventId] = totalInvested[eventId];
        lastPriceUpdate[eventId] = block.timestamp;
        
        emit InvestorSharePriceUpdated(eventId, 0, basePricePerShare, address(0));
    }

    function getCurrentSharePrice(uint256 eventId) external view returns (uint256) {
        if (eventShareBasePrice[eventId] == 0) return 0;
        return (eventShareBasePrice[eventId] * eventShareMultiplier[eventId]) / 10000;
    }

    function updateEventTotalValue(uint256 eventId, uint256 newTotalValue) external {
        require(eventsContract.eventExistsCheck(eventId), "event does not exist");
        require(_msgSender() == owner() || _msgSender() == eventsContract.getEvent(eventId).creator, "unauthorized");
        require(newTotalValue > 0, "invalid value");
        
        eventTotalValue[eventId] = newTotalValue;
        _updateSharePrice(eventId);
    }

    function _updateSharePrice(uint256 eventId) internal {
        if (eventShareBasePrice[eventId] == 0) return;
        
        uint256 totalValue = eventTotalValue[eventId];
        uint256 shareSupply = eventShareSupply[eventId];
        
        uint256 newMultiplier;
        
        if (totalValue > 0 && shareSupply > 0) {
            // Calculate base multiplier from total value
            uint256 valuePerShare = totalValue / shareSupply;
            uint256 basePrice = eventShareBasePrice[eventId];
            uint256 baseMultiplier = (valuePerShare * 10000) / basePrice;
            
            // Apply momentum factor
            uint256 momentumFactor = eventPriceMomentum[eventId];
            if (momentumFactor == 0) momentumFactor = 10000;
            
            newMultiplier = (baseMultiplier * momentumFactor) / 10000;
        } else {
            // No total value set, use momentum only
            uint256 momentumFactor = eventPriceMomentum[eventId];
            if (momentumFactor == 0) momentumFactor = 10000;
            
            newMultiplier = momentumFactor;
        }
        
        // Cap multiplier between 0.5x and 100x
        if (newMultiplier < 5000) newMultiplier = 5000;
        if (newMultiplier > 1000000) newMultiplier = 1000000;
        
        uint256 oldMultiplier = eventShareMultiplier[eventId];
        eventShareMultiplier[eventId] = newMultiplier;
        lastPriceUpdate[eventId] = block.timestamp;
        
        if (oldMultiplier != newMultiplier) {
            uint256 oldPrice = (eventShareBasePrice[eventId] * oldMultiplier) / 10000;
            uint256 newPrice = (eventShareBasePrice[eventId] * newMultiplier) / 10000;
            emit InvestorSharePriceUpdated(eventId, oldPrice, newPrice, address(0));
        }
    }

    // ============ VOLUME MANAGER FUNCTIONS ============

    function _updateTradingVolume(uint256 eventId, uint256 tradeValue, bool isBuy) internal {
        // Reset volume every 24 hours
        if (block.timestamp - eventLastTradingUpdate[eventId] > 86400) {
            eventTradingVolume[eventId] = 0;
            eventBuyVolume[eventId] = 0;
            eventSellVolume[eventId] = 0;
            eventLastTradingUpdate[eventId] = block.timestamp;
        }
        
        // Update volumes
        eventTradingVolume[eventId] += tradeValue;
        if (isBuy) {
            eventBuyVolume[eventId] += tradeValue;
        } else {
            eventSellVolume[eventId] += tradeValue;
        }
        
        // Calculate momentum
        _calculateMomentum(eventId);
    }

    function _calculateMomentum(uint256 eventId) internal {
        uint256 totalVolume = eventTradingVolume[eventId];
        if (totalVolume == 0) return;
        
        uint256 buyRatio = (eventBuyVolume[eventId] * 10000) / totalVolume;
        uint256 sellRatio = 10000 - buyRatio;
        
        uint256 momentumFactor;
        if (buyRatio > 5000) {
            // More buying: momentum = 10000 + (buyRatio - 5000) / 10
            momentumFactor = 10000 + (buyRatio - 5000) / 10;
        } else if (sellRatio > 5000) {
            // More selling: momentum = 10000 - (sellRatio - 5000) / 20
            momentumFactor = 10000 - (sellRatio - 5000) / 20;
        } else {
            // Balanced trading
            momentumFactor = 10000;
        }
        
        // Cap momentum between 0.5x and 2.0x
        if (momentumFactor < 5000) momentumFactor = 5000;
        if (momentumFactor > 20000) momentumFactor = 20000;
        
        eventPriceMomentum[eventId] = momentumFactor;
    }

    // ============ ORDER MANAGER FUNCTIONS ============

    function createSellOrder(
        uint256 eventId,
        uint256 minPrice,
        uint256 maxPrice,
        address currency,
        uint256 expirationTime
    ) external payable nonReentrant {
        require(eventsContract.eventExistsCheck(eventId), "event does not exist");
        require(ownershipToken != address(0), "ownership not set");
        require(IOwnershipToken(ownershipToken).ownerOf(eventToDomaTokenId[eventId]) == _msgSender(), "not owner");
        require(minPrice >= minOrderValue, "price too low");
        require(maxPrice <= maxOrderValue, "price too high");
        require(minPrice <= maxPrice, "invalid price range");
        require(expirationTime == 0 || expirationTime > block.timestamp, "invalid expiration");

        _createOrder(
            eventId,
            _msgSender(),
            minPrice,
            maxPrice,
            currency,
            expirationTime,
            EventTypes.OrderType.SELL,
            EventTypes.TradingType.DOMAIN,
            0, // shareAmount
            0  // pricePerShare
        );
    }

    function createBuyOrder(
        uint256 eventId,
        uint256 maxPrice,
        address currency,
        uint256 expirationTime
    ) external payable nonReentrant {
        require(eventsContract.eventExistsCheck(eventId), "event does not exist");
        require(maxPrice >= minOrderValue, "price too low");
        require(maxPrice <= maxOrderValue, "price too high");
        require(expirationTime == 0 || expirationTime > block.timestamp, "invalid expiration");

        if (currency == address(0)) {
            require(msg.value >= maxPrice, "insufficient ETH");
        }

        _createOrder(
            eventId,
            _msgSender(),
            0, // minPrice
            maxPrice,
            currency,
            expirationTime,
            EventTypes.OrderType.BUY,
            EventTypes.TradingType.DOMAIN,
            0, // shareAmount
            0  // pricePerShare
        );
    }

    function createInvestorShareSellOrder(
        uint256 eventId,
        uint256 shareAmount,
        uint256 pricePerShare,
        address currency,
        uint256 expirationTime
    ) external payable nonReentrant {
        require(eventsContract.eventExistsCheck(eventId), "event does not exist");
        require(shareAmount > 0, "invalid share amount");
        require(pricePerShare >= minOrderValue, "price too low");
        require(pricePerShare <= maxOrderValue, "price too high");
        require(expirationTime == 0 || expirationTime > block.timestamp, "invalid expiration");
        require(investorShares[eventId][_msgSender()] >= shareAmount, "insufficient shares");

        _createOrder(
            eventId,
            _msgSender(),
            pricePerShare,
            pricePerShare,
            currency,
            expirationTime,
            EventTypes.OrderType.SELL,
            EventTypes.TradingType.INVESTOR_SHARES,
            shareAmount,
            pricePerShare
        );
    }

    function createInvestorShareBuyOrder(
        uint256 eventId,
        uint256 shareAmount,
        uint256 pricePerShare,
        address currency,
        uint256 expirationTime
    ) external payable nonReentrant {
        require(eventsContract.eventExistsCheck(eventId), "event does not exist");
        require(shareAmount > 0, "invalid share amount");
        require(pricePerShare >= minOrderValue, "price too low");
        require(pricePerShare <= maxOrderValue, "price too high");
        require(expirationTime == 0 || expirationTime > block.timestamp, "invalid expiration");

        if (currency == address(0)) {
            require(msg.value >= shareAmount * pricePerShare, "insufficient ETH");
        }

        _createOrder(
            eventId,
            _msgSender(),
            pricePerShare,
            pricePerShare,
            currency,
            expirationTime,
            EventTypes.OrderType.BUY,
            EventTypes.TradingType.INVESTOR_SHARES,
            shareAmount,
            pricePerShare
        );
    }

    function _createOrder(
        uint256 eventId,
        address creator,
        uint256 minPrice,
        uint256 maxPrice,
        address currency,
        uint256 expirationTime,
        EventTypes.OrderType orderType,
        EventTypes.TradingType tradingType,
        uint256 shareAmount,
        uint256 pricePerShare
    ) internal returns (uint256) {
        uint256 finalExpiration = expirationTime == 0 ? block.timestamp + orderExpirationTime : expirationTime;
        
        _orderIds.increment();
        uint256 orderId = _orderIds.current();

        orders[orderId] = EventTypes.TradingOrder({
            orderId: orderId,
            eventId: eventId,
            creator: creator,
            counterparty: address(0),
            minPrice: minPrice,
            maxPrice: maxPrice,
            filledPrice: 0,
            currency: currency,
            expirationTime: finalExpiration,
            orderType: orderType,
            status: EventTypes.OrderStatus.ACTIVE,
            tradingType: tradingType,
            shareAmount: shareAmount,
            pricePerShare: pricePerShare,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            filledAt: 0
        });

        eventOrders[eventId].push(orderId);
        userOrders[creator].push(orderId);
        
        if (orderType == EventTypes.OrderType.BUY) {
            activeBuyOrders[eventId].push(orderId);
        } else {
            activeSellOrders[eventId].push(orderId);
        }

        emit OrderCreated(orderId, eventId, creator, orderType);
        return orderId;
    }

    function updateOrder(
        uint256 orderId,
        uint256 newMinPrice,
        uint256 newMaxPrice,
        uint256 newExpirationTime
    ) external {
        require(orders[orderId].creator == _msgSender(), "not order creator");
        require(orders[orderId].status == EventTypes.OrderStatus.ACTIVE, "order not active");
        require(newMinPrice <= newMaxPrice, "invalid price range");
        require(newExpirationTime == 0 || newExpirationTime > block.timestamp, "invalid expiration");

        orders[orderId].minPrice = newMinPrice;
        orders[orderId].maxPrice = newMaxPrice;
        orders[orderId].expirationTime = newExpirationTime;
        orders[orderId].updatedAt = block.timestamp;

        emit OrderUpdated(orderId, newMinPrice, newMaxPrice, newExpirationTime);
    }

    function cancelOrder(uint256 orderId) external {
        require(orders[orderId].creator == _msgSender(), "not order creator");
        require(orders[orderId].status == EventTypes.OrderStatus.ACTIVE, "order not active");

        orders[orderId].status = EventTypes.OrderStatus.CANCELLED;
        orders[orderId].updatedAt = block.timestamp;

        emit OrderCancelled(orderId);
    }

    // ============ INTERNAL FUNCTIONS ============

    function _generateConfirmationCode(uint256 eventId, address attendee) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "REVENT-",
            Strings.toString(eventId),
            "-",
            Strings.toHexString(uint160(attendee), 20)
        ));
    }

    // ============ VIEW FUNCTIONS ============

    function getEvent(uint256 eventId) external view returns (EventTypes.EventData memory) {
        return eventsContract.getEvent(eventId);
    }

    function eventExistsCheck(uint256 eventId) external view returns (bool) {
        return eventsContract.eventExistsCheck(eventId);
    }

    function getEventStatus(uint256 eventId) external view returns (EventTypes.EventStatus) {
        return eventsContract.getEventStatus(eventId);
    }

    function getEventCreator(uint256 eventId) external view returns (address) {
        return eventsContract.getEvent(eventId).creator;
    }

    function getDomaTokenId(uint256 eventId) external view returns (uint256) {
        return eventToDomaTokenId[eventId];
    }

    function getDomaStatus(uint256 eventId) external view returns (uint8) {
        return eventToDomaStatus[eventId];
    }

    function getRevenueAccrued(uint256 eventId) external view returns (uint256) {
        return revenueAccrued[eventId];
    }

    function getRevenueClaimed(uint256 eventId, address investor) external view returns (uint256) {
        return revenueClaimed[eventId][investor];
    }

    function getInvestorShareBalance(uint256 eventId, address investor) external view returns (uint256) {
        return investorShares[eventId][investor];
    }

    function getTotalInvested(uint256 eventId) external view returns (uint256) {
        return totalInvested[eventId];
    }

    function getEventInvestors(uint256 eventId) external view returns (address[] memory) {
        return eventInvestors[eventId];
    }

    function isInvestor(uint256 eventId, address investor) external view returns (bool) {
        return isEventInvestor[eventId][investor];
    }

    // Price Manager view functions
    function getPricingInfo(uint256 eventId) external view returns (
        uint256 basePrice,
        uint256 currentMultiplier,
        uint256 currentPrice,
        uint256 totalValue,
        uint256 shareSupply
    ) {
        basePrice = eventShareBasePrice[eventId];
        currentMultiplier = eventShareMultiplier[eventId];
        currentPrice = this.getCurrentSharePrice(eventId);
        totalValue = eventTotalValue[eventId];
        shareSupply = eventShareSupply[eventId];
    }

    // Volume Manager view functions
    function getTradingInfo(uint256 eventId) external view returns (
        uint256 totalVolume,
        uint256 buyVolume,
        uint256 sellVolume,
        uint256 momentumFactor,
        uint256 buyRatio,
        uint256 sellRatio
    ) {
        totalVolume = eventTradingVolume[eventId];
        buyVolume = eventBuyVolume[eventId];
        sellVolume = eventSellVolume[eventId];
        momentumFactor = eventPriceMomentum[eventId];
        
        if (totalVolume > 0) {
            buyRatio = (buyVolume * 10000) / totalVolume;
            sellRatio = 10000 - buyRatio;
        } else {
            buyRatio = 5000;
            sellRatio = 5000;
        }
    }

    // Order Manager view functions
    function getOrder(uint256 orderId) external view returns (EventTypes.TradingOrder memory) {
        return orders[orderId];
    }

    function getActiveBuyOrders(uint256 eventId) external view returns (uint256[] memory) {
        return activeBuyOrders[eventId];
    }

    function getActiveSellOrders(uint256 eventId) external view returns (uint256[] memory) {
        return activeSellOrders[eventId];
    }

    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }

    function getEventOrders(uint256 eventId) external view returns (uint256[] memory) {
        return eventOrders[eventId];
    }

    // ============ EMERGENCY FUNCTIONS ============

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "no balance");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "withdraw failed");
    }

    function emergencyWithdrawToken(address token) external onlyOwner {
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance > 0, "no token balance");
        require(tokenContract.transfer(owner(), balance), "token transfer failed");
    }
}