// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title EventTokenManager
 * @dev Upgradeable ERC1155 contract for managing event tokens
 * @notice This contract handles minting and transferring tokens for event registrations
 */
contract EventTokenManager is 
    Initializable, 
    ERC1155Upgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable, 
    ReentrancyGuardUpgradeable 
{
    // Events
    event EventTokenMinted(uint256 indexed eventId, uint256 tokenId, uint256 totalSupply);
    event RegistrationTokenTransferred(uint256 indexed eventId, address indexed attendee, uint256 amount);
    event EventTokenMetadataUpdated(uint256 indexed eventId, string newUri);
    
    // State variables
    mapping(uint256 => uint256) public eventToTokenId; // eventId => tokenId
    mapping(uint256 => uint256) public tokenToEventId; // tokenId => eventId
    mapping(uint256 => string) public eventTokenUris; // eventId => token URI
    mapping(uint256 => uint256) public eventTokenSupplies; // eventId => total supply
    
    uint256 private _nextTokenId;
    address public streamEventsContract; // Address of the main StreamEvents contract
    
    // Modifiers
    modifier onlyStreamEvents() {
        require(msg.sender == streamEventsContract, "Only StreamEvents contract can call this");
        _;
    }
    
    modifier onlyEventCreator(uint256 eventId) {
        // This would need to be implemented based on your event creation logic
        _;
    }
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(string memory baseUri) public initializer {
        __ERC1155_init(baseUri);
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        _nextTokenId = 1;
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    /**
     * @dev Set the StreamEvents contract address
     * @param _streamEventsContract Address of the StreamEvents contract
     */
    function setStreamEventsContract(address _streamEventsContract) external onlyOwner {
        require(_streamEventsContract != address(0), "Invalid StreamEvents contract address");
        streamEventsContract = _streamEventsContract;
    }
    
    /**
     * @dev Mint tokens for a new event
     * @param eventId The event ID
     * @param totalSupply Total supply of tokens for this event
     * @param tokenUri URI for the token metadata
     * @return tokenId The minted token ID
     */
    function mintEventTokens(
        uint256 eventId, 
        uint256 totalSupply, 
        string memory tokenUri
    ) external onlyStreamEvents nonReentrant returns (uint256) {
        require(eventToTokenId[eventId] == 0, "Event tokens already minted");
        require(totalSupply > 0, "Total supply must be greater than 0");
        
        uint256 tokenId = _nextTokenId++;
        eventToTokenId[eventId] = tokenId;
        tokenToEventId[tokenId] = eventId;
        eventTokenUris[eventId] = tokenUri;
        eventTokenSupplies[eventId] = totalSupply;
        
        // Mint all tokens to the StreamEvents contract initially
        _mint(streamEventsContract, tokenId, totalSupply, "");
        
        emit EventTokenMinted(eventId, tokenId, totalSupply);
        return tokenId;
    }
    
    /**
     * @dev Transfer registration token to attendee
     * @param eventId The event ID
     * @param attendee Address of the attendee
     * @param amount Amount of tokens to transfer (usually 1)
     */
    function transferRegistrationToken(
        uint256 eventId, 
        address attendee, 
        uint256 amount
    ) external onlyStreamEvents nonReentrant {
        _transferRegistrationToken(eventId, attendee, amount);
    }
    
    /**
     * @dev Get token ID for an event
     * @param eventId The event ID
     * @return tokenId The token ID for the event
     */
    function getEventTokenId(uint256 eventId) external view returns (uint256) {
        return eventToTokenId[eventId];
    }
    
    /**
     * @dev Get event ID for a token
     * @param tokenId The token ID
     * @return eventId The event ID for the token
     */
    function getTokenEventId(uint256 tokenId) external view returns (uint256) {
        return tokenToEventId[tokenId];
    }
    
    /**
     * @dev Get token URI for an event
     * @param eventId The event ID
     * @return tokenUri The token URI
     */
    function getEventTokenUri(uint256 eventId) external view returns (string memory) {
        return eventTokenUris[eventId];
    }
    
    /**
     * @dev Update token URI for an event
     * @param eventId The event ID
     * @param newUri New URI for the token
     */
    function updateEventTokenUri(uint256 eventId, string memory newUri) external onlyStreamEvents {
        require(eventToTokenId[eventId] != 0, "Event tokens not minted");
        eventTokenUris[eventId] = newUri;
        emit EventTokenMetadataUpdated(eventId, newUri);
    }
    
    /**
     * @dev Get remaining token supply for an event
     * @param eventId The event ID
     * @return remainingSupply Remaining tokens available
     */
    function getRemainingTokenSupply(uint256 eventId) external view returns (uint256) {
        uint256 tokenId = eventToTokenId[eventId];
        if (tokenId == 0) return 0;
        return balanceOf(streamEventsContract, tokenId);
    }
    
    /**
     * @dev Check if an address holds tokens for an event
     * @param eventId The event ID
     * @param holder Address to check
     * @return hasTokens True if holder has tokens for this event
     */
    function hasEventTokens(uint256 eventId, address holder) external view returns (bool) {
        uint256 tokenId = eventToTokenId[eventId];
        if (tokenId == 0) return false;
        return balanceOf(holder, tokenId) > 0;
    }
    
    /**
     * @dev Get token balance for an event
     * @param eventId The event ID
     * @param holder Address to check
     * @return balance Token balance for this event
     */
    function getEventTokenBalance(uint256 eventId, address holder) external view returns (uint256) {
        uint256 tokenId = eventToTokenId[eventId];
        if (tokenId == 0) return 0;
        return balanceOf(holder, tokenId);
    }
    
    /**
     * @dev Override URI function to return event-specific URIs
     * @param tokenId The token ID
     * @return tokenUri The token URI
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        uint256 eventId = tokenToEventId[tokenId];
        if (eventId == 0) return super.uri(tokenId);
        return eventTokenUris[eventId];
    }
    
    /**
     * @dev Batch transfer tokens for multiple events
     * @param eventIds Array of event IDs
     * @param attendees Array of attendee addresses
     * @param amounts Array of amounts to transfer
     */
    function batchTransferRegistrationTokens(
        uint256[] memory eventIds,
        address[] memory attendees,
        uint256[] memory amounts
    ) external onlyStreamEvents nonReentrant {
        require(eventIds.length == attendees.length, "Arrays length mismatch");
        require(eventIds.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < eventIds.length; i++) {
            _transferRegistrationToken(eventIds[i], attendees[i], amounts[i]);
        }
    }
    
    /**
     * @dev Internal function to transfer registration token
     * @param eventId The event ID
     * @param attendee Address of the attendee
     * @param amount Amount of tokens to transfer
     */
    function _transferRegistrationToken(
        uint256 eventId, 
        address attendee, 
        uint256 amount
    ) internal {
        uint256 tokenId = eventToTokenId[eventId];
        require(tokenId != 0, "Event tokens not minted");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(streamEventsContract, tokenId) >= amount, "Insufficient tokens");
        
        // Transfer token from StreamEvents contract to attendee
        _safeTransferFrom(streamEventsContract, attendee, tokenId, amount, "");
        
        emit RegistrationTokenTransferred(eventId, attendee, amount);
    }
}
