// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IDomaProxy {
	struct NameInfo {
		string sld;
		string tld;
	}

	enum ProofOfContactsSource {
		Registrar,
		Doma
	}

	struct TokenizationVoucher {
		NameInfo[] names;
		uint256 nonce;
		uint256 expiresAt;
		address ownerAddress;
	}

	struct ProofOfContactsVoucher {
		uint256 registrantHandle;
		ProofOfContactsSource proofSource;
		uint256 nonce;
		uint256 expiresAt;
	}

	function requestTokenization(TokenizationVoucher calldata voucher, bytes calldata signature) external payable;

	function claimOwnership(
		uint256 tokenId,
		bool isSynthetic,
		ProofOfContactsVoucher calldata proofOfContactsVoucher,
		bytes calldata signature
	) external payable;

	function bridge(
		uint256 tokenId,
		bool isSynthetic,
		string calldata targetChainId,
		string calldata targetOwnerAddress
	) external payable;

	function requestDetokenization(uint256 tokenId, bool isSynthetic) external;
  function registrarOf(uint256 id) external view returns (uint256) {
   return _registrarIanaIds[id];
}
}


