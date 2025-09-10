// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Modifiers.sol";
import "./Events.sol";
import "./Types.sol";

abstract contract VolumeManager is EventModifiers {
    function _owner() internal view virtual returns (address);

    /**
     * @dev Update trading volume and calculate momentum
     */
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

    /**
     * @dev Calculate price momentum based on buy/sell ratio
     */
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

    // ============ VIEW FUNCTIONS ============

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
}



