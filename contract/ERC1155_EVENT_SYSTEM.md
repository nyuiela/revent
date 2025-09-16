# ERC1155 Event Token System

## Overview

The event system now includes an upgradeable ERC1155 token system that provides proof of registration and value for event participants. This system is designed to be modular and upgradeable while keeping the main StreamEvents contract clean to avoid stack depth issues.

## Architecture

### 🏗️ **Modular Design**

```
StreamEvents (Main Contract)
    ↓
EventTokenManager (Upgradeable ERC1155)
    ↓
ERC1967Proxy (Upgradeability)
```

### 📦 **Components**

1. **StreamEvents**: Main event management contract (minimal changes)
2. **EventTokenManager**: Upgradeable ERC1155 token contract
3. **ERC1967Proxy**: Enables contract upgrades
4. **IEventTokenManager**: Interface for clean integration

## Features

### 🎫 **Event Token Minting**

When an event is created:

- ERC1155 tokens are automatically minted for the event
- Total supply equals the event's maximum attendees
- Each event gets a unique token ID
- Tokens are initially held by the StreamEvents contract

### 🎟️ **Registration Tokens**

When someone registers for an event:

- 1 ERC1155 token is transferred to the attendee
- Token serves as proof of registration
- Attendee can verify their registration by checking token balance
- Tokens can be traded or transferred (if desired)

### 🔄 **Upgradeability**

- EventTokenManager can be upgraded without affecting event data
- New features can be added to the token system
- Existing tokens and balances are preserved
- Only the owner can perform upgrades

## Smart Contract Functions

### StreamEvents Contract

```solidity
// Set the EventTokenManager contract
function setEventTokenManager(address _eventTokenManager) external onlyOwner

// Get token information
function getEventTokenId(uint256 eventId) external view returns (uint256)
function hasEventTokens(uint256 eventId, address holder) external view returns (bool)
function getEventTokenBalance(uint256 eventId, address holder) external view returns (uint256)
```

### EventTokenManager Contract

```solidity
// Mint tokens for a new event
function mintEventTokens(uint256 eventId, uint256 totalSupply, string memory tokenUri) external

// Transfer registration token to attendee
function transferRegistrationToken(uint256 eventId, address attendee, uint256 amount) external

// Query functions
function getEventTokenId(uint256 eventId) external view returns (uint256)
function hasEventTokens(uint256 eventId, address holder) external view returns (bool)
function getEventTokenBalance(uint256 eventId, address holder) external view returns (uint256)
function getRemainingTokenSupply(uint256 eventId) external view returns (uint256)
```

## Deployment Process

### 1. Deploy StreamEvents

```bash
forge script script/DeployStreamEvents.s.sol --rpc-url <network> --broadcast --verify
```

### 2. Deploy EventTokenManager

```bash
forge script script/DeployEventTokenManager.s.sol --rpc-url <network> --broadcast --verify
```

### 3. Deploy Complete System

```bash
forge script script/DeployAndIntegrate.s.sol --rpc-url <network> --broadcast --verify
```

## Usage Flow

### For Event Creators

1. **Create Event**:

   ```solidity
   uint256 eventId = streamEvents.createEvent(
       ipfsHash,
       startTime,
       endTime,
       maxAttendees,
       registrationFee,
       abi.encode(totalSupply) // Total token supply
   );
   ```

2. **Generate Confirmation Code**:

   ```solidity
   streamEvents.generateEventConfirmationCode(eventId);
   ```

3. **Mark Attendance**:
   ```solidity
   streamEvents.markAttended(eventId, attendeeAddress);
   ```

### For Event Attendees

1. **Register for Event**:

   ```solidity
   streamEvents.registerForEvent{value: registrationFee}(eventId);
   // Automatically receives 1 ERC1155 token
   ```

2. **Confirm Attendance**:

   ```solidity
   streamEvents.confirmAttendance(eventId, confirmationCode);
   ```

3. **Check Token Balance**:
   ```solidity
   uint256 balance = streamEvents.getEventTokenBalance(eventId, attendeeAddress);
   ```

## Token Metadata

Each event token includes:

- **Token ID**: Unique identifier for the event
- **Metadata URI**: Points to JSON metadata
- **Total Supply**: Maximum number of attendees
- **Remaining Supply**: Tokens still available

### Example Metadata URI

```
https://api.stream-events.com/metadata/1.json
```

### Example Metadata JSON

```json
{
  "name": "Web3 Conference 2024",
  "description": "Annual Web3 developer conference",
  "image": "https://api.stream-events.com/images/1.png",
  "attributes": [
    {
      "trait_type": "Event Type",
      "value": "Conference"
    },
    {
      "trait_type": "Date",
      "value": "2024-03-15"
    }
  ]
}
```

## Security Features

### 🔒 **Access Control**

- Only StreamEvents contract can mint/transfer tokens
- Only event creators can generate confirmation codes
- Only event creators can mark attendance

### 🔐 **Upgrade Safety**

- Upgradeable contract preserves all existing data
- Only owner can perform upgrades
- New implementation must be compatible

### 🛡️ **Token Security**

- Tokens are non-fungible per event
- Cannot be duplicated or forged
- Transfer restrictions can be added if needed

## Benefits

### For Event Creators

- **Proof of Value**: Tokens represent real event value
- **Analytics**: Track token distribution and trading
- **Monetization**: Potential for token-based features
- **Upgradeability**: Add new features without migration

### For Attendees

- **Proof of Registration**: Tangible token ownership
- **Transferability**: Can transfer or trade tokens
- **Verification**: Easy to verify registration status
- **Value**: Tokens may have secondary market value

### For the Platform

- **Modularity**: Clean separation of concerns
- **Scalability**: Upgradeable token system
- **Flexibility**: Easy to add new token features
- **Compatibility**: Works with existing event system

## Integration Examples

### Check if User Has Event Tokens

```solidity
bool hasTokens = streamEvents.hasEventTokens(eventId, userAddress);
```

### Get User's Token Balance

```solidity
uint256 balance = streamEvents.getEventTokenBalance(eventId, userAddress);
```

### Batch Operations

```solidity
// Transfer tokens for multiple events
eventTokenManager.batchTransferRegistrationTokens(
    eventIds,
    attendees,
    amounts
);
```

## Upgrade Process

### 1. Deploy New Implementation

```solidity
EventTokenManagerV2 newImplementation = new EventTokenManagerV2();
```

### 2. Upgrade Proxy

```solidity
eventTokenManager.upgradeToAndCall(address(newImplementation), "");
```

### 3. Verify Upgrade

```solidity
address implementation = eventTokenManager.implementation();
```

## Gas Optimization

- **Minimal StreamEvents Changes**: Avoids stack depth issues
- **Efficient Token Transfers**: Uses OpenZeppelin's optimized ERC1155
- **Batch Operations**: Support for multiple token operations
- **Storage Optimization**: Efficient mapping structures

## Future Enhancements

- **Token Trading**: Secondary market for event tokens
- **Token Staking**: Stake tokens for additional benefits
- **Dynamic Pricing**: Token-based pricing models
- **Cross-Chain**: Multi-chain token support
- **NFT Integration**: Convert tokens to NFTs

This system provides a robust, upgradeable foundation for event tokenization while maintaining the security and functionality of the existing event management system.
