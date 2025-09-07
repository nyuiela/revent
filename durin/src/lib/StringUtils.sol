// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title StringUtils
/// @notice Simple string utility functions
library StringUtils {
    /// @notice Returns the length of a string
    /// @param str The string to measure
    /// @return The length of the string
    function strlen(string memory str) internal pure returns (uint256) {
        return bytes(str).length;
    }
}
