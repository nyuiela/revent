// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IReventV1
 * @dev Main interface file for Revent V1 modular architecture
 * @dev Exports all interfaces for easy importing
 */

// Core interfaces
import {IEventsV1} from "./IEventsV1.sol";
import {ITicketsV1} from "./ITicketsV1.sol";
import {IEscrowV1} from "./IEscrowV1.sol";
import {IRevent} from "./IRevent.sol";
import {IUpgradeableProxy} from "./IUpgradeableProxy.sol";

// Re-export all interfaces for convenience
export {IEventsV1} from "./IEventsV1.sol";
export {ITicketsV1} from "./ITicketsV1.sol";
export {IEscrowV1} from "./IEscrowV1.sol";
export {IRevent} from "./IRevent.sol";
export {IUpgradeableProxy} from "./IUpgradeableProxy.sol";
