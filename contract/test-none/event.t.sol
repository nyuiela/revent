// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {StreamEvents} from "../src/event.sol";

contract CounterTest is Test {
    StreamEvents public eventContract;

    function setUp() public {
        eventContract = new StreamEvents();
    }

    function test_createEvent() public {
        uint256 eventId = eventContract.createEvent("Test Event", block.timestamp+ 1 days, block.timestamp + 5 days, 400, 0.001 ether);
        assertEq(eventContract.getEvent(eventId).ipfsHash, "Test Event");
    }

    function test_registerForEvent() public {
        uint256 eventId = eventContract.createEvent("Test Event", block.timestamp+ 1 days, block.timestamp + 5 days, 400, 0.00 ether);
        eventContract.publishEvent(eventId);
        vm.warp(block.timestamp + 1 days);
        eventContract.startLiveEvent(eventId);
        eventContract.registerForEvent{value: 0.00 ether}(eventId);
        assertEq(eventContract.getEvent(eventId).currentAttendees, 1);
    }

}
