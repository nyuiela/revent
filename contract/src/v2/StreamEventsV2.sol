// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./TradingV2.sol";
import "../doma/interfaces/IERC2981.sol";

/**
 * @title StreamEventsV2
 * @dev V2 implementation with Doma integration, trading, and revenue sharing
 * @dev Extends V1 with advanced features
 */
contract StreamEventsV2 is Initializable, UUPSUpgradeable, TradingV2 {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() ERC2771ContextUpgradeable(address(0)) {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        address trustedForwarder,
        address feeRecipient_,
        uint256 platformFee_,
        address domaProxy_,
        address ownershipToken_,
        uint256 registrarIanaId_,
        string memory domaChainId_
    ) public initializer {
        __StorageV2_init();
        __TradingV2_init();
        
        _transferOwnership(initialOwner);
        trustedForwarderAddr = trustedForwarder;
        feeRecipient = feeRecipient_;
        platformFee = platformFee_;
        
        // Set Doma configuration
        domaProxy = domaProxy_;
        ownershipToken = ownershipToken_;
        registrarIanaId = registrarIanaId_;
        domaChainId = domaChainId_;
    }

    function _authorizeUpgrade(address newImplementation) internal override(StorageV1, UUPSUpgradeable) onlyOwner {}

    // V2 specific functions
    function pause() external onlyOwner {
        // Placeholder for future Pausable integration
    }

    function unpause() external onlyOwner {
        // Placeholder for future Pausable integration
    }

    // --- Marketplace helpers ---
    // Approve an operator (e.g., Seaport conduit) for OwnershipToken to enable listings
    function approveOwnershipTokenOperator(address operator, bool approved) external onlyOwner {
        require(ownershipToken != address(0), "ownership not set");
        IERC721(ownershipToken).setApprovalForAll(operator, approved);
    }

    // Expose supported currency addresses for integrations (Orderbook SDK / clients)
    function getUSDC() external view returns (address) { return marketplaceUSDC; }
    function getWETH() external view returns (address) { return marketplaceWETH; }

    // Expose protocol fee details for order construction on the client side
    function getProtocolFee() external view returns (address receiver, uint256 feeBps) {
        return (marketplaceProtocolFeeReceiver, marketplaceProtocolFeeBps);
    }

    // Query royalty info from OwnershipToken (IERC2981), used by clients to build considerations
    function getRoyaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 amount) {
        require(ownershipToken != address(0), "ownership not set");
        return IERC2981(ownershipToken).royaltyInfo(tokenId, salePrice);
    }

    // --- Trading Configuration ---
    function setTradingFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "fee too high"); // Max 10%
        uint256 oldFee = tradingFeeBps;
        tradingFeeBps = newFeeBps;
        emit TradingFeeUpdated(oldFee, newFeeBps);
    }

    function setOrderValueLimits(uint256 minValue, uint256 maxValue) external onlyOwner {
        require(minValue < maxValue, "invalid limits");
        require(maxValue > 0, "max value must be positive");
        minOrderValue = minValue;
        maxOrderValue = maxValue;
        emit OrderValueLimitsUpdated(minValue, maxValue);
    }

    function setOrderExpirationTime(uint256 newExpirationTime) external onlyOwner {
        require(newExpirationTime > 0, "invalid expiration time");
        uint256 oldExpiration = orderExpirationTime;
        orderExpirationTime = newExpirationTime;
        emit OrderExpirationTimeUpdated(oldExpiration, newExpirationTime);
    }

    // --- Investor Protection Configuration ---
    function setDefaultInvestorApprovalRequired(uint256 eventId, bool required, uint256 thresholdBps) external onlyOwner {
        require(!required || thresholdBps <= 10000, "invalid threshold");
        requireInvestorApproval[eventId] = required;
        investorApprovalThreshold[eventId] = thresholdBps;
        emit InvestorApprovalRequired(eventId, required, thresholdBps);
    }

    // Version information
    function version() external pure returns (string memory) {
        return "2.0.0";
    }

    function getImplementation() external view returns (address) {
        return address(this);
    }

    function getPlatformFee() external view returns (uint256) {
        return platformFee;
    }

    // Migration helper functions
    function migrateFromV1(
        address v1Contract,
        uint256[] memory eventIds
    ) external onlyOwner {
        // This function would be used to migrate data from V1 to V2
        // Implementation would depend on the specific migration requirements
        // For now, this is a placeholder
    }

}
