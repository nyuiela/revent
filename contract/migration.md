# Migration Guide: DomaIntegrate.sol → ReventTrading.sol

## Overview

This guide helps you migrate from the old `DomaIntegrate.sol` contract to the new independent `ReventTrading.sol` contract. The new contract provides the same functionality but with better modularity and independence.

## Key Changes

### 1. Contract Structure

**Old (DomaIntegrate.sol):**

- Abstract contract that required inheritance from event contract
- Tightly coupled with event management
- Limited deployment flexibility

**New (ReventTrading.sol):**

- Independent contract that can be deployed separately
- References EventsV1 contract instead of inheriting from it
- Full inheritance from Trading.sol and VolumeManager.sol

### 2. Deployment

**Old:**

```solidity
// Had to be deployed as part of event contract
contract EventContract is EventsV1, EventDomaIntegration {
    // Implementation
}
```

**New:**

```solidity
// Can be deployed independently
ReventTrading reventTrading = new ReventTrading(eventsV1Address);
```

### 3. Function Access

**Old:**

- Functions were part of the main event contract
- Direct access to event storage

**New:**

- Functions are in separate contract
- Access to event data through EventsV1 interface
- Requires proper contract references

## Migration Steps

### Step 1: Deploy ReventTrading Contract

```solidity
// Deploy EventsV1 first (if not already deployed)
EventsV1 eventsV1 = new EventsV1();
eventsV1.initialize("https://api.revent.com/metadata/");

// Deploy ReventTrading with EventsV1 reference
ReventTrading reventTrading = new ReventTrading(address(eventsV1));
```

### Step 2: Configure the Contract

```solidity
// Set fee recipient
reventTrading.setFeeRecipient(feeRecipientAddress);

// Set trading fee (100 = 1%)
reventTrading.setTradingFee(100);

// Set order value limits
reventTrading.setOrderValueLimits(0.001 ether, 1000 ether);

// Set order expiration time
reventTrading.setOrderExpirationTime(7 days);
```

### Step 3: Set Up Doma Integration (Optional)

```solidity
// Set Doma proxy if using domain features
reventTrading.setDomaProxy(domaProxyAddress);

// Set ownership token
reventTrading.setOwnershipToken(ownershipTokenAddress);
```

### Step 4: Update Frontend/Client Code

#### Old Function Calls:

```javascript
// Old way - direct contract calls
await eventContract.createEventWithTokenization(...);
await eventContract.investInEvent(...);
await eventContract.registerForEventWithRevenuePool(...);
```

#### New Function Calls:

```javascript
// New way - through ReventTrading contract
await reventTrading.createEventWithTokenization(...);
await reventTrading.investInEvent(...);
await reventTrading.registerForEventWithRevenuePool(...);
```

### Step 5: Update Event Creation Flow

#### Old Flow:

```solidity
// Create event directly
uint256 eventId = this.createEvent(ipfsHash, startTime, endTime, maxAttendees, registrationFee);
// Request tokenization
IDomaProxy(domaProxy).requestTokenization{value: msg.value}(voucher, registrarSignature);
```

#### New Flow:

```solidity
// Create event with tokenization in one call
uint256 eventId = reventTrading.createEventWithTokenization{value: msg.value}(
    ipfsHash,
    startTime,
    endTime,
    maxAttendees,
    registrationFee,
    voucher,
    registrarSignature
);
```

## Function Mapping

### Event Creation

| Old Function                    | New Function                                  | Notes                                 |
| ------------------------------- | --------------------------------------------- | ------------------------------------- |
| `createEvent()`                 | `eventsV1.createEvent()`                      | Now called through EventsV1 reference |
| `createEventWithTokenization()` | `reventTrading.createEventWithTokenization()` | Same interface, different contract    |

### Doma Integration

| Old Function          | New Function                        | Notes          |
| --------------------- | ----------------------------------- | -------------- |
| `claimEventDomain()`  | `reventTrading.claimEventDomain()`  | Same interface |
| `bridgeEventDomain()` | `reventTrading.bridgeEventDomain()` | Same interface |
| `tipDomainOwner()`    | `reventTrading.tipDomainOwner()`    | Same interface |

### Investment Functions

| Old Function                        | New Function                                      | Notes          |
| ----------------------------------- | ------------------------------------------------- | -------------- |
| `investInEvent()`                   | `reventTrading.investInEvent()`                   | Same interface |
| `registerForEventWithRevenuePool()` | `reventTrading.registerForEventWithRevenuePool()` | Same interface |
| `claimRevenue()`                    | `reventTrading.claimRevenue()`                    | Same interface |

### Trading Functions

| Old Function        | New Function                      | Notes          |
| ------------------- | --------------------------------- | -------------- |
| `createSellOrder()` | `reventTrading.createSellOrder()` | Same interface |
| `createBuyOrder()`  | `reventTrading.createBuyOrder()`  | Same interface |
| `executeTrade()`    | `reventTrading.executeTrade()`    | Same interface |

## Storage Migration

### Event Data

- Event data remains in EventsV1 contract
- No migration needed for event storage
- ReventTrading accesses event data through interface

### Trading Data

- Trading data is now stored in ReventTrading contract
- No migration needed for new deployments
- Existing trading data would need manual migration if upgrading

### Investment Data

- Investment data is stored in ReventTrading contract
- Revenue sharing calculations remain the same
- No changes to investment logic

## Testing Migration

### Update Test Files

```solidity
// Old test setup
contract EventContractTest is EventContract {
    function setUp() public {
        eventContract = new EventContract();
    }
}

// New test setup
contract ReventTradingTest is Test {
    function setUp() public {
        eventsV1 = new EventsV1();
        eventsV1.initialize("https://api.revent.com/metadata/");
        reventTrading = new ReventTrading(address(eventsV1));
    }
}
```

### Update Test Functions

```solidity
// Old test
function testCreateEvent() public {
    uint256 eventId = eventContract.createEvent(...);
    // assertions
}

// New test
function testCreateEvent() public {
    uint256 eventId = eventsV1.createEvent(...);
    // assertions
}
```

## Deployment Scripts

### Old Deployment

```solidity
contract DeployEventContract is Script {
    function run() external {
        EventContract eventContract = new EventContract();
        // configuration
    }
}
```

### New Deployment

```solidity
contract DeployReventTrading is Script {
    function run() external {
        EventsV1 eventsV1 = new EventsV1();
        eventsV1.initialize("https://api.revent.com/metadata/");

        ReventTrading reventTrading = new ReventTrading(address(eventsV1));
        reventTrading.setFeeRecipient(feeRecipient);
        // other configuration
    }
}
```

## Benefits of Migration

### 1. Modularity

- Trading functionality is now independent
- Can be deployed and updated separately
- Easier to maintain and test

### 2. Flexibility

- Can use different event contracts
- Easier to add new trading features
- Better separation of concerns

### 3. Gas Efficiency

- Optimized for trading operations
- Reduced gas costs for trading functions
- Better storage layout

### 4. Security

- Isolated trading logic
- Reduced attack surface
- Better access control

## Rollback Plan

If you need to rollback to the old system:

1. **Keep EventsV1 contract** - This remains unchanged
2. **Deploy old DomaIntegrate contract** - As part of event contract
3. **Update frontend references** - Point back to old contract
4. **Migrate data if needed** - Move trading data back to old contract

## Support

For questions or issues during migration:

1. Check the test files for examples
2. Review the deployment scripts
3. Consult the README_ReventTrading.md file
4. Test thoroughly on testnet before mainnet deployment

## Conclusion

The new ReventTrading contract provides the same functionality as the old DomaIntegrate contract but with better modularity and independence. The migration process is straightforward, and the new contract offers significant benefits in terms of maintainability and flexibility.
