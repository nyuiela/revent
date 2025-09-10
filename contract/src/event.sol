// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./events/Attendees.sol";
import "./events/Queries.sol";
import "./events/Admin.sol";
import "./events/Tickets.sol";
import "./events/DomaIntegration.sol";
import "./events/Trading.sol";
import "./doma/interfaces/IERC2981.sol";

/**
 * @title StreamEvents
 * @dev Facade contract that composes modular event features
 */
contract StreamEvents is EventAttendees, EventQueries, EventAdmin, EventTickets, EventDomaIntegration, EventTrading, ERC2771Context {
	// Trusted forwarder is owner-configurable via setDomaConfig; we initialize with zero and rely on setter.
	constructor() Ownable(msg.sender) ERC2771Context(address(0)) {
		_transferOwnership(msg.sender);
		feeRecipient = msg.sender;
	}

	function pause() external onlyOwner {
		// Placeholder for future Pausable integration
	}

	function _owner() internal view override(EventAttendees, EventTickets, EventDomaIntegration, EventTrading) returns (address) {
		return owner();
	}

	function _generateConfirmationCode(uint256 eventId, address attendee)
		internal
		override(EventAttendees, EventTickets, EventDomaIntegration, EventTrading)
		returns (string memory)
	{
		return super._generateConfirmationCode(eventId, attendee);
	}

	// --- ERC2771 meta-tx support ---
	function _msgSender()
		internal
		view
		override(Context, ERC2771Context)
		returns (address sender)
	{
		return ERC2771Context._msgSender();
	}

	function _msgData()
		internal
		view
		override(Context, ERC2771Context)
		returns (bytes calldata)
	{
		return ERC2771Context._msgData();
	}

	function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
		return ERC2771Context._contextSuffixLength();
	}

	function isTrustedForwarder(address forwarder) public view override returns (bool) {
		return forwarder == trustedForwarderAddr && forwarder != address(0);
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
		emit EventEvents.TradingFeeUpdated(oldFee, newFeeBps);
	}

	function setOrderValueLimits(uint256 minValue, uint256 maxValue) external onlyOwner {
		require(minValue < maxValue, "invalid limits");
		require(maxValue > 0, "max value must be positive");
		minOrderValue = minValue;
		maxOrderValue = maxValue;
		emit EventEvents.OrderValueLimitsUpdated(minValue, maxValue);
	}

	function setOrderExpirationTime(uint256 newExpirationTime) external onlyOwner {
		require(newExpirationTime > 0, "invalid expiration time");
		uint256 oldExpiration = orderExpirationTime;
		orderExpirationTime = newExpirationTime;
		emit EventEvents.OrderExpirationTimeUpdated(oldExpiration, newExpirationTime);
	}

	// --- Investor Protection Configuration ---
	function setDefaultInvestorApprovalRequired(uint256 eventId, bool required, uint256 thresholdBps) external onlyOwner {
		require(!required || thresholdBps <= 10000, "invalid threshold");
		requireInvestorApproval[eventId] = required;
		investorApprovalThreshold[eventId] = thresholdBps;
		emit EventEvents.InvestorApprovalRequired(eventId, required, thresholdBps);
	}
}
