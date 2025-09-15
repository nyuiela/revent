// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {StreamEvents} from "../src/event.sol";

contract AttendanceConfirmationDemo is Script {
    StreamEvents public streamEvents;
    
    // Contract address - UPDATE THIS WITH YOUR DEPLOYED CONTRACT ADDRESS
    address constant CONTRACT_ADDRESS = 0xe43D53747b3d65A1A983428e6a3A79058FDe633a;
    
    function setUp() public {
        streamEvents = StreamEvents(CONTRACT_ADDRESS);
    }

    function run() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address caller = vm.addr(privateKey);
        
        console.log("=== Attendance Confirmation System Demo ===");
        console.log("Network:", vm.toString(block.chainid));
        console.log("Caller address:", caller);
        console.log("Contract address:", CONTRACT_ADDRESS);
        
        // Example event ID - replace with actual event ID
        uint256 eventId = 1;
        
        vm.startBroadcast(privateKey);
        
        // Step 1: Event creator generates confirmation code
        console.log("\n1. Generating event confirmation code...");
        try streamEvents.generateEventConfirmationCode(eventId) {
            console.log("SUCCESS: Event confirmation code generated successfully!");
            console.log("Note: Only the hash is stored on-chain, not the raw code");
        } catch Error(string memory reason) {
            console.log("ERROR: Failed to generate confirmation code:", reason);
            vm.stopBroadcast();
            return;
        }
        
        vm.stopBroadcast();
        
        // Step 2: Simulate attendee confirming attendance
        console.log("\n2. Simulating attendee confirmation...");
        console.log("Note: In real usage, attendees would call confirmAttendance with the code");
        console.log("Example: streamEvents.confirmAttendance(eventId, 'CONFIRMATION_CODE')");
        
        // Step 3: Simulate event creator marking attendance
        console.log("\n3. Simulating event creator marking attendance...");
        console.log("Note: Event creator can mark any registered attendee as attended");
        console.log("Example: streamEvents.markAttended(eventId, attendeeAddress)");
        
        console.log("\n=== Demo Complete ===");
        console.log("\nNew Secure Attendance Flow:");
        console.log("1. Event creator calls generateEventConfirmationCode(eventId)");
        console.log("2. Event creator shares the confirmation code with attendees (off-chain)");
        console.log("3. Attendees call confirmAttendance(eventId, confirmationCode)");
        console.log("4. Event creator calls markAttended(eventId, attendeeAddress) for each attendee");
        console.log("\nSecurity Features:");
        console.log("- Only confirmation code HASH is stored on-chain (not the raw code)");
        console.log("- Raw confirmation code is never exposed in events or storage");
        console.log("- Single confirmation code per event (not per attendee)");
        console.log("- Attendees confirm their own attendance using the shared code");
        console.log("- markAttended no longer requires prior confirmation");
    }
    
    // Helper function to demonstrate the new functions
    function demonstrateNewFunctions(uint256 eventId) public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(privateKey);
        
        // Generate confirmation code
        streamEvents.generateEventConfirmationCode(eventId);
        
        // Note: confirmAttendance and markAttended would be called separately
        // by different users (attendees and event creator respectively)
        
        vm.stopBroadcast();
    }
}
