## StreamEvents Protocol

An onchain events and ticketing protocol with domain ownership integration and optional investor revenue sharing. The main entrypoint is the `StreamEvents` facade contract, which composes modular features for event lifecycle, attendee registration, ticketing, Doma domain tokenization, and revenue distribution.

### Table of Contents
- Overview
- Architecture
- Event Lifecycle
- Registration and Attendance
- Ticketing
- Doma Integration (Domains and Bridging)
- Investment and Revenue Sharing
- Fees and Administration
- Read APIs
- Events Emitted
- Deploy and Configure
- Example Usage
- Testing
- Security Notes
- Repository Structure

### Overview
The protocol enables creators to:
- Create and manage events with metadata stored off-chain (IPFS hash) and lifecycle states: DRAFT → PUBLISHED → LIVE → COMPLETED/CANCELLED.
- Accept registrations with optional fees and confirmations; auto-generate unique confirmation codes.
- Define ticket SKUs with pricing, supply, and perks; support free and paid tickets.
- Integrate with Doma domain ownership tokens to tokenize event domains, claim ownership, and bridge across chains.
- Pool a portion of net revenue for investors and allow pro‑rata claims.

### Architecture
- `src/event.sol` → `StreamEvents` facade that inherits feature modules:
  - `EventManagement`: create/update/publish/start/end/cancel events and Doma linking hooks.
  - `EventAttendees`: registration, attendance confirmation, attendance marking.
  - `EventTickets`: ticket CRUD and purchase; auto-registers buyers.
  - `EventDomaIntegration`: Doma tokenization, claiming, bridging; investor pool; revenue claims; tipping.
  - `EventQueries`: read-only getters across events, attendees, tickets, and Doma info.
  - `EventAdmin`: protocol-wide admin for fees and Doma config (`onlyOwner`).
  - `EventModifiers`, `EventInternalUtils`: shared modifiers and helpers.
- `EventStorage` centralizes state:
  - Events, attendees, tickets, creator indexes
  - Platform fee, min/max registration fee, fee recipient
  - Doma config: `domaProxy`, `ownershipToken`, `trustedForwarder`, `registrarIanaId`, `domaChainId`
  - Doma per-event linkage: `eventToDomaTokenId`, `eventToDomaStatus`
  - Investor pool: `totalInvested`, `investorShares`, `revenueAccrued`, `revenueClaimed`, `investorBps`
- External deps: OpenZeppelin `Ownable`, `ReentrancyGuard`.

### Event Lifecycle
- `createEvent(ipfsHash, startTime, endTime, maxAttendees, registrationFee)`
  - Validates time bounds, non-empty IPFS hash, `maxAttendees > 0`, and `registrationFee` within limits.
  - Initializes as `DRAFT`, `isActive=true`, `isLive=false`.
- `updateEvent(...)` (creator only)
  - Updates metadata and constraints while preserving invariants.
- `publishEvent(eventId)` → sets status to `PUBLISHED`.
- `startLiveEvent(eventId)` → requires now ≥ `startTime`; sets status to `LIVE`, `isLive=true`.
- `endEvent(eventId)` (creator) → requires `LIVE`, sets `COMPLETED`.
- `cancelEvent(eventId)` (creator) → sets `CANCELLED`, deactivates event.

### Registration and Attendance
- `registerForEvent(eventId)`
  - Requires `PUBLISHED`, event active, capacity available, and exact `msg.value == registrationFee`.
  - Generates a unique confirmation code; splits payment into platform fee and creator payout.
- `confirmAttendance(eventId, attendee, confirmationCode)` (creator)
- `markAttended(eventId, attendee)` (creator)
- Internals
  - Confirmation codes are generated from eventId, attendee, timestamp, and deduplicated.
  - Fees: platform fee in basis points (bps) to `feeRecipient` or owner fallback.

### Ticketing
- `addTicket(eventId, name, ticketType, price, currency, totalQuantity, perks[])` (creator)
- `updateTicket(eventId, ticketId, ...)` (creator)
- `removeTicket(eventId, ticketId)` (creator)
- `buyTicket(eventId, ticketId)`
  - Validates SKU, activity, and supply; enforces exact pricing when `price > 0`.
  - Splits payment into platform fee and creator payout.
  - Auto-registers the buyer as an attendee if not already registered (free, with generated code).

### Doma Integration (Domains and Bridging)
Owner-configured settings via `setDomaConfig` in `EventAdmin` or `EventManagement`:
- `domaProxy`, `ownershipToken`, `trustedForwarder`, `registrarIanaId`, `domaChainId`.

Flows:
- `createEventWithTokenization(..., voucher, registrarSignature)`
  - Creates the event, then calls the Doma proxy `requestTokenization` (payable), marks status as requested.
- `linkDomaMinted(eventId, tokenId)`, `linkDomaClaimed(eventId)`
  - Hooks to link off-chain tokenization/claiming outcomes.
- `claimEventDomain(eventId, isSynthetic, proof, proofSignature)` (creator, payable)
- `bridgeEventDomain(eventId, isSynthetic, targetChainId, targetOwnerAddress)` (creator, payable)
- `getEventDomaInfo(eventId)` → returns token info via `IOwnershipToken` if configured.
- `tipDomainOwner(eventId)` (payable) → forwards value to ownership token owner.

### Investment and Revenue Sharing
- `investInEvent(eventId)` (payable)
  - Tracks investor deposits per event.
- `registerForEventWithRevenuePool(eventId)` (payable)
  - Similar to `registerForEvent`, but splits net revenue: a share to investors (by `investorBps`, default 5000 = 50%) and the rest to the creator.
  - Accrues investor portion into `revenueAccrued[eventId]`.
- `claimRevenue(eventId)`
  - Investors claim pro‑rata accrued revenue by `investorShares / totalInvested`.

### Fees and Administration
- Parameters:
  - `platformFee` (bps), `feeRecipient`, `minRegistrationFee`, `maxRegistrationFee`.
- Admin functions (`onlyOwner`):
  - `updatePlatformFee(newFee)` (capped at 10%)
  - `updateRegistrationFeeLimits(minFee, maxFee)`
  - `emergencyWithdraw()` → drains contract balance to `feeRecipient` or owner.

### Read APIs
- Events and creators: `getEvent(eventId)`, `getCreatorEvents(creator)`
- Attendees: `getEventAttendees(eventId)`, `getAttendee(eventId, user)`, `isRegisteredForEvent(eventId, user)`
- Tickets: `getEventTickets(eventId)`, `getTicket(ticketId)`
- Doma info: `getEventDomaInfo(eventId)`
- Counters: `getTotalEvents()`

### Events Emitted
- `EventCreated`, `EventUpdated`, `EventStatusChanged`
- `AttendeeRegistered`, `AttendeeConfirmed`, `AttendeeAttended`
- `TicketAdded`, `TicketUpdated`, `TicketRemoved`, `TicketPurchased`
- Admin: `PlatformFeeUpdated`, `RegistrationFeeLimitsUpdated`
- Doma: `DomaRequested`, `DomaClaimed`, `DomaBridged`

### Deploy and Configure
- Build contracts:
  ```bash
  forge build
  ```
- Deploy `StreamEvents` (example):
  ```bash
  forge create src/event.sol:StreamEvents --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>
  ```
- Configure protocol admin (owner account):
  ```bash
  cast send <STREAM_EVENTS_ADDRESS> "updatePlatformFee(uint256)" 250 --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>
  cast send <STREAM_EVENTS_ADDRESS> "updateRegistrationFeeLimits(uint256,uint256)" 1000000000000000 1000000000000000000 --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>
  ```
- Configure Doma (owner account):
  ```bash
  cast send <STREAM_EVENTS_ADDRESS> "setDomaConfig(address,address,address,uint256,string)" <DOMA_PROXY> <OWNERSHIP_TOKEN> <TRUSTED_FORWARDER> <REGISTRAR_IANA_ID> <CHAIN_ID> --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>
  ```

### Example Usage
1) Creator creates and publishes an event:
```bash
cast send <STREAM_EVENTS> "createEvent(string,uint256,uint256,uint256,uint256)" <IPFS_HASH> <START_TS> <END_TS> 100 1000000000000000 --rpc-url <RPC_URL> --private-key <CREATOR_PK>
cast call <STREAM_EVENTS> "getCreatorEvents(address)" <CREATOR_ADDRESS> --rpc-url <RPC_URL>
cast send <STREAM_EVENTS> "publishEvent(uint256)" <EVENT_ID> --rpc-url <RPC_URL> --private-key <CREATOR_PK>
```
2) Attendee registers:
```bash
cast send <STREAM_EVENTS> "registerForEvent(uint256)" <EVENT_ID> --value 1000000000000000 --rpc-url <RPC_URL> --private-key <USER_PK>
```
3) Creator manages tickets:
```bash
cast send <STREAM_EVENTS> "addTicket(uint256,string,string,uint256,string,uint256,string[])" <EVENT_ID> "General" "GA" 0 "NATIVE" 0 [] --rpc-url <RPC_URL> --private-key <CREATOR_PK>
```
4) Investor deposits and claims:
```bash
cast send <STREAM_EVENTS> "investInEvent(uint256)" <EVENT_ID> --value 1000000000000000000 --rpc-url <RPC_URL> --private-key <INVESTOR_PK>
cast send <STREAM_EVENTS> "claimRevenue(uint256)" <EVENT_ID> --rpc-url <RPC_URL> --private-key <INVESTOR_PK>
```

### Testing
- Run all tests (uses Foundry):
```bash
forge test -vvvv
```
- The sample test `test/event.t.sol` covers creating an event, publishing, starting, and registering.

### Security Notes
- Access control:
  - Protocol admin via `onlyOwner` in `EventAdmin`.
  - Event mutation guarded by `onlyEventCreator`.
- Reentrancy protection on payable flows in registration and ticket purchase.
- Payments use `transfer`/`call` where appropriate; ensure recipients are trusted.
- `trustedForwarder` exists for potential gasless flows but is not enforced in current functions.
- Always validate Doma contracts and vouchers off-chain prior to calling payable functions.

### Repository Structure
- `src/event.sol` → Facade `StreamEvents`.
- `src/events/*` → Modules (`Storage`, `Modifiers`, `Management`, `Attendees`, `Tickets`, `Queries`, `Admin`, `DomaIntegration`, `Types`).
- `src/doma/*` → Doma interfaces and utils.
- `test/event.t.sol` → Basic unit tests.
- `REGISTERE_USAGE.md` → Example script usage notes for a separate `registere(string,bytes)` interaction.

### License
MIT

### Doma Path: Detailed Flow

This expands on Doma integration with step-by-step flows and references to functions and state.

#### Configuration (owner)
- `setDomaConfig(address domaProxy, address ownershipToken, address trustedForwarder, uint256 registrarIanaId, string domaChainId)`
- Required before tokenization/claim/bridge; otherwise Doma functions revert with "doma proxy not set".

#### State tracked per event
- `eventToDomaTokenId[eventId]`: linked ownership tokenId
- `eventToDomaStatus[eventId]`: 0 None, 1 Requested, 2 Minted, 3 Claimed

#### End-to-end sequence
1) Request tokenization during creation (creator):
   - `createEventWithTokenization(..., IDomaProxy.TokenizationVoucher voucher, bytes registrarSignature)` (payable)
   - Validates `voucher.ownerAddress == msg.sender`; calls `IDomaProxy.requestTokenization{value: msg.value}(...)`.
   - Sets status → Requested (1); emits `DomaRequested(eventId)`.

2) Link minted token (off-chain agent/registrar role in production):
   - `linkDomaMinted(eventId, tokenId)`
   - Sets `eventToDomaTokenId[eventId] = tokenId`, status → Minted (2).

3) Claim domain ownership (creator):
   - `claimEventDomain(eventId, bool isSynthetic, IDomaProxy.ProofOfContactsVoucher proof, bytes proofSignature)` (payable)
   - Requires token linked; calls `IDomaProxy.claimOwnership{value: msg.value}(tokenId, ...)`.
   - Sets status → Claimed (3) optimistically.

4) Bridge domain cross-chain (creator):
   - `bridgeEventDomain(eventId, bool isSynthetic, string targetChainId, string targetOwnerAddress)` (payable)
   - Calls `IDomaProxy.bridge{value: msg.value}(tokenId, isSynthetic, targetChainId, targetOwnerAddress)`.
   - Emits `DomaBridged(eventId, targetChainId, targetOwnerAddress)`.

#### Read APIs
- `getEventDomaInfo(eventId)` → `(tokenId, status, expiration, isLocked, registrar)` by querying `IOwnershipToken` when configured.
- Ownership lookup for tipping uses `IOwnershipToken.ownerOf(tokenId)`.

#### Tipping the domain owner
- `tipDomainOwner(eventId)` (payable) → forwards `msg.value` to `ownerOf(tokenId)` of `ownershipToken`.

#### Failure modes and guardrails
- Missing config: Doma calls revert if `domaProxy == address(0)`.
- Unlinked token: Claim/bridge require `eventToDomaTokenId[eventId] != 0`.
- Access: Only the event creator may call claim/bridge. In production, restrict `linkDomaMinted/Claimed` to trusted roles.
- Fees: Payable functions must include sufficient ETH for Doma proxy operations.
