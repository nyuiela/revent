// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Storage.sol";
import "./Events.sol";
import "../doma/interfaces/IDomaProxy.sol";

abstract contract EventAdmin is Ownable, EventStorage {
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Platform fee cannot exceed 10%");
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit EventEvents.PlatformFeeUpdated(oldFee, newFee);
    }

    function updateRegistrationFeeLimits(uint256 minFee, uint256 maxFee) external onlyOwner {
        require(minFee < maxFee, "Min fee must be less than max fee");
        minRegistrationFee = minFee;
        maxRegistrationFee = maxFee;
        emit EventEvents.RegistrationFeeLimitsUpdated(minFee, maxFee);
    }

    function emergencyWithdraw() external onlyOwner {
        address recipient = feeRecipient == address(0) ? owner() : feeRecipient;
        payable(recipient).transfer(address(this).balance);
    }

    // Doma config (owner-only)
    function setDomaConfig(
        address _domaProxy,
        address _ownershipToken,
        address _trustedForwarder,
        uint256 _registrarIanaId,
        string calldata _domaChainId
    ) external onlyOwner {
        domaProxy = _domaProxy;
        ownershipToken = _ownershipToken;
        // trustedForwarderAddr is now handled by the upgradeable contract
        registrarIanaId = _registrarIanaId;
        domaChainId = _domaChainId;
    }

    // Marketplace config (owner-only)
    function setMarketplaceCurrencies(address usdc, address weth) external onlyOwner {
        marketplaceUSDC = usdc;
        marketplaceWETH = weth;
    }

    function setMarketplaceProtocolFee(address receiver, uint256 feeBps) external onlyOwner {
        require(feeBps <= 1000, "fee too high");
        marketplaceProtocolFeeReceiver = receiver;
        marketplaceProtocolFeeBps = feeBps;
    }
}


