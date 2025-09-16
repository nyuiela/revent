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
import "./interfaces/IEventTokenManager.sol";

/**
 * @title StreamEvents
 * @dev Facade contract that composes modular event features
 */
contract StreamEvents is EventAttendees, EventQueries, EventAdmin, EventTickets, ERC2771Context {
	// EventTokenManager contract for handling ERC1155 tokens
	IEventTokenManager public eventTokenManager;
	
	// Trusted forwarder is owner-configurable via setDomaConfig; we initialize with zero and rely on setter.
	constructor(string memory uri) Ownable(msg.sender) ERC2771Context(address(0)) {
		_transferOwnership(msg.sender);
		feeRecipient = msg.sender;
	}

	function pause() external onlyOwner {
		// Placeholder for future Pausable integration
	}
	
	// EventTokenManager integration functions
	function setEventTokenManager(address _eventTokenManager) external onlyOwner {
		require(_eventTokenManager != address(0), "Invalid EventTokenManager address");
		eventTokenManager = IEventTokenManager(_eventTokenManager);
	}
	
	function getEventTokenId(uint256 eventId) external view returns (uint256) {
		return eventTokenManager.getEventTokenId(eventId);
	}
	
	function hasEventTokens(uint256 eventId, address holder) external view returns (bool) {
		return eventTokenManager.hasEventTokens(eventId, holder);
	}
	
	function getEventTokenBalance(uint256 eventId, address holder) external view returns (uint256) {
		return eventTokenManager.getEventTokenBalance(eventId, holder);
	}
	
	// Override the _mintEventTokens function from EventManagement
	function _mintEventTokens(uint256 eventId, uint256 totalSupply, string memory tokenUri) internal override {
		if (address(eventTokenManager) != address(0)) {
			eventTokenManager.mintEventTokens(eventId, totalSupply, tokenUri);
		}
	}
	
	// Override the _transferRegistrationToken function from EventAttendees
	function _transferRegistrationToken(uint256 eventId, address attendee) internal override {
		if (address(eventTokenManager) != address(0)) {
			eventTokenManager.transferRegistrationToken(eventId, attendee, 1);
		}
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
		return forwarder == address(0); // Disabled for non-upgradeable version
	}

	// --- Marketplace helpers ---
	// Approve an operator (e.g., Seaport conduit) for OwnershipToken to enable listings
	function approveOwnershipTokenOperator(address operator, bool approved) external onlyOwner {
		require(ownershipToken != address(0), "ownership not set");
		IERC721(ownershipToken).setApprovalForAll(operator, approved);
	}

	// Expose protocol fee details for order construction on the client side
	function getProtocolFee() external view returns (address receiver, uint256 feeBps) {
		return (marketplaceProtocolFeeReceiver, marketplaceProtocolFeeBps);
	}

  function setProtocolFee(address receiver, uint256 feeBps) external onlyOwner {
    require(feeBps <= 1000, "fee too high");
    marketplaceProtocolFeeReceiver = receiver;
    marketplaceProtocolFeeBps = feeBps;
  }

}
