// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../utils/counter.sol";
import "./Types.sol";

abstract contract EventStorage {
    using Counters for Counters.Counter;
    using EventTypes for EventTypes.EventData;

    Counters.Counter internal _eventIds;
    Counters.Counter internal _attendeeIds; // reserved if needed later
    Counters.Counter internal _ticketIds;

    mapping(uint256 => EventTypes.EventData) public events;
    mapping(address => uint256[]) public creatorEvents;
    mapping(uint256 => address[]) public eventAttendees;
    mapping(uint256 => mapping(address => EventTypes.AttendeeData))
        public attendees;
    mapping(string => bool) public usedConfirmationCodes;
    mapping(uint256 => bytes32) public confirmationCode;

    // Tickets
    mapping(uint256 => uint256[]) public eventTickets; // eventId => ticketIds
    mapping(uint256 => EventTypes.TicketData) public tickets; // ticketId => TicketData
    mapping(uint256 => mapping(address => uint256))
        public purchasedTicketCounts; // eventId => buyer => count

    uint256 public platformFee = 250; // basis points
    uint256 public minRegistrationFee = 0.001 ether;
    uint256 public maxRegistrationFee = 1 ether;
    address public feeRecipient;
    address public trustedForwarderAddr;

    // Doma integration config (basic)
    address public domaProxy;
    address public ownershipToken;
    uint256 public registrarIanaId;
    string public domaChainId; // CAIP-2 string if needed for bridging

    // Per-event doma linkage
    mapping(uint256 => uint256) public eventToDomaTokenId; // eventId => tokenId
    mapping(uint256 => uint8) public eventToDomaStatus; // 0-None,1-Requested,2-Minted,3-Claimed

    // Marketplace configuration (owner-settable)
    address public marketplaceUSDC;
    address public marketplaceWETH;
    address public marketplaceProtocolFeeReceiver;
    uint256 public marketplaceProtocolFeeBps; // e.g., 50 == 0.5%

    // Investment and revenue sharing (simple pro-rata)
    mapping(uint256 => uint256) public totalInvested; // eventId => total ETH invested
    mapping(uint256 => mapping(address => uint256)) public investorShares; // eventId => investor => amount
    mapping(uint256 => uint256) public revenueAccrued; // net revenue accrued per event

    // Revenue claims tracking and investor split bps
    mapping(uint256 => mapping(address => uint256)) public revenueClaimed; // eventId => investor => cumulative claimed
    uint256 public investorBps = 5000; // default 50% of net to investors

    // Efficient investor tracking (no loops needed)
    mapping(uint256 => address[]) public eventInvestors; // eventId => list of investor addresses
    mapping(uint256 => mapping(address => bool)) public isEventInvestor; // eventId => investor => is investor
    mapping(uint256 => uint256) public totalInvestorShares; // eventId => total shares owned by investors

    // Dynamic share pricing system
    mapping(uint256 => uint256) public eventShareBasePrice; // eventId => base price per share (in wei)
    mapping(uint256 => uint256) public eventShareMultiplier; // eventId => current price multiplier (basis points)
    mapping(uint256 => uint256) public eventTotalValue; // eventId => total event value (domain + revenue)
    mapping(uint256 => uint256) public eventShareSupply; // eventId => total share supply (totalInvested)
    mapping(uint256 => uint256) public lastPriceUpdate; // eventId => last price update timestamp

    // Trading system storage
    Counters.Counter internal _orderIds;
    Counters.Counter internal _tradeIds;
    mapping(uint256 => EventTypes.TradingOrder) public orders; // orderId => TradingOrder
    mapping(uint256 => uint256[]) public eventOrders; // eventId => orderIds
    mapping(address => uint256[]) public userOrders; // user => orderIds
    mapping(uint256 => EventTypes.EventPriceRange) public eventPriceRanges; // eventId => price range
    mapping(uint256 => EventTypes.TradeHistory) public tradeHistory; // tradeId => TradeHistory
    mapping(uint256 => uint256[]) public eventTrades; // eventId => tradeIds
    mapping(address => uint256[]) public userTrades; // user => tradeIds

    // Order matching and execution
    mapping(uint256 => uint256[]) public activeBuyOrders; // eventId => orderIds (buy orders)
    mapping(uint256 => uint256[]) public activeSellOrders; // eventId => orderIds (sell orders)
    mapping(uint256 => uint256) public eventCurrentPrice; // eventId => current market price

    // Trading fees and limits
    uint256 public tradingFeeBps = 100; // 1% trading fee
    uint256 public minOrderValue = 0.001 ether; // minimum order value
    uint256 public maxOrderValue = 1000 ether; // maximum order value
    uint256 public orderExpirationTime = 7 days; // default order expiration

    // Investor protection and distribution
    mapping(uint256 => EventTypes.InvestorSaleDistribution)
        public investorSaleDistributions; // tradeId => distribution
    mapping(uint256 => mapping(address => EventTypes.InvestorApproval))
        public investorApprovals; // eventId => investor => approval
    mapping(uint256 => bool) public requireInvestorApproval; // eventId => whether investor approval required for sale
    mapping(uint256 => uint256) public investorApprovalThreshold; // eventId => minimum approval percentage required
    mapping(uint256 => uint256) public totalInvestorApprovals; // eventId => total approval weight
    mapping(uint256 => uint256) public totalInvestorWeight; // eventId => total investor weight

    // Trading-based price momentum
    mapping(uint256 => uint256) public eventTradingVolume; // eventId => total trading volume (24h)
    mapping(uint256 => uint256) public eventBuyVolume; // eventId => buy volume (24h)
    mapping(uint256 => uint256) public eventSellVolume; // eventId => sell volume (24h)
    mapping(uint256 => uint256) public eventLastTradingUpdate; // eventId => last trading volume reset
    mapping(uint256 => uint256) public eventPriceMomentum; // eventId => price momentum factor (basis points)
}
