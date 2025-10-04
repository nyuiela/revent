# Revent
<img width="5464" height="3072" alt="revent-board-1-2@4x" src="https://github.com/user-attachments/assets/69bf45c0-44c7-43c7-845c-c6d6dd24b3cc" />

REVENT transforms events into investable digital economies by leveraging the **DOMA Protocol**, smart contracts, and decentralized storage. This repository contains the contracts, frontend applications, domain templates, and subgraph indexing setup for the REVENT ecosystem.


## Repository Structure

```
/frontend         # Next.js application (pnpm package manager)
/contract         # Foundry-based smart contracts
/domain_template  # Next.js app template for event domains (pnpm)
/graph            # The Graph subgraph configuration
```


## Deployed Contracts (Base Sepolia)

- **ReventTrading**: `0xD9EA83c725F9Bfafc452de4Ca907A8280E7d802B`
- **Events Contract**: `0x0A46eB850A04D1B1a6A1385307a23cB9f4f08C70`


## Environment Variables

For contract deployment and interaction, create a `.env` file inside the `/contract` folder with the following variables:

```bash
PRIVATE_KEY=your_private_key
BASE_SEPOLIA_RPC_URL=https://base-sepolia.drpc.org
ETHERSCAN_API=your_etherscan_key
EVENTS_CONTRACT=0x0A46eB850A04D1B1a6A1385307a23cB9f4f08C70
FEE_RECIPIENT=0xf0830060f836B8d54bF02049E5905F619487989e
OWNERSHIP_TOKEN=0x2f45DfC5f4c9473fa72aBdFbd223d0979B265046
DOMA_PROXY=0xa40aA710F0C77DF3De6CEe7493d1FfF3715D59Da
```


## Setup Instructions

### Frontend (`/frontend`)

1. Navigate to the `frontend` directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Run development server:

   ```bash
   pnpm dev
   ```

### Domain Template (`/domain_template`)

1. Navigate to the `domain_template` directory:

   ```bash
   cd domain_template
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Run development server:

   ```bash
   pnpm dev
   ```

### Contracts (`/contract`)

1. Navigate to the `contract` directory:

   ```bash
   cd contract
   ```

2. Install Foundry (if not already installed):
   [Foundry installation guide](https://book.getfoundry.sh/getting-started/installation)
3. Build contracts:

   ```bash
   forge build
   ```

4. Run tests:

   ```bash
   forge test
   ```

5. Deploy contracts with environment variables set in `.env`:

   ```bash
   forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify
   ```

### Subgraph (`/graph`)

1. Navigate to the `graph` directory:

   ```bash
   cd graph
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Authenticate with The Graph:

   ```bash
   graph auth https://api.thegraph.com/deploy/ <ACCESS_TOKEN>
   ```

4. Deploy subgraph:

   ```bash
   graph deploy --product hosted-service <SUBGRAPH_NAME>
   ```

---

## Tech Stack

- **Frontend / Domain Template**: Next.js + pnpm
- **Contracts**: Solidity + Foundry
- **Subgraph**: The Graph Protocol
- **Storage**: IPFS (for media + event metadata)
- **Chain**: Base (Sepolia testnet)

---

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/new-feature`).
3. Commit changes (`git commit -m "Add new feature"`).
4. Push to branch (`git push origin feature/new-feature`).
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License.

---

## Contact

For inquiries or contributions, please open an issue or reach out to the REVENT team.
