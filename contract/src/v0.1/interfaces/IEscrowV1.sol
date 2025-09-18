// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IEscrowV1 {
    // Views/state accessors that may exist publicly on the escrow
    // mapping(uint256 => Escrow) public escrows;
    // mapping(uint256 => Payee) public escrowPayees;

    // External functions intended for interaction
    function releaseFunds() external;
    function setEscrowLock(uint256 eventId, bool lockStatus) external;
}


