// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IRevent {
    // Core lifecycle controls
    function pause() external;
    function unpause() external;

    // Versioning/introspection
    function version() external pure returns (string memory);
    function getImplementation() external view returns (address);

    // Event management (from ManagementV1)
    function createEvent(
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        bool isVIP,
        string memory code
    ) external returns (uint256);


    function updateEvent(
        uint256 eventId,
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee
    ) external;

    function publishEvent(uint256 eventId) external;
    function startLiveEvent(uint256 eventId) external;
    function endEvent(uint256 eventId) external;
    function cancelEvent(uint256 eventId) external;
}


