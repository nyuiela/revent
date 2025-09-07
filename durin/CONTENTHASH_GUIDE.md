# ContentHash and Text Records Guide

This guide explains how to use the enhanced L2Registrar to store website content (CID) and text records for subdomains.

## Overview

The enhanced L2Registrar now supports:

- **ContentHash**: Store IPFS CIDs for website HTML content
- **Text Records**: Store key-value pairs for metadata (description, URL, avatar, etc.)
- **Address Records**: Standard ENS address resolution

## Key Features

### 1. Registration with Content

When registering a subdomain, you can now include:

- ContentHash (CID) for website HTML content
- Text records for metadata

### 2. Content Management

- Update contentHash after registration
- Update text records after registration
- Query contentHash and text records

## Usage Examples

### Basic Registration with ContentHash

```solidity
// Register a subdomain with website content
string[] memory textKeys = new string[](3);
textKeys[0] = "description";
textKeys[1] = "url";
textKeys[2] = "avatar";

string[] memory textValues = new string[](3);
textValues[0] = "My awesome website";
textValues[1] = "https://mysite.yourdomain.eth";
textValues[2] = "https://example.com/avatar.png";

bytes memory contentHash = abi.encodePacked(
    uint8(0x01), // IPFS protocol
    uint8(0x70), // CIDv1
    uint8(0x12), // SHA2-256
    uint8(0x20), // 32 bytes
    keccak256("QmYourIPFSCIDHere123456789012345678901234567890123456789012345678901234")
);

registrar.registerWithContent(
    "mysite",
    owner,
    contentHash,
    textKeys,
    textValues
);
```

### Update ContentHash

```solidity
// Update the contentHash for an existing subdomain
bytes memory newContentHash = abi.encodePacked(
    uint8(0x01),
    uint8(0x70),
    uint8(0x12),
    uint8(0x20),
    keccak256("QmNewIPFSCIDHere123456789012345678901234567890123456789012345678901234")
);

registrar.updateContentHash("mysite", newContentHash);
```

### Update Text Records

```solidity
// Update text records for an existing subdomain
string[] memory textKeys = new string[](2);
textKeys[0] = "title";
textKeys[1] = "email";

string[] memory textValues = new string[](2);
textValues[0] = "My Website Title";
textValues[1] = "contact@mysite.com";

registrar.updateTextRecords("mysite", textKeys, textValues);
```

### Query ContentHash and Text Records

```solidity
// Get contentHash
bytes memory contentHash = registrar.getContentHash("mysite");

// Get text record
string memory description = registrar.getTextRecord("mysite", "description");
string memory url = registrar.getTextRecord("mysite", "url");
```

## ContentHash Format

The contentHash follows the ENS standard format:

- `0x01`: IPFS protocol identifier
- `0x70`: CIDv1 format
- `0x12`: SHA2-256 hash algorithm
- `0x20`: 32-byte hash length
- `32 bytes`: The actual hash

## Text Record Keys

Common text record keys include:

- `description`: Website description
- `url`: Website URL
- `avatar`: Avatar image URL
- `title`: Website title
- `email`: Contact email
- `twitter`: Twitter handle
- `github`: GitHub username
- `discord`: Discord server invite

## Security

- Only the owner of a subdomain can update its contentHash and text records
- The registrar must be approved by the registry admin
- All updates are subject to the same authorization checks as standard ENS operations

## Integration with Frontend

To fetch website content:

1. Query the contentHash from the resolver
2. Parse the contentHash to extract the IPFS CID
3. Fetch the HTML content from IPFS using the CID
4. Display the website content

Example JavaScript:

```javascript
// Get contentHash from resolver
const contentHash = await resolver.contenthash(node);
// Parse and fetch from IPFS
const cid = parseContentHash(contentHash);
const htmlContent = await ipfs.cat(cid);
```

## Testing

Run the contentHash tests:

```bash
forge test --match-contract ContentHashTest -vv
```

This will test:

- Registration with contentHash and text records
- Updating contentHash
- Updating text records
- Authorization checks
- Querying contentHash and text records

## Example Contract

See `examples/ContentHashExample.sol` for a complete example of how to integrate contentHash functionality into your application.
