// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IOwnershipToken {
	function ownerOf(uint256 tokenId) external view returns (address);
	function expirationOf(uint256 tokenId) external view returns (uint256);
	function registrarOf(uint256 tokenId) external view returns (uint256);
	function lockStatusOf(uint256 tokenId) external view returns (bool);
}


