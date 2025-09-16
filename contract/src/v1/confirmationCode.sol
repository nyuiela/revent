//SDPX-License-Identifier: MIT

pragma solidity ^0.8.19;



contract Confirmation() {

   constructor() {}

//    mapping(uint256 => bytes) public confirmationCode;
// frontend - generate code. 
// stored 
// confirmationParticipation -> hash = hash(code).

function _generateEventCode(uint256 eventId, string memory code) internal  returns (bytes){
 
     bytes32 hash = keccak256(abi.encodePacked(msg.sender, eventId, code));
    //  string confirmationCode = _bytes32ToString(hash);
    // confirmationCode[eventId] = hash;
    return confirmationCode; 
}

function confirmationParticipation(uint256 eventId, bytes32 hash) external {
    
}
 
    function _generateConfirmationCode(uint256 eventId) internal virtual returns (string memory) {
        string memory baseCode = string(abi.encodePacked(
            uint2str(eventId),
            uint2str(block.timestamp),
        ));

        bytes32 hash = keccak256(abi.encodePacked(baseCode));
        
        string memory confirationCode = _bytes32ToString(hash);

        while (usedConfirmationCodes[confirmationCode]) {
            hash = keccak256(abi.encodePacked(hash, block.timestamp));
            confirmationCode = _bytes32ToString(hash);
        }

        usedConfirmationCodes[confirmationCode] = true;
        return confirmationCode;
    }


    function getIsConfirmationCode(string memory code) external view returns (bool) {
       
    }
    
}