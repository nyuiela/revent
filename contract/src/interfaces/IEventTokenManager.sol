// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IEventTokenManager
 * @dev Interface for EventTokenManager contract
 */
interface IEventTokenManager {
    function mintEventTokens(
        uint256 eventId, 
        uint256 totalSupply, 
        string memory tokenUri
    ) external returns (uint256);
    
    function transferRegistrationToken(
        uint256 eventId, 
        address attendee, 
        uint256 amount
    ) external;
    
    function getEventTokenId(uint256 eventId) external view returns (uint256);
    function hasEventTokens(uint256 eventId, address holder) external view returns (bool);
    function getEventTokenBalance(uint256 eventId, address holder) external view returns (uint256);
    function getRemainingTokenSupply(uint256 eventId) external view returns (uint256);
}
