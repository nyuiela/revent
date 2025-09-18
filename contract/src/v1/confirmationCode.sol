//SDPX-License-Identifier: MIT

pragma solidity ^0.8.19;

contract Confirmation {
    constructor() {}

    //    mapping(uint256 => bytes) public confirmationCode;
    // frontend - generate code.
    // stored
    // confirmationParticipation -> hash = hash(code).

    // ...existing code...
    function _generateEventCode(
        uint256 eventId,
        string memory code
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(eventId, code));
    }

    function confirmationParticipation(
        uint256 eventId,
        bytes32 hash
    ) external {}
}
