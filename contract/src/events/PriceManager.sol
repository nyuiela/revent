// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Modifiers.sol";
import "./Events.sol";
import "./Types.sol";

abstract contract PriceManager is EventModifiers {
    function _owner() internal view virtual returns (address);

    // ============ DYNAMIC PRICING CORE ============

    /**
     * @dev Initialize dynamic pricing for an event
     */
    function initializeDynamicPricing(uint256 eventId, uint256 basePricePerShare) external 
    // eventExists(eventId) onlyEventCreator(eventId) 
    {
        require(basePricePerShare > 0, "invalid base price");
        require(eventShareBasePrice[eventId] == 0, "already initialized");
        
        eventShareBasePrice[eventId] = basePricePerShare;
        eventShareMultiplier[eventId] = 10000; // 1.0x multiplier
        eventShareSupply[eventId] = totalInvested[eventId];
        lastPriceUpdate[eventId] = block.timestamp;
        
        emit EventEvents.InvestorSharePriceUpdated(eventId, 0, basePricePerShare, address(0));
    }

    /**
     * @dev Get current dynamic share price
     */
    function getCurrentSharePrice(uint256 eventId) external view returns (uint256) {
        if (eventShareBasePrice[eventId] == 0) return 0;
        return (eventShareBasePrice[eventId] * eventShareMultiplier[eventId]) / 10000;
    }

    /**
     * @dev Update event total value and trigger price update
     */
    function updateEventTotalValue(uint256 eventId, uint256 newTotalValue) external 
    // eventExists(eventId)
     {
        require(_msgSender() == _owner() || _msgSender() == events[eventId].creator, "unauthorized");
        require(newTotalValue > 0, "invalid value");
        
        eventTotalValue[eventId] = newTotalValue;
        _updateSharePrice(eventId);
    }

    /**
     * @dev Internal price update logic
     */
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
            emit EventEvents.InvestorSharePriceUpdated(eventId, oldPrice, newPrice, address(0));
        }
    }

    // ============ VIEW FUNCTIONS ============

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
}



