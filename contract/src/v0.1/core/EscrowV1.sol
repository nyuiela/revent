// SPDX-LICENSE-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./StorageV1.sol";

abstract contract EscrowV1 is ReentrancyGuardUpgradeable, Ownable, ReventStorage {
    function __EscrowV1_init() internal onlyInitializing {
        __ReentrancyGuard_init();
    }

    struct Escrow {
        uint256 totalAmount;
        bool isFunded;
        bool isReleased;
        bool isRefunded;
        bool isDisputed;
        uint256 createdAt;
        uint256 updatedAt;
        bool isLocked;
        address owner;
    }

    struct Payee {
        address payeeAddress;
        uint256 amount;
        bool isRefunded;
    }

    mapping(uint256 => Payee) public escrowPayees; // eventId => payees array

    // e.g escrow1 -> kofi deposites 2 eth, escrow2 -> adele deposites 3 eth
    mapping(uint256 => Escrow) public escrows; // eventId => escrow address

    // function createEscrow(...) external nonReentrant { ... }
    function createEscrow(uint256 eventId) internal nonReentrant {
        require(
            escrows[eventId].createdAt == 0,
            "Escrow already exists for event"
        );
        // Implementation for creating an escrow

        escrows[eventId] = Escrow({
            totalAmount: 0,
            isFunded: false,
            isReleased: false,
            isRefunded: false,
            isDisputed: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isLocked: false,
            owner: msg.sender
        });

        uint256 escrowId = eventId;
        return escrowId;
    }

    function depositFunds(
        uint256 eventId,
        address payee,
        uint256 amount
    ) internal nonReentrant {
        // onlyEventContract
        // Implementation for depositing funds into escrow
        require(escrows[eventId] != 0, "Escrow not found for event");
        require(!escrows[eventId].isLocked, "Escrow is locked");
        // Update escrow state
        escrows[eventId].totalAmount += amount;
        // eventId.creator
        //     escrows[eventId].payer.push(msg.sender); // should be event creator
        escrows[eventId].payee.push(
            Payee({payeeAddress: msg.sender, amount: amount, isRefunded: false})
        );
        escrows[eventId].updatedAt = block.timestamp;
        escrowPayees[eventId] = Payee({
            payeeAddress: msg.sender,
            amount: amount,
            isRefunded: false
        });
    }

    // function releaseFunds(...) external nonReentrant { ... }
    function releaseFunds(uint256 eventId) external nonReentrant {
        // Q: who can release funds? only event creator?
        // A: only event creator
        // A: Waiting period?
        require(escrows[eventId] != 0, "Escrow not found for event");
        require(
            events[eventId].status == EventTypes.EventStatus.COMPLETED,
            "Event not completed"
        );
        require(!escrows[eventId].isLocked, "Escrow is locked");
        require(!escrows[eventId].isReleased, "Funds already released");
        require(!escrows[eventId].isRefunded, "Escrow not refunded");

        escrows[eventId].isReleased = true;
        escrows[eventId].updatedAt = block.timestamp;
        // Implementation for releasing funds from escrow
        //trasfer to owner of event
        payable(escrows[eventId].owner).transfer(escrows[eventId].totalAmount);
    }

    //@todo 2 releasefunds 1 for --->
    // when refunding
    // function refundFunds(...) external nonReentrant { ... }
    //@dev called when eevent is cancelled
    function refundFunds(uint256 eventId) internal nonReentrant {
        // Implementation for refunding funds from escrow
        require(escrows[eventId] != 0, "Escrow not found for event");
        require(
            events[eventId].status == EventTypes.EventStatus.CANCELLED,
            "Event not cancelled"
        );
        require(!escrows[eventId].isReleased, "Escrow already released");
        //   require(!escrows[eventId].isRefunded, "Funds already refunded");
        // Payee storage payee = escrows[eventId].payee;
        // for (uint i = 0; i < payee.length; i++) {
        //     if (!payee[i].isRefunded) {
        //         payable(payee[i].payeeAddress).transfer(payee[i].amount);
        //         payee[i].isRefunded = true;
        //     }
        // }
        escrows[eventId].isRefunded = true;
        escrows[eventId].updatedAt = block.timestamp;

        Payee storage payee = escrowPayees[eventId];
        if (!payee.isRefunded) {
            payable(payee.payeeAddress).transfer(payee.amount);
            payee.isRefunded = true;
        }
    }

    function createDispute() external nonReentrant {
        // Implementation for creating a dispute
    }

    function setEscrowLock(
        uint256 eventId,
        bool lockStatus
    ) external onlyOwner {
        require(escrows[eventId] != 0, "Escrow not found for event");
        escrows[eventId].isLocked = lockStatus;
        escrows[eventId].updatedAt = block.timestamp;
    }

    //  function setEventContract(address eventContract) external onlyOwner {
    //      _eventContract = eventContract;
    //  }
}
