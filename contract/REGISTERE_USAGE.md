# Registere Function Interaction Scripts

This directory contains scripts to interact with the `registere(string name, bytes data)` function on mainnet.

## Scripts Available

### 1. `InteractWithRegistere.s.sol`

A simple script for basic interaction with the registere function.

### 2. `RegistereInteraction.s.sol` (Recommended)

A comprehensive script with better error handling, gas estimation, and multi-network support.

## Setup

1. **Set Environment Variables:**

   ```bash
   export PRIVATE_KEY="your_private_key_here"
   export ALCHEMY_API_KEY="your_alchemy_api_key_here"  # For Ethereum mainnet
   ```

2. **Update Contract Addresses:**
   - Edit the contract addresses in `RegistereInteraction.s.sol` for your target networks
   - Currently configured for Base Sepolia (testnet)

## Usage

### Basic Usage (Base Sepolia Testnet)

```bash
# Run the basic interaction script
forge script script/RegistereInteraction.s.sol --rpc-url baseSepolia --broadcast --verify

# Run with custom parameters (you'll need to modify the script)
forge script script/RegistereInteraction.s.sol:callRegistereWithCustomParams --rpc-url baseSepolia --broadcast
```

### Mainnet Usage

```bash
# For Ethereum Mainnet
forge script script/RegistereInteraction.s.sol --rpc-url mainnet --broadcast --verify

# For Base Mainnet
forge script script/RegistereInteraction.s.sol --rpc-url base --broadcast --verify
```

### Gas Estimation Only

```bash
# Estimate gas without broadcasting
forge script script/RegistereInteraction.s.sol:estimateGas --rpc-url baseSepolia
```

## Important Notes

1. **Contract Address**: Make sure to update the contract address in the script for your target network
2. **Function Exists**: Ensure the `registere(string, bytes)` function actually exists on your deployed contract
3. **Gas Fees**: Mainnet transactions require ETH for gas fees
4. **Testing**: Always test on testnet first before using mainnet

## Function Signature

The script expects a function with this signature:

```solidity
function registere(string memory name, bytes memory data) external;
```

## Troubleshooting

- **"No contract address set"**: Update the contract address for your target network
- **"Function not found"**: Verify the function exists on the contract
- **"Insufficient balance"**: Ensure your account has enough ETH for gas fees
- **"Transaction failed"**: Check the error message for specific failure reasons

## Customization

You can modify the script to:

- Change the name and data parameters
- Add additional function calls
- Implement different error handling
- Add event listening
- Include transaction verification
