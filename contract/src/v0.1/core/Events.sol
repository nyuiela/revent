// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {EventTypes} from "../structs/Types.sol";

library EventEvents {
    event EventCreated(
        uint256 indexed eventId,
        address indexed creator,
        string ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee
    );

    event EventUpdated(
        uint256 indexed eventId,
        address indexed creator,
        string newIpfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee
    );

    event EventStatusChanged(
        uint256 indexed eventId, EventTypes.EventStatus oldStatus, EventTypes.EventStatus newStatus
    );

    event AttendeeRegistered(
        uint256 indexed eventId, address indexed attendee, string confirmationCode, uint256 registrationFee
    );

    event AttendeeConfirmed(uint256 indexed eventId, address indexed attendee, string confirmationCode);

    event AttendeeAttended(uint256 indexed eventId, address indexed attendee);

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event RegistrationFeeLimitsUpdated(uint256 minFee, uint256 maxFee);

    // Ticketing
    event TicketAdded(
        uint256 indexed eventId,
        uint256 indexed ticketId,
        string name,
        string ticketType,
        uint256 price,
        string currency,
        uint256 totalQuantity
    );

    event TicketUpdated(
        uint256 indexed eventId,
        uint256 indexed ticketId,
        string name,
        string ticketType,
        uint256 price,
        string currency,
        uint256 totalQuantity,
        bool isActive
    );

    event TicketRemoved(uint256 indexed eventId, uint256 indexed ticketId);

    event TicketPurchased(uint256 indexed eventId, uint256 indexed ticketId, address indexed buyer, uint256 pricePaid);

    // Trading Events
    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed eventId,
        address indexed creator,
        EventTypes.OrderType orderType,
        uint256 minPrice,
        uint256 maxPrice,
        address currency,
        uint256 expirationTime
    );

    event OrderUpdated(
        uint256 indexed orderId,
        uint256 indexed eventId,
        address indexed creator,
        uint256 newMinPrice,
        uint256 newMaxPrice,
        uint256 newExpirationTime
    );

    event OrderCancelled(
        uint256 indexed orderId, uint256 indexed eventId, address indexed creator, EventTypes.OrderType orderType
    );

    event OrderExpired(
        uint256 indexed orderId, uint256 indexed eventId, address indexed creator, EventTypes.OrderType orderType
    );

    event OrderFilled(
        uint256 indexed orderId,
        uint256 indexed eventId,
        address indexed seller,
        address buyer,
        uint256 filledPrice,
        address currency,
        uint256 tradeId
    );

    event TradeExecuted(
        uint256 indexed tradeId,
        uint256 indexed eventId,
        uint256 indexed orderId,
        address seller,
        address buyer,
        uint256 price,
        address currency,
        uint256 timestamp
    );

    event EventDomainSold(
        uint256 indexed eventId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 price,
        address currency,
        uint256 tradeId
    );

    event EventPriceRangeSet(
        uint256 indexed eventId, address indexed setter, uint256 minPrice, uint256 maxPrice, address currency
    );

    event EventPriceRangeUpdated(
        uint256 indexed eventId,
        address indexed setter,
        uint256 oldMinPrice,
        uint256 newMinPrice,
        uint256 oldMaxPrice,
        uint256 newMaxPrice,
        address currency
    );

    event EventPriceRangeRemoved(uint256 indexed eventId, address indexed setter);

    event TradingFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);

    event OrderValueLimitsUpdated(uint256 minOrderValue, uint256 maxOrderValue);

    event OrderExpirationTimeUpdated(uint256 oldExpirationTime, uint256 newExpirationTime);

    event TradingFeeCollected(
        uint256 indexed eventId,
        uint256 indexed tradeId,
        address indexed feeRecipient,
        uint256 feeAmount,
        address currency
    );

    event OrderMatched(
        uint256 indexed buyOrderId,
        uint256 indexed sellOrderId,
        uint256 indexed eventId,
        uint256 matchedPrice,
        address currency
    );

    event MarketPriceUpdated(uint256 indexed eventId, uint256 oldPrice, uint256 newPrice, address currency);

    // Investor Protection Events
    event InvestorSaleShareSet(uint256 indexed eventId, uint256 investorShareBps, uint256 creatorShareBps);

    event InvestorApprovalRequired(uint256 indexed eventId, bool required, uint256 thresholdBps);

    event InvestorApprovalGiven(
        uint256 indexed eventId, address indexed investor, bool approved, uint256 approvalWeight
    );

    event InvestorSaleDistributionCreated(
        uint256 indexed eventId,
        uint256 indexed tradeId,
        uint256 totalSalePrice,
        uint256 investorShare,
        uint256 creatorShare,
        uint256 platformFee
    );

    event InvestorSaleDistributionExecuted(
        uint256 indexed eventId,
        uint256 indexed tradeId,
        address indexed investor,
        uint256 investorPayout,
        address currency
    );

    event InvestorSaleDistributionCompleted(
        uint256 indexed eventId, uint256 indexed tradeId, uint256 totalInvestorPayout, uint256 totalCreatorPayout
    );

    event DomainSaleBlocked(uint256 indexed eventId, uint256 indexed orderId, string reason);

    event InvestorValueProtected(
        uint256 indexed eventId, uint256 indexed tradeId, uint256 protectedValue, uint256 investorCount
    );

    // Investor Share Trading Events
    event InvestorShareOrderCreated(
        uint256 indexed orderId,
        uint256 indexed eventId,
        address indexed creator,
        EventTypes.OrderType orderType,
        uint256 shareAmount,
        uint256 pricePerShare,
        uint256 totalPrice,
        address currency,
        uint256 expirationTime
    );

    event InvestorShareOrderUpdated(
        uint256 indexed orderId,
        uint256 indexed eventId,
        address indexed creator,
        uint256 newShareAmount,
        uint256 newPricePerShare,
        uint256 newExpirationTime
    );

    event InvestorShareOrderCancelled(
        uint256 indexed orderId, uint256 indexed eventId, address indexed creator, EventTypes.OrderType orderType
    );

    event InvestorShareOrderFilled(
        uint256 indexed orderId,
        uint256 indexed eventId,
        address indexed seller,
        address buyer,
        uint256 shareAmount,
        uint256 pricePerShare,
        uint256 totalPrice,
        address currency,
        uint256 tradeId
    );

    event InvestorShareTradeExecuted(
        uint256 indexed tradeId,
        uint256 indexed eventId,
        uint256 indexed orderId,
        address seller,
        address buyer,
        uint256 shareAmount,
        uint256 pricePerShare,
        uint256 totalPrice,
        address currency,
        uint256 timestamp
    );

    event InvestorSharePriceUpdated(uint256 indexed eventId, uint256 oldPrice, uint256 newPrice, address currency);

    event InvestorSharesTransferred(
        uint256 indexed eventId, address indexed from, address indexed to, uint256 shareAmount, uint256 pricePerShare
    );
}
