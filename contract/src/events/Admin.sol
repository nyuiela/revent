// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Storage.sol";
import "./Events.sol";

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
}


