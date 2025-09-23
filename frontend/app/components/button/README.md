# Contract Button Components

This directory contains multiple contract button components for different use cases:

## ContractButton

Single contract call button - the original component.

```tsx
import ContractButton from "@/app/components/button/ContractButton";

<ContractButton
  address={eventAddress}
  abi={eventAbi.abi}
  functionName="publishEvent"
  args={[BigInt(eventId)]}
  chainId={chainId}
  idleLabel="Publish Event"
  onWriteSuccess={() => console.log("Success!")}
/>;
```

## ContractsButton

Multiple contract calls in a single transaction (simplified approach).

```tsx
import ContractsButton from "@/app/components/button/ContractsButton";

<ContractsButton
  contracts={[
    {
      address: eventAddress,
      abi: eventAbi.abi,
      functionName: "publishEvent",
      args: [BigInt(eventId)],
    },
    {
      address: eventAddress,
      abi: eventAbi.abi,
      functionName: "createTickets",
      args: [BigInt(eventId), BigInt(100), BigInt(0)],
    },
  ]}
  chainId={chainId}
  idleLabel="Publish & Create Tickets"
  onWriteSuccess={() => console.log("All calls completed!")}
/>;
```

## MultiContractButton

Advanced multi-contract button with different execution strategies.

```tsx
import MultiContractButton from "@/app/components/button/MultiContractButton";

// Sequential execution (one after another)
<MultiContractButton
  contracts={[
    {
      address: eventAddress,
      abi: eventAbi.abi,
      functionName: "publishEvent",
      args: [BigInt(eventId)]
    },
    {
      address: eventAddress,
      abi: eventAbi.abi,
      functionName: "createTickets",
      args: [BigInt(eventId), BigInt(100), BigInt(0)]
    }
  ]}
  chainId={chainId}
  sequential={true}
  idleLabel="Publish & Create Tickets (Sequential)"
  onWriteSuccess={() => console.log("Sequential execution completed!")}
/>

// Multicall approach (batched in single transaction)
<MultiContractButton
  contracts={[
    {
      address: eventAddress,
      abi: eventAbi.abi,
      functionName: "publishEvent",
      args: [BigInt(eventId)]
    },
    {
      address: eventAddress,
      abi: eventAbi.abi,
      functionName: "createTickets",
      args: [BigInt(eventId), BigInt(100), BigInt(0)]
    }
  ]}
  chainId={chainId}
  useMulticall={true}
  idleLabel="Publish & Create Tickets (Multicall)"
  onWriteSuccess={() => console.log("Multicall completed!")}
/>
```

## Key Features

### All Components Support:

- Loading states (idle, confirming, pending, success, error, canceled)
- Toast notifications
- Error handling with friendly messages
- Custom styling
- Progress tracking for multiple calls
- Callback functions for different states

### MultiContractButton Specific:

- **Sequential execution**: Execute calls one after another
- **Multicall support**: Batch multiple calls into a single transaction
- **Progress tracking**: Shows current call progress
- **Flexible configuration**: Choose execution strategy

### Usage Examples:

1. **Simple single call**: Use `ContractButton`
2. **Multiple calls in sequence**: Use `MultiContractButton` with `sequential={true}`
3. **Batched calls**: Use `MultiContractButton` with `useMulticall={true}`
4. **Complex workflows**: Combine multiple buttons for different operations

### Best Practices:

- Use `ContractButton` for simple single operations
- Use `MultiContractButton` with `sequential={true}` for operations that must happen in order
- Use `MultiContractButton` with `useMulticall={true}` for operations that can be batched
- Always handle errors and provide user feedback
- Use appropriate loading states and progress indicators
