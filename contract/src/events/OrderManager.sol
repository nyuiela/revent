// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../utils/counter.sol";
import "./Modifiers.sol";
import "./Events.sol";
import "./Types.sol";

abstract contract OrderManager is EventModifiers {
    using Counters for Counters.Counter;
    function _owner() internal view virtual returns (address);

    // ============ ORDER CREATION ============

    /**
     * @dev Create a trading order (unified for both domain and share trading)
     */
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

        emit EventEvents.OrderCreated(
            orderId,
            eventId,
            creator,
            orderType,
            minPrice,
            maxPrice,
            currency,
            finalExpiration
        );

        return orderId;
    }

    /**
     * @dev Update an existing order
     */
    function updateOrder(
        uint256 orderId,
        uint256 newMinPrice,
        uint256 newMaxPrice,
        uint256 newExpirationTime
    ) external {
        EventTypes.TradingOrder storage order = orders[orderId];
        require(order.creator == _msgSender(), "not order creator");
        require(order.status == EventTypes.OrderStatus.ACTIVE, "order not active");
        require(newMinPrice <= newMaxPrice, "invalid price range");
        require(newExpirationTime == 0 || newExpirationTime > block.timestamp, "invalid expiration");

        order.minPrice = newMinPrice;
        order.maxPrice = newMaxPrice;
        if (newExpirationTime > 0) {
            order.expirationTime = newExpirationTime;
        }
        order.updatedAt = block.timestamp;

        emit EventEvents.OrderUpdated(
            orderId,
            order.eventId,
            _msgSender(),
            newMinPrice,
            newMaxPrice,
            newExpirationTime == 0 ? order.expirationTime : newExpirationTime
        );
    }

    /**
     * @dev Cancel an existing order
     */
    function cancelOrder(uint256 orderId) external {
        EventTypes.TradingOrder storage order = orders[orderId];
        require(order.creator == _msgSender(), "not order creator");
        require(order.status == EventTypes.OrderStatus.ACTIVE, "order not active");

        order.status = EventTypes.OrderStatus.CANCELLED;
        order.updatedAt = block.timestamp;

        _removeFromActiveOrders(order.eventId, orderId, order.orderType);

        // Refund ETH if it's a buy order
        if (order.orderType == EventTypes.OrderType.BUY && order.currency == address(0)) {
            (bool success, ) = payable(_msgSender()).call{value: order.maxPrice}("");
            require(success, "refund failed");
        }

        emit EventEvents.OrderCancelled(orderId, order.eventId, _msgSender(), order.orderType);
    }

    /**
     * @dev Remove order from active orders arrays
     */
    function _removeFromActiveOrders(uint256 eventId, uint256 orderId, EventTypes.OrderType orderType) internal {
        if (orderType == EventTypes.OrderType.BUY) {
            uint256[] storage buyOrders = activeBuyOrders[eventId];
            for (uint256 i = 0; i < buyOrders.length; i++) {
                if (buyOrders[i] == orderId) {
                    buyOrders[i] = buyOrders[buyOrders.length - 1];
                    buyOrders.pop();
                    break;
                }
            }
        } else {
            uint256[] storage sellOrders = activeSellOrders[eventId];
            for (uint256 i = 0; i < sellOrders.length; i++) {
                if (sellOrders[i] == orderId) {
                    sellOrders[i] = sellOrders[sellOrders.length - 1];
                    sellOrders.pop();
                    break;
                }
            }
        }
    }

    // ============ VIEW FUNCTIONS ============

    function getOrder(uint256 orderId) external view returns (EventTypes.TradingOrder memory) {
        return orders[orderId];
    }

    function getEventOrders(uint256 eventId) external view returns (uint256[] memory) {
        return eventOrders[eventId];
    }

    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }

    function getActiveBuyOrders(uint256 eventId) external view returns (uint256[] memory) {
        return activeBuyOrders[eventId];
    }

    function getActiveSellOrders(uint256 eventId) external view returns (uint256[] memory) {
        return activeSellOrders[eventId];
    }
}
