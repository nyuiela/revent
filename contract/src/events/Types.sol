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
        uint256 registrationFee;
        bool isActive;
        bool isLive;
        EventStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct AttendeeData {
        address attendeeAddress;
        uint256 eventId;
        string confirmationCode;
        bool isConfirmed;
        bool hasAttended;
        uint256 registeredAt;
        uint256 confirmedAt;
    }

    struct TicketData {
        uint256 ticketId;
        uint256 eventId;
        string name;            // e.g., "General Admission"
        string ticketType;      // e.g., "VIP", "EARLY_BIRD"
        uint256 price;          // in wei if sold onchain; 0 for free
        string currency;        // e.g., "NATIVE" or metadata like "USD"
        uint256 totalQuantity;  // 0 means unlimited
        uint256 soldQuantity;
        string[] perks;         // textual perks/benefits
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }
}


