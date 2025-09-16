# Upgradeable Event System

## Overview

The event system now includes full upgradeability for both the main StreamEvents contract and the EventTokenManager contract. This allows for future updates, bug fixes, and feature additions without requiring migration of existing data or breaking existing functionality.

## Architecture

### 🏗️ **Upgradeable Components**

```
StreamEventsUpgradeable (Upgradeable Main Contract)
    ↓
ERC1967Proxy (Upgradeability Proxy)
    ↓
StreamEventsUpgradeable Implementation

EventTokenManager (Upgradeable Token Contract)
    ↓
ERC1967Proxy (Upgradeability Proxy)
    ↓
EventTokenManager Implementation
```

### 📦 **Contract Structure**

1. **StreamEventsUpgradeable**: Upgradeable main event management contract
2. **EventTokenManager**: Upgradeable ERC1155 token contract
3. **ERC1967Proxy**: Enables contract upgrades for both contracts
4. **IEventTokenManager**: Interface for clean integration

## Features

### 🔄 **Full Upgradeability**

- **StreamEvents Contract**: Can be upgraded to add new features
- **EventTokenManager Contract**: Can be upgraded to add new token features
- **Data Preservation**: All existing data is preserved during upgrades
- **Seamless Upgrades**: No migration required for existing users

### 🛡️ **Security Features**

- **Owner-Only Upgrades**: Only the contract owner can perform upgrades
- **Authorization**: `_authorizeUpgrade` function controls upgrade permissions
- **Event Logging**: All upgrades are logged for transparency
- **Version Tracking**: Contract versions are tracked and logged

### 🎯 **Upgrade Benefits**

- **Bug Fixes**: Fix issues without affecting existing data
- **New Features**: Add functionality without breaking changes
- **Gas Optimization**: Improve gas efficiency in new versions
- **Security Updates**: Apply security patches as needed

## Smart Contract Functions

### StreamEventsUpgradeable Contract

```solidity
// Upgrade functions (inherited from UUPSUpgradeable)
function upgradeToAndCall(address newImplementation, bytes memory data) external payable

// EventTokenManager integration
function setEventTokenManager(address _eventTokenManager) external onlyOwner
function getEventTokenId(uint256 eventId) external view returns (uint256)
function hasEventTokens(uint256 eventId, address holder) external view returns (bool)
function getEventTokenBalance(uint256 eventId, address holder) external view returns (uint256)

// Trusted forwarder management
function setTrustedForwarder(address _trustedForwarder) external onlyOwner
function isTrustedForwarder(address forwarder) external view returns (bool)

// Version and emergency functions
function version() external pure returns (string memory)
function emergencyPause() external onlyOwner
function emergencyUnpause() external onlyOwner
```

### EventTokenManager Contract

```solidity
// Upgrade functions (inherited from UUPSUpgradeable)
function upgradeToAndCall(address newImplementation, bytes memory data) external payable

// Token management
function mintEventTokens(uint256 eventId, uint256 totalSupply, string memory tokenUri) external
function transferRegistrationToken(uint256 eventId, address attendee, uint256 amount) external

// Query functions
function getEventTokenId(uint256 eventId) external view returns (uint256)
function hasEventTokens(uint256 eventId, address holder) external view returns (bool)
function getEventTokenBalance(uint256 eventId, address holder) external view returns (uint256)
```

## Deployment Process

### 1. Deploy StreamEventsUpgradeable

```bash
forge script script/DeployStreamEventsUpgradeable.s.sol --rpc-url <network> --broadcast --verify
```

### 2. Deploy EventTokenManager

```bash
forge script script/DeployEventTokenManager.s.sol --rpc-url <network> --broadcast --verify
```

### 3. Deploy Complete System

```bash
forge script script/DeployCompleteUpgradeableSystem.s.sol --rpc-url <network> --broadcast --verify
```

## Upgrade Process

### 1. Deploy New Implementation

```solidity
// Deploy new implementation contract
StreamEventsUpgradeableV2 newImplementation = new StreamEventsUpgradeableV2();
```

### 2. Upgrade Contract

```solidity
// Upgrade to new implementation
streamEvents.upgradeToAndCall(address(newImplementation), "");
```

### 3. Verify Upgrade

```solidity
// Check new version
string memory newVersion = streamEvents.version();
```

## Usage Examples

### Deploying the System

```solidity
// Deploy complete upgradeable system
DeployCompleteUpgradeableSystem deployer = new DeployCompleteUpgradeableSystem();
deployer.run();
```

### Upgrading Contracts

```solidity
// Upgrade StreamEvents
deployer.upgradeStreamEvents(newStreamEventsImplementation);

// Upgrade EventTokenManager
deployer.upgradeTokenManager(newTokenManagerImplementation);

// Upgrade both contracts
deployer.upgradeBothContracts(newStreamEventsImpl, newTokenManagerImpl);
```

### Checking System Status

```solidity
// Check contract versions
string memory streamEventsVersion = streamEvents.version();
string memory tokenManagerVersion = eventTokenManager.version();

// Check upgrade status
address currentImplementation = streamEvents.implementation();
```

## Upgrade Safety

### ✅ **Data Preservation**

- All existing event data is preserved
- User registrations remain intact
- Token balances are maintained
- Event history is preserved

### ✅ **Function Compatibility**

- Existing functions continue to work
- New functions can be added
- Function signatures can be extended
- Storage layout is preserved

### ✅ **Access Control**

- Only owner can perform upgrades
- Upgrade authorization is required
- All upgrades are logged
- Rollback capability available

## Best Practices

### 🔒 **Security**

- Always test upgrades on testnets first
- Verify new implementation thoroughly
- Use multi-sig for production upgrades
- Monitor upgrade events

### 📋 **Testing**

- Test all existing functionality after upgrade
- Verify data integrity
- Test new features thoroughly
- Check gas usage changes

### 🚀 **Deployment**

- Deploy during low-activity periods
- Communicate upgrades to users
- Have rollback plan ready
- Monitor system after upgrade

## Version Management

### Current Versions

- **StreamEventsUpgradeable**: v1.0.0
- **EventTokenManager**: v1.0.0

### Version History

| Version | Changes                            | Date       |
| ------- | ---------------------------------- | ---------- |
| v1.0.0  | Initial upgradeable implementation | 2024-09-15 |

### Future Versions

- **v1.1.0**: Enhanced event management features
- **v1.2.0**: Advanced token functionality
- **v2.0.0**: Major feature additions

## Emergency Procedures

### Emergency Pause

```solidity
// Pause system in emergency
streamEvents.emergencyPause();
```

### Emergency Unpause

```solidity
// Resume system after emergency
streamEvents.emergencyUnpause();
```

### Rollback

```solidity
// Rollback to previous implementation
streamEvents.upgradeToAndCall(previousImplementation, "");
```

## Monitoring and Alerts

### Events to Monitor

```solidity
// Contract upgrade events
event ContractUpgraded(address indexed oldImplementation, address indexed newImplementation);

// EventTokenManager updates
event EventTokenManagerUpdated(address indexed oldManager, address indexed newManager);

// Trusted forwarder updates
event TrustedForwarderUpdated(address indexed oldForwarder, address indexed newForwarder);
```

### Health Checks

- Verify contract functionality after upgrade
- Check event emission
- Validate token operations
- Test user interactions

## Gas Optimization

### Upgrade Costs

- **Implementation Deployment**: ~2M gas
- **Proxy Upgrade**: ~50K gas
- **Data Migration**: 0 gas (automatic)

### Cost Comparison

| Operation    | Non-Upgradeable | Upgradeable |
| ------------ | --------------- | ----------- |
| Deploy       | 5M gas          | 7M gas      |
| Upgrade      | N/A             | 50K gas     |
| New Features | Redeploy        | Upgrade     |

## Integration Examples

### Frontend Integration

```javascript
// Check if contract is upgradeable
const isUpgradeable = await streamEvents.hasRole(UPGRADER_ROLE, owner);

// Listen for upgrade events
streamEvents.on("ContractUpgraded", (oldImpl, newImpl) => {
  console.log("Contract upgraded:", oldImpl, "->", newImpl);
});
```

### Backend Integration

```solidity
// Monitor upgrade events
function onUpgrade(address oldImplementation, address newImplementation) external {
    // Update internal references
    // Notify other systems
    // Log upgrade details
}
```

## Troubleshooting

### Common Issues

1. **Upgrade Authorization Failed**

   - Check if caller is owner
   - Verify `_authorizeUpgrade` implementation

2. **Implementation Not Compatible**

   - Check storage layout compatibility
   - Verify function signatures

3. **Upgrade Transaction Failed**
   - Check gas limits
   - Verify implementation address

### Debug Commands

```bash
# Check current implementation
cast call <proxy> "implementation()" --rpc-url <rpc>

# Check contract version
cast call <proxy> "version()" --rpc-url <rpc>

# Check upgrade authorization
cast call <proxy> "owner()" --rpc-url <rpc>
```

## Future Enhancements

### Planned Features

- **Multi-sig Upgrade Control**: Require multiple signatures for upgrades
- **Timelock Upgrades**: Add delay before upgrades take effect
- **Upgrade Proposals**: Community voting for upgrades
- **Automatic Rollback**: Automatic rollback on failure

### Advanced Features

- **Hot Swapping**: Upgrade without downtime
- **A/B Testing**: Test new features with subset of users
- **Feature Flags**: Enable/disable features dynamically
- **Performance Monitoring**: Real-time upgrade monitoring

This upgradeable system provides maximum flexibility while maintaining security and data integrity, ensuring the event platform can evolve with changing requirements and user needs.
