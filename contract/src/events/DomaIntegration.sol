// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Management.sol";
import "./Types.sol";
import "./Events.sol";
import "../doma/interfaces/IDomaProxy.sol";
import "../doma/interfaces/IOwnershipToken.sol";

abstract contract EventDomaIntegration is EventManagement {
    function _owner() internal view virtual returns (address);
    function _generateConfirmationCode(uint256 eventId, address attendee) internal virtual returns (string memory);
    // Create event then request Doma tokenization in one tx. Caller must include required fee.
    function createEventWithTokenization(
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 maxAttendees,
        uint256 registrationFee,
        IDomaProxy.TokenizationVoucher calldata voucher,
        bytes calldata registrarSignature
    ) external payable validRegistrationFee(registrationFee) returns (uint256) {
        require(domaProxy != address(0), "doma proxy not set");
        require(voucher.ownerAddress == msg.sender, "voucher owner != sender");

        uint256 eventId = this.createEvent(ipfsHash, startTime, endTime, maxAttendees, registrationFee);

        IDomaProxy(domaProxy).requestTokenization{value: msg.value}(voucher, registrarSignature);
        _linkDomaRequested(eventId);

        return eventId;
    }

    // Claim ownership for the event domain (gasless-capable via forwarder)
    function claimEventDomain(
        uint256 eventId,
        bool isSynthetic,
        IDomaProxy.ProofOfContactsVoucher calldata proof,
        bytes calldata proofSignature
    ) external payable eventExists(eventId) onlyEventCreator(eventId) {
        require(domaProxy != address(0), "doma proxy not set");
        uint256 tokenId = eventToDomaTokenId[eventId];
        require(tokenId != 0, "token not linked");
        IDomaProxy(domaProxy).claimOwnership{value: msg.value}(tokenId, isSynthetic, proof, proofSignature);
        eventToDomaStatus[eventId] = 3; // Claimed (optimistic; can also be linked via off-chain)
    }

    // Bridge event domain
    function bridgeEventDomain(
        uint256 eventId,
        bool isSynthetic,
        string calldata targetChainId,
        string calldata targetOwnerAddress
    ) external payable eventExists(eventId) onlyEventCreator(eventId) {
        require(domaProxy != address(0), "doma proxy not set");
        uint256 tokenId = eventToDomaTokenId[eventId];
        require(tokenId != 0, "token not linked");
        IDomaProxy(domaProxy).bridge{value: msg.value}(tokenId, isSynthetic, targetChainId, targetOwnerAddress);
        emit DomaBridged(eventId, targetChainId, targetOwnerAddress);
    }

    // Investors deposit ETH to participate in revenue sharing for an event
    function investInEvent(uint256 eventId) external payable eventExists(eventId) {
        require(msg.value > 0, "no value");
        totalInvested[eventId] += msg.value;
        investorShares[eventId][msg.sender] += msg.value;
    }

    // Registration with revenue pooling: platform fee paid out, investor pool accrues a portion
    function registerForEventWithRevenuePool(uint256 eventId) external payable eventExists(eventId) eventIsActive(eventId) eventNotFull(eventId) notAlreadyRegistered(eventId) {
        require(events[eventId].status == EventTypes.EventStatus.PUBLISHED, "not open");
        EventTypes.EventData storage eventData = events[eventId];
        require(msg.value == eventData.registrationFee, "bad fee");

        string memory confirmationCode = _generateConfirmationCode(eventId, msg.sender);
        attendees[eventId][msg.sender] = EventTypes.AttendeeData({
            attendeeAddress: msg.sender,
            eventId: eventId,
            confirmationCode: confirmationCode,
            isConfirmed: false,
            hasAttended: false,
            registeredAt: block.timestamp,
            confirmedAt: 0
        });
        eventData.currentAttendees++;
        eventAttendees[eventId].push(msg.sender);

        uint256 platformFeeAmount = (msg.value * platformFee) / 10000; //basis points
        uint256 net = msg.value - platformFeeAmount;
        payable(feeRecipient == address(0) ? _owner() : feeRecipient).transfer(platformFeeAmount);

        // Split net into investor pool and creator immediate payout
        uint256 toInvestors = (net * investorBps) / 10000; // e.g., 50% if investorBps=5000
        uint256 toCreator = net - toInvestors;
        revenueAccrued[eventId] += toInvestors;
        payable(eventData.creator).transfer(toCreator);

        emit EventEvents.AttendeeRegistered(eventId, msg.sender, confirmationCode, msg.value);
    }

    // Investors claim pro-rata share of accrued revenue
    function claimRevenue(uint256 eventId) external {
        uint256 invested = investorShares[eventId][msg.sender];
        require(invested > 0, "no shares");
        uint256 total = totalInvested[eventId];
        require(total > 0, "no total");
        uint256 entitled = (revenueAccrued[eventId] * invested) / total;
        uint256 already = revenueClaimed[eventId][msg.sender];
        require(entitled > already, "nothing to claim");
        uint256 payout = entitled - already;
        revenueClaimed[eventId][msg.sender] = entitled;
        (bool ok, ) = payable(msg.sender).call{value: payout}("");
        require(ok, "payout failed");
    }

    // Tip domain owner directly (uses OwnershipToken ownerOf)
    function tipDomainOwner(uint256 eventId) external payable {
        require(msg.value > 0, "no value");
        require(ownershipToken != address(0), "ownership not set");
        uint256 tokenId = eventToDomaTokenId[eventId];
        require(tokenId != 0, "token not linked");
        address to = IOwnershipToken(ownershipToken).ownerOf(tokenId);
        (bool ok, ) = payable(to).call{value: msg.value}("");
        require(ok, "tip failed");
    }
}


