// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

abstract contract MinimalERC2771Context {
	address private _trustedForwarder;

	event TrustedForwarderChanged(address indexed previousForwarder, address indexed newForwarder);

	constructor(address trustedForwarder_) {
		_trustedForwarder = trustedForwarder_;
	}

	function isTrustedForwarder(address forwarder) public view returns (bool) {
		return forwarder == _trustedForwarder;
	}

	function _setTrustedForwarder(address newForwarder) internal {
		address previous = _trustedForwarder;
		_trustedForwarder = newForwarder;
		emit TrustedForwarderChanged(previous, newForwarder);
	}

	function _msgSender() internal view returns (address sender) {
		if (isTrustedForwarder(msg.sender) && msg.data.length >= 20) {
			assembly {
				sender := shr(96, calldataload(sub(calldatasize(), 20)))
			}
		} else {
			sender = msg.sender;
		}
	}

	function _msgData() internal view returns (bytes calldata) {
		if (isTrustedForwarder(msg.sender) && msg.data.length >= 20) {
			return msg.data[:msg.data.length - 20];
		}
		return msg.data;
	}

	function trustedForwarder() public view returns (address) {
		return _trustedForwarder;
	}
}


