// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IEscrowV1
 * @dev Interface for EscrowV1 contract
 * @dev Defines all external functions for escrow management
 */
interface IEscrowV1 {
    // Events
    event EscrowCreated(
        uint256 indexed eventId,
        address indexed creator,
        uint256 releaseTime
    );
    
    event FundsDeposited(
        uint256 indexed eventId,
        address indexed depositor,
        uint256 amount,
        uint256 totalDeposited
    );
    
    event FundsReleased(
        uint256 indexed eventId,
        address indexed creator,
        uint256 amount
    );
    
    event FundsRefunded(
        uint256 indexed eventId,
        address indexed creator,
        uint256 amount
    );
    
    event DisputeCreated(
        uint256 indexed eventId,
        address indexed creator,
        string reason
    );
    
    event DisputeResolved(
        uint256 indexed eventId,
        bool refund,
        address indexed resolver
    );

    // Escrow data structure
    struct EscrowData {
        uint256 eventId;
        address creator;
        uint256 totalAmount;
        uint256 depositedAmount;
        uint256 releaseTime;
        bool isFunded;
        bool isReleased;
        bool isRefunded;
        bool isDisputed;
        bool isLocked;
        bytes32 disputeReason;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 disputeDeadline;
    }

    event EmergencyWithdraw(uint256 indexed eventId, address indexed admin, uint256 amount);
    event EscrowLocked(uint256 indexed eventId, bool locked);


    // Escrow management functions
    function createEscrow(uint256 eventId) external;
    function depositFunds(uint256 eventId, address depositor) external payable;
    // function depositFundsWithAmount(uint256 eventId, uint256 amount, address depositor) external;
    function releaseFunds(uint256 eventId) external;
    function refundFunds(uint256 eventId) external;
    
    // Dispute functions
    function createDispute(uint256 eventId, string calldata reason) external;
    function resolveDispute(uint256 eventId, bool refund) external;
    
    // Contract setup functions
    function setContractAddresses(address _eventsContract, address _ticketsContract) external;
    function setFactoryAddress(address _factoryContract) external;
    
    // View functions
    function getEscrowData(uint256 eventId) external view returns (EscrowData memory);
    function getEscrowStatus(uint256 eventId) external view returns (string memory);
    function isEscrowFunded(uint256 eventId) external view returns (bool);
    function isEscrowReleased(uint256 eventId) external view returns (bool);
    function isEscrowRefunded(uint256 eventId) external view returns (bool);
    function isEscrowDisputed(uint256 eventId) external view returns (bool);
    function getEscrowCount() external view returns (uint256);
    
    // Contract addresses
    function eventsContract() external view returns (address);
    function ticketsContract() external view returns (address);
    function factoryContract() external view returns (address);
    
    // Admin functions
    function pause() external;
    function unpause() external;
    
    // Version
    function version() external pure returns (string memory);
}
