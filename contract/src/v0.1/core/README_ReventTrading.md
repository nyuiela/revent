# ReventTrading Contract

## Overview

`ReventTrading` is an independent trading contract that inherits from `Trading.sol` and `VolumeManager.sol` while still using `EventsV1.sol` for event data. This contract can be deployed separately from the main event system, providing a modular approach to trading functionality.

## Features

### Core Functionality

- **Event Trading**: Create buy/sell orders for event domains and investor shares
- **Volume Management**: Track trading volume and calculate price momentum
- **Price Management**: Dynamic pricing based on event value and trading activity
- **Order Management**: Create, update, cancel, and execute trading orders

### Doma Integration

- **Domain Tokenization**: Create events with domain tokenization in one transaction
- **Domain Trading**: Trade event domains with investor protection
- **Domain Bridging**: Bridge domains to other chains
- **Ownership Management**: Claim and manage domain ownership

### Investment System

- **Revenue Sharing**: Investors can participate in event revenue
- **Dynamic Pricing**: Share prices adjust based on event value and trading activity
- **Investor Protection**: Approval mechanisms for domain sales
- **Revenue Claims**: Investors can claim their share of accrued revenue

## Architecture

### Inheritance Chain

```
ReventTrading
├── ReentrancyGuard
├── Ownable
├── EventStorage
├── EventModifiers
├── PriceManager
├── VolumeManager
└── OrderManager
```

### Dependencies

- **EventsV1**: Reference to the main event contract for event data
- **DomaProxy**: Interface for domain tokenization and management
- **OwnershipToken**: Interface for domain ownership verification

## Key Functions

### Admin Functions

- `setEventsContract(address)`: Update the EventsV1 contract reference
- `setDomaProxy(address)`: Set the Doma proxy contract
- `setOwnershipToken(address)`: Set the ownership token contract
- `setFeeRecipient(address)`: Set the fee recipient address
- `setTradingFee(uint256)`: Set the trading fee in basis points
- `setOrderValueLimits(uint256, uint256)`: Set minimum and maximum order values
- `setOrderExpirationTime(uint256)`: Set default order expiration time

### Doma Integration

- `createEventWithTokenization(...)`: Create event and request tokenization
- `claimEventDomain(...)`: Claim ownership of event domain
- `bridgeEventDomain(...)`: Bridge domain to another chain
- `tipDomainOwner(uint256)`: Tip the domain owner directly

### Investment Functions

- `investInEvent(uint256)`: Invest ETH in an event for revenue sharing
- `registerForEventWithRevenuePool(uint256)`: Register for event with revenue pooling
- `claimRevenue(uint256)`: Claim accrued revenue as an investor

### Trading Functions

- `createSellOrder(...)`: Create sell order for event domain
- `createBuyOrder(...)`: Create buy order for event domain
- `createInvestorShareSellOrder(...)`: Create sell order for investor shares
- `createInvestorShareBuyOrder(...)`: Create buy order for investor shares
- `executeTrade(...)`: Execute a trade between buy and sell orders

### View Functions

- `getEvent(uint256)`: Get event data from EventsV1
- `getCurrentSharePrice(uint256)`: Get current dynamic share price
- `getPricingInfo(uint256)`: Get comprehensive pricing information
- `getTradingInfo(uint256)`: Get trading volume and momentum data
- `getInvestorShareBalance(uint256, address)`: Get investor's share balance
- `getTotalInvested(uint256)`: Get total invested amount for event

## Deployment

### Prerequisites

1. Deploy `EventsV1` contract first
2. Set up Doma proxy and ownership token contracts (optional)
3. Configure fee recipient and trading parameters

### Deployment Script

```bash
forge script script/DeployReventTrading.s.sol --rpc-url <RPC_URL> --broadcast --verify
```

### Environment Variables

- `PRIVATE_KEY`: Deployer's private key
- `EVENTS_CONTRACT`: Address of deployed EventsV1 contract
- `FEE_RECIPIENT`: Address to receive trading fees

## Configuration

### Initial Setup

```solidity
// Set fee recipient
reventTrading.setFeeRecipient(feeRecipient);

// Set trading fee (100 = 1%)
reventTrading.setTradingFee(100);

// Set order value limits
reventTrading.setOrderValueLimits(0.001 ether, 1000 ether);

// Set order expiration time
reventTrading.setOrderExpirationTime(7 days);
```

### Doma Integration Setup

```solidity
// Set Doma proxy
reventTrading.setDomaProxy(domaProxyAddress);

// Set ownership token
reventTrading.setOwnershipToken(ownershipTokenAddress);
```

## Usage Examples

### Create Event with Tokenization

```solidity
uint256 eventId = reventTrading.createEventWithTokenization{value: 0.1 ether}(
    "QmEventHash",
    block.timestamp + 1 days,
    block.timestamp + 2 days,
    100,
    0.1 ether,
    voucher,
    signature
);
```

### Invest in Event

```solidity
reventTrading.investInEvent{value: 1 ether}(eventId);
```

### Create Trading Order

```solidity
reventTrading.createBuyOrder{value: 0.5 ether}(
    eventId,
    0.5 ether, // maxPrice
    address(0), // currency (ETH)
    0 // expirationTime
);
```

### Execute Trade

```solidity
reventTrading.executeTrade{value: 0.5 ether}(
    buyOrderId,
    sellOrderId,
    0.5 ether // executionPrice
);
```

## Security Features

### Access Control

- Owner-only functions for critical operations
- Event creator permissions for event-specific actions
- Investor approval mechanisms for domain sales

### Reentrancy Protection

- All external functions protected with `nonReentrant` modifier
- Safe external calls with proper error handling

### Input Validation

- Comprehensive parameter validation
- Range checks for prices and amounts
- Time validation for expiration times

## Events

The contract emits events for all major operations:

- `EventsContractUpdated`: When EventsV1 contract is updated
- `DomaProxyUpdated`: When Doma proxy is updated
- `OwnershipTokenUpdated`: When ownership token is updated
- `DomaBridged`: When domain is bridged to another chain
- `DomaRequested`: When domain tokenization is requested

## Testing

Run the test suite:

```bash
forge test --match-contract ReventTradingTest
```

## Gas Optimization

The contract is optimized for gas efficiency:

- Efficient storage layout
- Minimal external calls
- Batch operations where possible
- Optimized loops for investor distributions

## Upgradeability

The contract is not upgradeable by design for security reasons. To update functionality:

1. Deploy new version
2. Migrate data if needed
3. Update references in dependent contracts

## License

MIT License - see LICENSE file for details.
