// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "../v1/StorageV1.sol";

abstract contract StorageV2 is StorageV1 {
    // V2 specific events
    event DomaConfigUpdated(address domaProxy, address ownershipToken, address trustedForwarder, uint256 registrarIanaId, string domaChainId);
    event DomaRequested(uint256 indexed eventId);
    event DomaClaimed(uint256 indexed eventId, uint256 tokenId);
    event DomaBridged(uint256 indexed eventId, string targetChainId, string targetOwnerAddress);
    event EventDomainSold(uint256 indexed eventId, address indexed seller, address indexed buyer, uint256 price, address currency, uint256 tradeId);
    event InvestorSharesTransferred(uint256 indexed eventId, address indexed from, address indexed to, uint256 amount, uint256 pricePerShare);
    event OrderFilled(uint256 indexed orderId, uint256 indexed eventId, address indexed seller, address buyer, uint256 price, address currency, uint256 tradeId);
    event TradeExecuted(uint256 indexed tradeId, uint256 indexed eventId, uint256 indexed orderId, address seller, address buyer, uint256 price, address currency, uint256 timestamp);
    event InvestorSaleDistributionExecuted(uint256 indexed eventId, uint256 indexed tradeId, address indexed investor, uint256 amount, address currency);
    event DomainSaleBlocked(uint256 indexed eventId, uint256 indexed orderId, string reason);
    event InvestorApprovalRequired(uint256 indexed eventId, bool required, uint256 thresholdBps);
    event InvestorApprovalGiven(uint256 indexed eventId, address indexed investor, bool approved, uint256 weight);
    event TradingFeeUpdated(uint256 oldFee, uint256 newFee);
    event OrderValueLimitsUpdated(uint256 minValue, uint256 maxValue);
    event OrderExpirationTimeUpdated(uint256 oldExpiration, uint256 newExpiration);

    function __StorageV2_init() internal onlyInitializing {
        __StorageV1_init();
    }

    function setDomaConfig(
        address domaProxy_,
        address ownershipToken_,
        uint256 registrarIanaId_,
        string memory domaChainId_
    ) external onlyOwner {
        domaProxy = domaProxy_;
        ownershipToken = ownershipToken_;
        registrarIanaId = registrarIanaId_;
        domaChainId = domaChainId_;
        emit DomaConfigUpdated(domaProxy_, ownershipToken_, trustedForwarderAddr, registrarIanaId_, domaChainId_);
    }

    function setMarketplaceConfig(
        address usdc,
        address weth,
        address protocolFeeReceiver,
        uint256 protocolFeeBps
    ) external onlyOwner {
        marketplaceUSDC = usdc;
        marketplaceWETH = weth;
        marketplaceProtocolFeeReceiver = protocolFeeReceiver;
        marketplaceProtocolFeeBps = protocolFeeBps;
    }
}