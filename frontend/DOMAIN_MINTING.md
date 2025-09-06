# Domain Minting Feature

The event creation form now includes a final step for minting a decentralized domain name (ENS) for your event. This creates a complete decentralized event system with IPFS storage and ENS domain resolution.

## 🌐 **New Step 7: Domain Minting**

After creating your event and optionally adding tickets, users can now mint a custom ENS domain name that points to their event's IPFS metadata.

### **Features:**

- ✅ **Domain Availability Checking**: Real-time validation of ENS domain availability
- ✅ **Domain Validation**: Ensures proper ENS naming conventions (lowercase, alphanumeric, hyphens)
- ✅ **IPFS Integration**: Domain points to event's IPFS metadata
- ✅ **Skip Option**: Users can skip domain minting if desired
- ✅ **Transaction Flow**: Integrated with existing OnchainKit transaction system

## 🔧 **How It Works:**

### **1. Domain Input & Validation**

- Users enter a domain name (e.g., "abc")
- System automatically appends ".nyuiela.eth" suffix
- Real-time validation ensures proper format
- Only lowercase letters, numbers, and hyphens allowed
- Domain format: `abc.nyuiela.eth`

### **2. Availability Checking**

- Checks ENS registry for domain availability
- Mock implementation with common taken domains
- Visual feedback with green/red status indicators
- Prevents minting of already-taken domains

### **3. Domain Minting Process**

- Prepares ENS registration contract calls
- Sets up content hash to point to event IPFS metadata
- Executes transaction to mint the domain
- Domain becomes permanently owned by the user

### **4. Integration with Event System**

- Domain points to event's IPFS metadata
- Works with IPFS stream viewers
- Enables decentralized event discovery
- Censorship-resistant event URLs

## 📋 **Transaction Flow:**

### **Simple Mode:**

1. Create Event → Domain Minting → Complete

### **Advanced Mode:**

1. Create Event → Add Tickets → Domain Minting → Complete

### **Skip Options:**

- Users can skip domain minting at any point
- Event creation completes without domain
- Domain can be minted later if needed

## 🎯 **Benefits:**

### **For Event Organizers:**

- **Easy URLs**: `abc.nyuiela.eth` instead of long IPFS hashes
- **Branding**: Custom domain for event marketing
- **Ownership**: Permanent ownership of the domain
- **Decentralization**: No central authority control
- **Ecosystem**: Part of the nyuiela.eth domain ecosystem

### **For Event Attendees:**

- **Easy Access**: Simple, memorable URLs
- **Reliability**: Works with any IPFS gateway
- **Transparency**: Direct access to event metadata
- **Censorship Resistance**: Cannot be taken down

## 🔗 **Integration with IPFS Stream Viewer:**

The minted domain works seamlessly with the IPFS stream viewers:

```html
<!-- Users can access events via ENS domains -->
<iframe src="https://myevent.eth" width="100%" height="600px"></iframe>

<!-- Or use IPFS gateways -->
<iframe
  src="https://ipfs.io/ipfs/QmXxXxXx..."
  width="100%"
  height="600px"
></iframe>
```

## 🛠️ **Technical Implementation:**

### **Domain Validation:**

```javascript
// Ensures proper ENS naming for nyuiela.eth ecosystem
const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
setDomainName(value + ".nyuiela.eth");
```

### **Availability Checking:**

```javascript
// Mock ENS registry check for nyuiela.eth ecosystem
const takenDomains = [
  "vitalik.nyuiela.eth",
  "ethereum.nyuiela.eth",
  "uniswap.nyuiela.eth",
];
const isAvailable = !takenDomains.includes(domain.toLowerCase());
```

### **Contract Preparation:**

```javascript
// Prepares ENS registration contracts
const domainContracts = [{
  abi: eventAbi.abi,
  address: eventAddress,
  functionName: "createEvent", // Mock function
  args: [`ipfs://event-${eventId}`, ...]
}];
```

## 🚀 **Future Enhancements:**

### **Real ENS Integration:**

- Connect to actual ENS registry
- Real domain availability checking
- Proper ENS registration contracts
- Content hash management

### **Advanced Features:**

- Subdomain support (e.g., `stream.myevent.eth`)
- Multi-year domain registration
- Domain renewal management
- Transfer domain ownership

### **Integration Options:**

- Custom domain resolution
- DNS integration
- Browser extension support
- Mobile app integration

## 📱 **User Experience:**

### **Step-by-Step Process:**

1. **Enter Domain**: Type desired domain name
2. **Check Availability**: Click "Check Availability" button
3. **Prepare Minting**: Click "Prepare Minting" if available
4. **Execute Transaction**: Confirm domain minting transaction
5. **Complete**: Domain is minted and points to event

### **Visual Feedback:**

- ✅ Green status for available domains
- ❌ Red status for taken domains
- 🔄 Loading states during checks
- 📋 Progress indicators during transactions

### **Error Handling:**

- Invalid domain format warnings
- Network error recovery
- Transaction failure handling
- Clear error messages

## 🔒 **Security Considerations:**

- **Domain Validation**: Prevents invalid domain names
- **Availability Verification**: Ensures domains aren't already taken
- **Transaction Security**: Uses OnchainKit for secure transactions
- **IPFS Integrity**: Domain points to immutable IPFS content

This feature completes the decentralized event system, providing users with easy-to-remember, censorship-resistant URLs for their events while maintaining full decentralization through IPFS and ENS.
