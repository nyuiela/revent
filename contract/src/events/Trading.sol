// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./Modifiers.sol";
import "./Events.sol";
import "./Types.sol";
import "./PriceManager.sol";
import "./VolumeManager.sol";
import "./OrderManager.sol";
import "../doma/interfaces/IOwnershipToken.sol";

abstract contract EventTrading is ReentrancyGuard, EventModifiers, PriceManager, VolumeManager, OrderManager {
    using Counters for Counters.Counter;

    function _owner() internal view virtual override(PriceManager, VolumeManager, OrderManager) returns (address) {
        // This will be overridden by the main contract
        return address(0);
    }
    function _generateConfirmationCode(uint256 eventId, address attendee) internal virtual returns (string memory);

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
            0, // minPrice
            pricePerShare,
            currency,
            expirationTime,
            EventTypes.OrderType.BUY,
            EventTypes.TradingType.INVESTOR_SHARES,
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
            emit EventEvents.DomainSaleBlocked(buyOrder.eventId, sellOrderId, "Investor approval threshold not met");
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
        emit EventEvents.OrderFilled(sellOrderId, buyOrder.eventId, sellOrder.creator, buyOrder.creator, executionPrice, currency, 0);
        emit EventEvents.TradeExecuted(0, buyOrder.eventId, sellOrderId, sellOrder.creator, buyOrder.creator, executionPrice, currency, block.timestamp);
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

        emit EventEvents.EventDomainSold(buyOrder.eventId, sellOrder.creator, buyOrder.creator, executionPrice, currency, 0);
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
                (bool success2, ) = payable(feeRecipient == address(0) ? _owner() : feeRecipient).call{value: tradingFee}("");
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
                require(token.transferFrom(buyOrder.creator, feeRecipient == address(0) ? _owner() : feeRecipient, tradingFee), "fee transfer failed");
            }
        }

        emit EventEvents.InvestorSharesTransferred(buyOrder.eventId, sellOrder.creator, buyOrder.creator, sellOrder.shareAmount, sellOrder.pricePerShare);
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
                (bool success, ) = payable(feeRecipient == address(0) ? _owner() : feeRecipient).call{value: platformFee}("");
                require(success, "platform fee payment failed");
            } else {
                IERC20 token = IERC20(currency);
                require(token.transfer(feeRecipient == address(0) ? _owner() : feeRecipient, platformFee), "platform fee transfer failed");
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
                                emit EventEvents.InvestorSaleDistributionExecuted(eventId, 0, investor, investorPayout, currency);
                            }
                        } else {
                            IERC20 token = IERC20(currency);
                            if (token.transfer(investor, investorPayout)) {
                                emit EventEvents.InvestorSaleDistributionExecuted(eventId, 0, investor, investorPayout, currency);
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
        emit EventEvents.InvestorApprovalRequired(eventId, required, thresholdBps);
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
        
        emit EventEvents.InvestorApprovalGiven(eventId, _msgSender(), approved, investorWeight);
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

    function getTotalInvested(uint256 eventId) external view returns (uint256) {
        return totalInvested[eventId];
    }

    function getEventInvestors(uint256 eventId) external view returns (address[] memory) {
        return eventInvestors[eventId];
    }

    function isInvestor(uint256 eventId, address investor) external view returns (bool) {
        return isEventInvestor[eventId][investor];
    }
}