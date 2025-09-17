// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./StorageV1.sol";
import "./Events.sol";

contract Admin is ReventStorage {

    function emergencyWithdraw() external onlyOwner {
        address recipient = feeRecipient == address(0) ? owner() : feeRecipient;
        payable(recipient).transfer(address(this).balance);
    }


    // Marketplace config (owner-only)
    function setMarketplaceCurrencies(
        address usdc,
        address weth
    ) external onlyOwner {
        marketplaceUSDC = usdc;
        marketplaceWETH = weth;
    }

    function setMarketplaceProtocolFee(
        address receiver,
        uint256 feeBps
    ) external onlyOwner {
        require(feeBps <= 1000, "fee too high");
        marketplaceProtocolFeeReceiver = receiver;
        marketplaceProtocolFeeBps = feeBps;
    }

    // s1



    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyOwner {}

    function _msgSender()
        internal
        view
        virtual
        override
        returns (address)
    {
        return msg.sender;
    }

    function _msgData()
        internal
        view
        virtual
        override
        returns (bytes calldata)
    {
        return msg.data;
    }

    function isTrustedForwarder(
        address forwarder
    ) public view virtual override returns (bool) {
        return forwarder == trustedForwarderAddr && forwarder != address(0);
    }

    function setTrustedForwarder(address forwarder) external onlyOwner {
        trustedForwarderAddr = forwarder;
        // emit EventEvents.TrustedForwarderUpdated(oldForwarder, forwarder);
    }

    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit EventEvents.PlatformFeeUpdated(oldFee, newFee);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
        // emit EventEvents.FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    function setRegistrationFeeLimits(
        uint256 minFee,
        uint256 maxFee
    ) external onlyOwner {
        require(minFee < maxFee, "Invalid limits");
        minRegistrationFee = minFee;
        maxRegistrationFee = maxFee;
        emit EventEvents.RegistrationFeeLimitsUpdated(minFee, maxFee);
    }
}
