// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library EventTypes {
    enum EventStatus {
        DRAFT,
        PUBLISHED,
        LIVE,
        COMPLETED,
        CANCELLED
    }

    struct EventMetadata {
        string title;
        string description;
        string location;
        string category;
        string[] tags;
        string imageUrl;
        string streamUrl;
        uint256 latitude;
        uint256 longitude;
    }

    struct EventData {
        uint256 eventId;
        address creator;
        string ipfsHash;
        uint256 startTime;
        uint256 endTime;
        uint256 maxAttendees;
        uint256 currentAttendees;
        bool isVIP;
        bool isActive;
        bool isLive;
        EventStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct AttendeeData {
        address attendeeAddress;
        uint256 eventId;
        bool isConfirmed;
        bool hasAttended;
        uint256 registeredAt;
        uint256 confirmedAt;
    }

    struct TicketData {
        uint256 ticketId;
        uint256 eventId;
        string name; // e.g., "General Admission"
        string ticketType; // e.g., "VIP", "EARLY_BIRD"
        uint256 price; // in wei if sold onchain; 0 for free
        string currency; // e.g., "NATIVE" or metadata like "USD"
        uint256 totalQuantity; // 0 means unlimited
        uint256 soldQuantity;
        string[] perks; // textual perks/benefits
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    enum OrderType {
        BUY,
        SELL
    }

    enum OrderStatus {
        ACTIVE,
        FILLED,
        CANCELLED,
        EXPIRED
    }

    enum TradingType {
        DOMAIN,
        INVESTOR_SHARES
    }

    struct TradingOrder {
        uint256 orderId;
        uint256 eventId;
        address creator;
        address counterparty; // buyer for sell orders, seller for buy orders
        uint256 minPrice; // minimum acceptable price
        uint256 maxPrice; // maximum acceptable price
        uint256 filledPrice; // actual execution price
        address currency; // token address (address(0) for ETH)
        uint256 expirationTime;
        OrderType orderType;
        OrderStatus status;
        TradingType tradingType; // DOMAIN or INVESTOR_SHARES
        uint256 shareAmount; // for investor share trading (0 for domain trading)
        uint256 pricePerShare; // for investor share trading (0 for domain trading)
        uint256 createdAt;
        uint256 updatedAt;
        uint256 filledAt;
    }

    struct EventPriceRange {
        uint256 eventId;
        uint256 minPrice;
        uint256 maxPrice;
        address currency;
        bool isActive;
        uint256 updatedAt;
    }

    struct TradeHistory {
        uint256 tradeId;
        uint256 eventId;
        address seller;
        address buyer;
        uint256 price;
        address currency;
        uint256 timestamp;
        uint256 orderId;
    }

    struct InvestorSaleDistribution {
        uint256 eventId;
        uint256 tradeId;
        uint256 totalSalePrice;
        uint256 investorShare;
        uint256 creatorShare;
        uint256 platformFee;
        uint256 timestamp;
        bool distributed;
    }

    struct InvestorApproval {
        uint256 eventId;
        address investor;
        bool approved;
        uint256 timestamp;
    }

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
        string ipfsHash,
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

    event TicketCreated(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        string name,
        string ticketType,
        uint256 price,
        string currency,
        uint256 totalQuantity,
        string[] perks
    );

    event TicketPurchased(
        uint256 indexed ticketId, uint256 indexed eventId, address indexed buyer, uint256 quantity, uint256 totalPrice
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event TrustedForwarderUpdated(address oldForwarder, address newForwarder);
}
