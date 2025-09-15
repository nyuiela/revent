// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./Modifiers.sol";
import "./Events.sol";
import "./Types.sol";

abstract contract EventToken is ERC1155, EventModifiers {
    constructor(string memory uri) ERC1155(uri) {}

    function mint(address to, uint256 id, uint256 amount, bytes memory data) public onlyEventCreator(id) {
        _mint(to, id, amount, data);
    }
    

    function burn(address from, uint256 id, uint256 amount) external onlyEventCreator(id) {
        _burn(from, id, amount);
    }
}