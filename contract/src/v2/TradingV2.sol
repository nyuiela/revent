// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./DomaIntegrationV2.sol";
import "../events/Modifiers.sol";
import "../events/Events.sol";
import "../events/Types.sol";
import "../events/PriceManager.sol";
import "../events/VolumeManager.sol";
import "../events/OrderManager.sol";
import "../doma/interfaces/IOwnershipToken.sol";

abstract contract TradingV2 is ReentrancyGuardUpgradeable, DomaIntegrationV2 {
    using Counters for Counters.Counter;

    function __TradingV2_init() internal onlyInitializing {
        __ReentrancyGuard_init();
    }

    // ============ PRICE MANAGEMENT ============
    function _owner() internal view virtual returns (address) {
        return owner();
    }

    function initializeDynamicPricing(uint256 eventId, uint256 basePricePerShare) external eventExists(eventId) onlyEventCreator(eventId) {
        require(basePricePerShare > 0, "invalid base price");
        require(eventShareBasePrice[eventId] == 0, "already initialized");
        
        eventShareBasePrice[eventId] = basePricePerShare;
        eventShareMultiplier[eventId] = 1e18; // 1.0 as 18 decimal fixed point
        eventTotalValue[eventId] = 0;
        eventShareSupply[eventId] = 0;
        lastPriceUpdate[eventId] = block.timestamp;
    }

    function updateEventPrice(uint256 eventId) external eventExists(eventId) {
        require(eventShareBasePrice[eventId] > 0, "dynamic pricing not initialized");
        
        uint256 timeElapsed = block.timestamp - lastPriceUpdate[eventId];
        if (timeElapsed < 1 hours) return; // Only update every hour
        
        uint256 currentPrice = getCurrentSharePrice(eventId);
        uint256 newMultiplier = calculateNewMultiplier(eventId, currentPrice);
        
        eventShareMultiplier[eventId] = newMultiplier;
        lastPriceUpdate[eventId] = block.timestamp;
    }

    function getCurrentSharePrice(uint256 eventId) public view eventExists(eventId) returns (uint256) {
        if (eventShareBasePrice[eventId] == 0) return 0;
        return (eventShareBasePrice[eventId] * eventShareMultiplier[eventId]) / 1e18;
    }

    function calculateNewMultiplier(uint256 eventId, uint256 currentPrice) internal view returns (uint256) {
        // Simple price momentum calculation
        uint256 momentum = eventPriceMomentum[eventId];
        uint256 adjustment = (momentum * 1e15) / 1e18; // 0.1% max adjustment per hour
        return eventShareMultiplier[eventId] + adjustment;
    }

    // ============ VOLUME MANAGEMENT ============
    function updateTradingVolume(uint256 eventId, uint256 amount, bool isBuy) external {
        eventTradingVolume[eventId] += amount;
        if (isBuy) {
            eventBuyVolume[eventId] += amount;
        } else {
            eventSellVolume[eventId] += amount;
        }
        eventLastTradingUpdate[eventId] = block.timestamp;
    }

    // ============ ORDER MANAGEMENT ============
    function createBuyOrder(uint256 eventId, uint256 maxPricePerShare, uint256 shareAmount) external payable nonReentrant eventExists(eventId) {
        require(shareAmount > 0, "Invalid share amount");
        require(maxPricePerShare > 0, "Invalid price");
        
        uint256 totalValue = maxPricePerShare * shareAmount;
        require(msg.value >= totalValue, "Insufficient payment");
        
        _orderIds.increment();
        uint256 orderId = _orderIds.current();
        
        orders[orderId] = EventTypes.TradingOrder({
            orderId: orderId,
            eventId: eventId,
            creator: _msgSender(),
            counterparty: address(0),
            minPrice: maxPricePerShare,
            maxPrice: maxPricePerShare,
            filledPrice: 0,
            currency: address(0),
            expirationTime: block.timestamp + orderExpirationTime,
            orderType: EventTypes.OrderType.BUY,
            status: EventTypes.OrderStatus.ACTIVE,
            tradingType: EventTypes.TradingType.INVESTOR_SHARES,
            shareAmount: shareAmount,
            pricePerShare: maxPricePerShare,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            filledAt: 0
        });
        
        eventOrders[eventId].push(orderId);
        userOrders[_msgSender()].push(orderId);
        activeBuyOrders[eventId].push(orderId);
        
        emit EventEvents.OrderCreated(orderId, eventId, _msgSender(), EventTypes.OrderType.BUY, maxPricePerShare, maxPricePerShare, address(0), block.timestamp + orderExpirationTime);
    }

    function createSellOrder(uint256 eventId, uint256 minPricePerShare, uint256 shareAmount) external nonReentrant eventExists(eventId) {
        require(shareAmount > 0, "Invalid share amount");
        require(minPricePerShare > 0, "Invalid price");
        
        _orderIds.increment();
        uint256 orderId = _orderIds.current();
        
        orders[orderId] = EventTypes.TradingOrder({
            orderId: orderId,
            eventId: eventId,
            creator: _msgSender(),
            counterparty: address(0),
            minPrice: minPricePerShare,
            maxPrice: minPricePerShare,
            filledPrice: 0,
            currency: address(0),
            expirationTime: block.timestamp + orderExpirationTime,
            orderType: EventTypes.OrderType.SELL,
            status: EventTypes.OrderStatus.ACTIVE,
            tradingType: EventTypes.TradingType.INVESTOR_SHARES,
            shareAmount: shareAmount,
            pricePerShare: minPricePerShare,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            filledAt: 0
        });
        
        eventOrders[eventId].push(orderId);
        userOrders[_msgSender()].push(orderId);
        activeSellOrders[eventId].push(orderId);
        
        emit EventEvents.OrderCreated(orderId, eventId, _msgSender(), EventTypes.OrderType.SELL, minPricePerShare, minPricePerShare, address(0), block.timestamp + orderExpirationTime);
    }

    // ============ HELPER FUNCTIONS ============
    function _createOrder(
        uint256 eventId,
        address user,
        EventTypes.OrderType orderType,
        uint256 shareAmount,
        uint256 pricePerShare
    ) internal returns (uint256) {
        _orderIds.increment();
        uint256 orderId = _orderIds.current();
        
        orders[orderId] = EventTypes.TradingOrder({
            orderId: orderId,
            eventId: eventId,
            creator: user,
            counterparty: address(0),
            minPrice: pricePerShare,
            maxPrice: pricePerShare,
            filledPrice: 0,
            currency: address(0),
            expirationTime: block.timestamp + orderExpirationTime,
            orderType: orderType,
            status: EventTypes.OrderStatus.ACTIVE,
            tradingType: EventTypes.TradingType.INVESTOR_SHARES,
            shareAmount: shareAmount,
            pricePerShare: pricePerShare,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            filledAt: 0
        });
        
        eventOrders[eventId].push(orderId);
        userOrders[user].push(orderId);
        
        if (orderType == EventTypes.OrderType.BUY) {
            activeBuyOrders[eventId].push(orderId);
        } else {
            activeSellOrders[eventId].push(orderId);
        }
        
        return orderId;
    }

    function _removeFromActiveOrders(uint256 eventId, uint256 orderId, EventTypes.OrderType orderType) internal {
        if (orderType == EventTypes.OrderType.BUY) {
            _removeFromArray(activeBuyOrders[eventId], orderId);
        } else {
            _removeFromArray(activeSellOrders[eventId], orderId);
        }
    }

    function _removeFromArray(uint256[] storage array, uint256 value) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == value) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

    function _updateSharePrice(uint256 eventId) internal {
        // Update current price based on recent trades
        eventCurrentPrice[eventId] = getCurrentSharePrice(eventId);
    }

    function _updateTradingVolume(uint256 eventId, uint256 amount, bool isBuy) internal {
        eventTradingVolume[eventId] += amount;
        if (isBuy) {
            eventBuyVolume[eventId] += amount;
        } else {
            eventSellVolume[eventId] += amount;
        }
        eventLastTradingUpdate[eventId] = block.timestamp;
    }


    function _generateConfirmationCode(uint256 eventId, address attendee) internal virtual override returns (string memory) {
        return super._generateConfirmationCode(eventId, attendee);
    }

    // ============ DOMAIN TRADING ============

    /**
     * @dev Create a sell order for an event domain
     */
    function createSellOrder(
        uint256 eventId,
        uint256 minPrice,
        uint256 maxPrice,
        address currency,
        uint256 expirationTime
    ) external payable eventExists(eventId) nonReentrant {
        require(ownershipToken != address(0), "ownership not set");
        require(IOwnershipToken(ownershipToken).ownerOf(eventToDomaTokenId[eventId]) == _msgSender(), "not owner");
        require(minPrice >= minOrderValue, "price too low");
        require(maxPrice <= maxOrderValue, "price too high");
        require(minPrice <= maxPrice, "invalid price range");
        require(expirationTime == 0 || expirationTime > block.timestamp, "invalid expiration");

        _createOrder(
            eventId,
            _msgSender(),
            EventTypes.OrderType.SELL,
            0, // shareAmount
            minPrice // pricePerShare
        );
    }

    /**
     * @dev Create a buy order for an event domain
     */
    function createBuyOrder(
        uint256 eventId,
        uint256 maxPrice,
        address currency,
        uint256 expirationTime
    ) external payable eventExists(eventId) nonReentrant {
        require(maxPrice >= minOrderValue, "price too low");
        require(maxPrice <= maxOrderValue, "price too high");
        require(expirationTime == 0 || expirationTime > block.timestamp, "invalid expiration");

        if (currency == address(0)) {
            require(msg.value >= maxPrice, "insufficient ETH");
        }

        _createOrder(
            eventId,
            _msgSender(),
            EventTypes.OrderType.BUY,
            0, // shareAmount
            maxPrice // pricePerShare
        );
    }

    // ============ INVESTOR SHARE TRADING ============

    /**
     * @dev Create a sell order for investor shares
     */
    function createInvestorShareSellOrder(
        uint256 eventId,
        uint256 shareAmount,
        uint256 pricePerShare,
        address currency,
        uint256 expirationTime
    ) external payable eventExists(eventId) nonReentrant {
        require(investorShares[eventId][_msgSender()] >= shareAmount, "insufficient shares");
        require(shareAmount > 0, "invalid share amount");
        require(pricePerShare > 0, "invalid price");
        require(expirationTime == 0 || expirationTime > block.timestamp, "invalid expiration");
        require(eventShareBasePrice[eventId] > 0, "dynamic pricing not initialized");

        // Get current dynamic price and validate
        uint256 currentPrice = this.getCurrentSharePrice(eventId);
        require(pricePerShare >= (currentPrice * 5000) / 10000, "price too low");
        require(pricePerShare <= (currentPrice * 100000) / 10000, "price too high");

        uint256 totalPrice = shareAmount * pricePerShare;
        require(totalPrice >= minOrderValue, "total price too low");
        require(totalPrice <= maxOrderValue, "total price too high");

        _createOrder(
            eventId,
            _msgSender(),
            EventTypes.OrderType.SELL,
            shareAmount,
            pricePerShare
        );
    }

    /**
     * @dev Create a buy order for investor shares
     */
    function createInvestorShareBuyOrder(
        uint256 eventId,
        uint256 shareAmount,
        uint256 pricePerShare,
        address currency,
        uint256 expirationTime
    ) external payable eventExists(eventId) nonReentrant {
        require(shareAmount > 0, "invalid share amount");
        require(pricePerShare > 0, "invalid price");
        require(expirationTime == 0 || expirationTime > block.timestamp, "invalid expiration");
        require(eventShareBasePrice[eventId] > 0, "dynamic pricing not initialized");

        // Get current dynamic price and validate
        uint256 currentPrice = this.getCurrentSharePrice(eventId);
        require(pricePerShare >= (currentPrice * 5000) / 10000, "price too low");
        require(pricePerShare <= (currentPrice * 100000) / 10000, "price too high");

        uint256 totalPrice = shareAmount * pricePerShare;
        require(totalPrice >= minOrderValue, "total price too low");
        require(totalPrice <= maxOrderValue, "total price too high");

        if (currency == address(0)) {
            require(msg.value >= totalPrice, "insufficient ETH");
        }

        _createOrder(
            eventId,
            _msgSender(),
            EventTypes.OrderType.BUY,
            shareAmount,
            pricePerShare
        );
    }

    // ============ TRADE EXECUTION ============

    /**
     * @dev Execute a trade by matching buy and sell orders
     */
    function executeTrade(
        uint256 buyOrderId,
        uint256 sellOrderId,
        uint256 executionPrice
    ) external payable nonReentrant {
        EventTypes.TradingOrder storage buyOrder = orders[buyOrderId];
        EventTypes.TradingOrder storage sellOrder = orders[sellOrderId];

        require(buyOrder.status == EventTypes.OrderStatus.ACTIVE, "buy order not active");
        require(sellOrder.status == EventTypes.OrderStatus.ACTIVE, "sell order not active");
        require(buyOrder.eventId == sellOrder.eventId, "different events");
        require(buyOrder.currency == sellOrder.currency, "currency mismatch");
        require(executionPrice >= sellOrder.minPrice && executionPrice <= sellOrder.maxPrice, "price out of sell range");
        require(executionPrice <= buyOrder.maxPrice, "price exceeds buy limit");
        require(block.timestamp <= buyOrder.expirationTime, "buy order expired");
        require(block.timestamp <= sellOrder.expirationTime, "sell order expired");

        // Verify ownership based on trading type
        if (buyOrder.tradingType == EventTypes.TradingType.DOMAIN) {
            require(ownershipToken != address(0), "ownership not set");
            require(IOwnershipToken(ownershipToken).ownerOf(eventToDomaTokenId[buyOrder.eventId]) == sellOrder.creator, "not owner");
        } else if (buyOrder.tradingType == EventTypes.TradingType.INVESTOR_SHARES) {
            require(investorShares[buyOrder.eventId][sellOrder.creator] >= sellOrder.shareAmount, "insufficient shares");
        }

        _executeTradeInternal(buyOrderId, sellOrderId, executionPrice, buyOrder.currency);
    }

    /**
     * @dev Internal trade execution
     */
    function _executeTradeInternal(
        uint256 buyOrderId,
        uint256 sellOrderId,
        uint256 executionPrice,
        address currency
    ) internal {
        EventTypes.TradingOrder storage buyOrder = orders[buyOrderId];
        EventTypes.TradingOrder storage sellOrder = orders[sellOrderId];

        // Check investor approval if required (for domain sales)
        if (buyOrder.tradingType == EventTypes.TradingType.DOMAIN && 
            requireInvestorApproval[buyOrder.eventId] && 
            !isInvestorApprovalMet(buyOrder.eventId)) {
            emit DomainSaleBlocked(buyOrder.eventId, sellOrderId, "Investor approval threshold not met");
            return;
        }

        // Update order status
        buyOrder.status = EventTypes.OrderStatus.FILLED;
        buyOrder.counterparty = sellOrder.creator;
        buyOrder.filledPrice = executionPrice;
        buyOrder.filledAt = block.timestamp;
        buyOrder.updatedAt = block.timestamp;

        sellOrder.status = EventTypes.OrderStatus.FILLED;
        sellOrder.counterparty = buyOrder.creator;
        sellOrder.filledPrice = executionPrice;
        sellOrder.filledAt = block.timestamp;
        sellOrder.updatedAt = block.timestamp;

        // Remove from active orders
        _removeFromActiveOrders(buyOrder.eventId, buyOrderId, EventTypes.OrderType.BUY);
        _removeFromActiveOrders(sellOrder.eventId, sellOrderId, EventTypes.OrderType.SELL);

        // Handle different trading types
        if (buyOrder.tradingType == EventTypes.TradingType.DOMAIN) {
            _executeDomainTrade(buyOrder, sellOrder, executionPrice, currency);
        } else if (buyOrder.tradingType == EventTypes.TradingType.INVESTOR_SHARES) {
            _executeShareTrade(buyOrder, sellOrder, executionPrice, currency);
        }

        // Update market price
        eventCurrentPrice[buyOrder.eventId] = executionPrice;

        // Emit trade events
        emit OrderFilled(sellOrderId, buyOrder.eventId, sellOrder.creator, buyOrder.creator, executionPrice, currency, 0);
        emit TradeExecuted(0, buyOrder.eventId, sellOrderId, sellOrder.creator, buyOrder.creator, executionPrice, currency, block.timestamp);
    }

    /**
     * @dev Execute domain trade with investor distribution
     */
    function _executeDomainTrade(
        EventTypes.TradingOrder storage buyOrder,
        EventTypes.TradingOrder storage sellOrder,
        uint256 executionPrice,
        address currency
    ) internal {
        // Calculate fees and distribution
        uint256 tradingFee = (executionPrice * tradingFeeBps) / 10000;
        uint256 netAmount = executionPrice - tradingFee;
        
        // Calculate investor and creator shares
        uint256 totalShares = totalInvested[buyOrder.eventId];
        uint256 investorOwnedShares = totalInvestorShares[buyOrder.eventId];
        uint256 investorOwnershipBps = totalShares > 0 ? (investorOwnedShares * 10000) / totalShares : 0;
        uint256 creatorOwnershipBps = 10000 - investorOwnershipBps;
        
        uint256 investorShare = (netAmount * investorOwnershipBps) / 10000;
        uint256 creatorShare = (netAmount * creatorOwnershipBps) / 10000;

        // Distribute proceeds
        _distributeProceeds(buyOrder.eventId, creatorShare, investorShare, tradingFee, currency);

        // Update event total value for dynamic pricing
        eventTotalValue[buyOrder.eventId] = executionPrice;
        _updateSharePrice(buyOrder.eventId);

        emit EventDomainSold(buyOrder.eventId, sellOrder.creator, buyOrder.creator, executionPrice, currency, 0);
    }

    /**
     * @dev Execute share trade with volume tracking
     */
    function _executeShareTrade(
        EventTypes.TradingOrder storage buyOrder,
        EventTypes.TradingOrder storage sellOrder,
        uint256 executionPrice,
        address currency
    ) internal {
        // Transfer shares
        investorShares[buyOrder.eventId][sellOrder.creator] -= sellOrder.shareAmount;
        investorShares[buyOrder.eventId][buyOrder.creator] += sellOrder.shareAmount;

        // Update trading volume and momentum
        _updateTradingVolume(buyOrder.eventId, executionPrice, true);

        // Update share price based on trading activity (momentum will be applied)
        _updateSharePrice(buyOrder.eventId);

        // Handle payment
        uint256 tradingFee = (executionPrice * tradingFeeBps) / 10000;
        uint256 netAmount = executionPrice - tradingFee;

        if (currency == address(0)) {
            require(msg.value >= executionPrice, "insufficient ETH");
            (bool success1, ) = payable(sellOrder.creator).call{value: netAmount}("");
            require(success1, "payment to seller failed");

            if (tradingFee > 0) {
                (bool success2, ) = payable(feeRecipient == address(0) ? owner() : feeRecipient).call{value: tradingFee}("");
                require(success2, "fee payment failed");
            }

            if (msg.value > executionPrice) {
                (bool success3, ) = payable(buyOrder.creator).call{value: msg.value - executionPrice}("");
                require(success3, "refund failed");
            }
        } else {
            IERC20 token = IERC20(currency);
            require(token.transferFrom(buyOrder.creator, sellOrder.creator, netAmount), "token transfer failed");
            
            if (tradingFee > 0) {
                require(token.transferFrom(buyOrder.creator, feeRecipient == address(0) ? owner() : feeRecipient, tradingFee), "fee transfer failed");
            }
        }

        emit InvestorSharesTransferred(buyOrder.eventId, sellOrder.creator, buyOrder.creator, sellOrder.shareAmount, sellOrder.pricePerShare);
    }

    /**
     * @dev Distribute proceeds to creator, investors, and platform
     */
    function _distributeProceeds(
        uint256 eventId,
        uint256 creatorShare,
        uint256 investorShare,
        uint256 platformFee,
        address currency
    ) internal {
        // Pay creator
        if (creatorShare > 0) {
            if (currency == address(0)) {
                (bool success, ) = payable(events[eventId].creator).call{value: creatorShare}("");
                require(success, "creator payment failed");
            } else {
                IERC20 token = IERC20(currency);
                require(token.transfer(events[eventId].creator, creatorShare), "creator token transfer failed");
            }
        }

        // Pay platform fee
        if (platformFee > 0) {
            if (currency == address(0)) {
                (bool success, ) = payable(feeRecipient == address(0) ? owner() : feeRecipient).call{value: platformFee}("");
                require(success, "platform fee payment failed");
            } else {
                IERC20 token = IERC20(currency);
                require(token.transfer(feeRecipient == address(0) ? owner() : feeRecipient, platformFee), "platform fee transfer failed");
            }
        }

        // Distribute to investors (efficient version)
        if (investorShare > 0 && totalInvestorShares[eventId] > 0) {
            address[] storage investors = eventInvestors[eventId];
            for (uint256 i = 0; i < investors.length; i++) {
                address investor = investors[i];
                uint256 investorSharesAmount = investorShares[eventId][investor];
                if (investorSharesAmount > 0) {
                    uint256 investorPayout = (investorShare * investorSharesAmount) / totalInvestorShares[eventId];
                    if (investorPayout > 0) {
                        if (currency == address(0)) {
                            (bool success, ) = payable(investor).call{value: investorPayout}("");
                            if (success) {
                                emit InvestorSaleDistributionExecuted(eventId, 0, investor, investorPayout, currency);
                            }
                        } else {
                            IERC20 token = IERC20(currency);
                            if (token.transfer(investor, investorPayout)) {
                                emit InvestorSaleDistributionExecuted(eventId, 0, investor, investorPayout, currency);
                            }
                        }
                    }
                }
            }
        }
    }

    // ============ INVESTOR PROTECTION ============

    function setInvestorApprovalRequired(uint256 eventId, bool required, uint256 thresholdBps) external eventExists(eventId) onlyEventCreator(eventId) {
        require(!required || thresholdBps <= 10000, "invalid threshold");
        requireInvestorApproval[eventId] = required;
        investorApprovalThreshold[eventId] = thresholdBps;
        emit InvestorApprovalRequired(eventId, required, thresholdBps);
    }

    function giveInvestorApproval(uint256 eventId, bool approved) external eventExists(eventId) {
        require(investorShares[eventId][_msgSender()] > 0, "not an investor");
        require(requireInvestorApproval[eventId], "approval not required");
        
        EventTypes.InvestorApproval storage approval = investorApprovals[eventId][_msgSender()];
        uint256 investorWeight = investorShares[eventId][_msgSender()];
        
        if (approval.approved != approved) {
            if (approved) {
                totalInvestorApprovals[eventId] += investorWeight;
            } else {
                totalInvestorApprovals[eventId] -= investorWeight;
            }
        }
        
        approval.approved = approved;
        approval.timestamp = block.timestamp;
        
        emit InvestorApprovalGiven(eventId, _msgSender(), approved, investorWeight);
    }

    function isInvestorApprovalMet(uint256 eventId) public view returns (bool) {
        if (!requireInvestorApproval[eventId]) return true;
        uint256 totalWeight = totalInvested[eventId];
        if (totalWeight == 0) return true;
        uint256 approvalWeight = totalInvestorApprovals[eventId];
        uint256 threshold = (totalWeight * investorApprovalThreshold[eventId]) / 10000;
        return approvalWeight >= threshold;
    }

    // ============ VIEW FUNCTIONS ============

    function getEventMarketPrice(uint256 eventId) external view returns (uint256) {
        return eventCurrentPrice[eventId];
    }

    function getInvestorShareBalance(uint256 eventId, address investor) external view returns (uint256) {
        return investorShares[eventId][investor];
    }

    function getTotalInvested(uint256 eventId) external view override returns (uint256) {
        return totalInvested[eventId];
    }

    function getEventInvestors(uint256 eventId) external view override returns (address[] memory) {
        return eventInvestors[eventId];
    }

    function isInvestor(uint256 eventId, address investor) external view returns (bool) {
        return isEventInvestor[eventId][investor];
    }

}
