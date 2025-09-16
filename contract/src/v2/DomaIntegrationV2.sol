// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./StorageV2.sol";
import "../events/Modifiers.sol";
import "../events/InternalUtils.sol";
import "../events/Events.sol";
import "../doma/interfaces/IDomaProxy.sol";
import "../doma/interfaces/IOwnershipToken.sol";

abstract contract DomaIntegrationV2 is StorageV2 {
    modifier eventExists(uint256 eventId) {
        require(events[eventId].creator != address(0), "Event does not exist");
        _;
    }

    modifier onlyEventCreator(uint256 eventId) {
        require(events[eventId].creator == _msgSender(), "Only event creator can perform this action");
        _;
    }

    modifier eventIsActive(uint256 eventId) {
        require(events[eventId].isActive, "Event is not active");
        _;
    }

    modifier eventNotFull(uint256 eventId) {
        require(events[eventId].currentAttendees < events[eventId].maxAttendees, "Event is full");
        _;
    }

    modifier notAlreadyRegistered(uint256 eventId) {
        require(attendees[eventId][_msgSender()].attendeeAddress == address(0), "Already registered for this event");
        _;
    }

    function _afterEventCreated(uint256 eventId) internal virtual {}

    function _generateConfirmationCode(uint256 eventId, address attendee) internal virtual returns (string memory) {
        string memory baseCode = string(abi.encodePacked(
            uint2str(eventId),
            uint2str(uint256(uint160(attendee))),
            uint2str(block.timestamp)
        ));
        
        // Create a simple hash-based confirmation code
        bytes32 hash = keccak256(abi.encodePacked(baseCode, block.prevrandao, block.timestamp));
        return string(abi.encodePacked("EVT-", uint2str(uint256(hash) % 1000000)));
    }

    function uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function _linkDomaRequested(uint256 eventId) internal {
        eventToDomaStatus[eventId] = 1; // Requested
        emit DomaRequested(eventId);
    }

    function linkDomaMinted(uint256 eventId, uint256 tokenId) internal {
        // callable by off-chain agent or registrar role in a fuller design
        eventToDomaTokenId[eventId] = tokenId;
        eventToDomaStatus[eventId] = 2; // Minted
        emit DomaClaimed(eventId, tokenId);
    }

    function linkDomaClaimed(uint256 eventId) internal {
        eventToDomaStatus[eventId] = 3; // Claimed
    }

    function linkDomaBridged(uint256 eventId, string memory targetChainId, string memory targetOwnerAddress) internal {
        emit DomaBridged(eventId, targetChainId, targetOwnerAddress);
    }

    function requestDomaLink(uint256 eventId) external eventExists(eventId) onlyOwner {
        require(eventToDomaStatus[eventId] == 0, "already requested");
        require(domaProxy != address(0), "doma not configured");
        
        _linkDomaRequested(eventId);
        
        // In a real implementation, this would call the Doma proxy
        // IDomaProxy(domaProxy).requestDomainMint(eventId, events[eventId].ipfsHash);
    }

    function claimDomaLink(uint256 eventId, uint256 tokenId) external eventExists(eventId) onlyOwner {
        require(eventToDomaStatus[eventId] == 1, "not requested");
        linkDomaMinted(eventId, tokenId);
    }

    function bridgeDomaLink(uint256 eventId, string memory targetChainId, string memory targetOwnerAddress) external eventExists(eventId) onlyOwner {
        require(eventToDomaStatus[eventId] == 2, "not minted");
        linkDomaBridged(eventId, targetChainId, targetOwnerAddress);
    }

    function getDomaStatus(uint256 eventId) external view eventExists(eventId) returns (uint8) {
        return eventToDomaStatus[eventId];
    }

    function getDomaTokenId(uint256 eventId) external view eventExists(eventId) returns (uint256) {
        return eventToDomaTokenId[eventId];
    }

    function registerForEventWithRevenuePool(uint256 eventId) external payable eventExists(eventId) eventIsActive(eventId) eventNotFull(eventId) notAlreadyRegistered(eventId) {
        require(events[eventId].status == EventTypes.EventStatus.PUBLISHED, "not open");
        EventTypes.EventData storage eventData = events[eventId];
        require(msg.value == eventData.registrationFee, "bad fee");

        address sender = _msgSender();
        string memory confirmationCode = _generateConfirmationCode(eventId, sender);
        attendees[eventId][sender] = EventTypes.AttendeeData({
            attendeeAddress: sender,
            eventId: eventId,
            confirmationCode: confirmationCode,
            isConfirmed: false,
            hasAttended: false,
            registeredAt: block.timestamp,
            confirmedAt: 0
        });

        eventAttendees[eventId].push(sender);
        creatorEvents[sender].push(eventId);
        usedConfirmationCodes[confirmationCode] = true;

        // Add to revenue pool
        totalInvested[eventId] += msg.value;
        investorShares[eventId][sender] = msg.value;
        eventInvestors[eventId].push(sender);
        isEventInvestor[eventId][sender] = true;
        totalInvestorShares[eventId] += msg.value;

        // Update share pricing
        _updateSharePricing(eventId);

        emit EventEvents.AttendeeRegistered(eventId, sender, confirmationCode, msg.value);
    }

    function _updateSharePricing(uint256 eventId) internal {
        uint256 totalValue = totalInvested[eventId] + revenueAccrued[eventId];
        eventTotalValue[eventId] = totalValue;
        eventShareSupply[eventId] = totalInvested[eventId];
        
        if (totalInvested[eventId] > 0) {
            uint256 basePricePerShare = totalValue / totalInvested[eventId];
            eventShareBasePrice[eventId] = basePricePerShare;
            eventShareMultiplier[eventId] = 10000; // 100% initially
            lastPriceUpdate[eventId] = block.timestamp;
            
            emit EventEvents.InvestorSharePriceUpdated(
                eventId,
                0, // old price
                basePricePerShare,
                address(0)
            );
        }
    }

    function accrueRevenue(uint256 eventId, uint256 amount) external eventExists(eventId) onlyOwner {
        revenueAccrued[eventId] += amount;
        _updateSharePricing(eventId);
    }

    function claimRevenue(uint256 eventId) external eventExists(eventId) {
        require(isEventInvestor[eventId][_msgSender()], "not investor");
        
        uint256 totalValue = totalInvested[eventId] + revenueAccrued[eventId];
        uint256 investorShare = (investorShares[eventId][_msgSender()] * totalValue) / totalInvested[eventId];
        uint256 alreadyClaimed = revenueClaimed[eventId][_msgSender()];
        uint256 claimable = investorShare - alreadyClaimed;
        
        require(claimable > 0, "nothing to claim");
        
        revenueClaimed[eventId][_msgSender()] = investorShare;
        
        (bool success, ) = _msgSender().call{value: claimable}("");
        require(success, "claim failed");
    }

    function getInvestorShare(uint256 eventId, address investor) external view eventExists(eventId) returns (uint256) {
        return investorShares[eventId][investor];
    }

    function getTotalInvested(uint256 eventId) external view eventExists(eventId) virtual returns (uint256) {
        return totalInvested[eventId];
    }

    function getRevenueAccrued(uint256 eventId) external view eventExists(eventId) returns (uint256) {
        return revenueAccrued[eventId];
    }

    function getEventInvestors(uint256 eventId) external view eventExists(eventId) virtual returns (address[] memory) {
        return eventInvestors[eventId];
    }

}