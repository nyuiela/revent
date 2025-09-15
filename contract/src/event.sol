// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./events/Attendees.sol";
import "./events/Queries.sol";
import "./events/Admin.sol";
import "./events/Tickets.sol";
import "./events/EventToken.sol";
// import "./events/DomaIntegration.sol";
// import "./events/Trading.sol";
// import "./doma/interfaces/IERC2981.sol";

/**
 * @title StreamEvents
 * @dev Facade contract that composes modular event features
 */
contract StreamEvents is EventAttendees, EventQueries, EventAdmin, EventTickets, ERC2771Context {
	// Trusted forwarder is owner-configurable via setDomaConfig; we initialize with zero and rely on setter.
	constructor(string memory uri) Ownable(msg.sender) ERC2771Context(address(0)) EventToken(uri) {
		_transferOwnership(msg.sender);
		feeRecipient = msg.sender;
	}

	function pause() external onlyOwner {
		// Placeholder for future Pausable integration
	}

	function _owner() internal view override(EventAttendees, EventTickets) returns (address) {
		return owner();
	}

	function _generateConfirmationCode(uint256 eventId, address attendee)
		internal
		override(EventAttendees, EventTickets)
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

}
