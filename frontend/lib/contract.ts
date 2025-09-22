import eventAbi from "./abi/StreamEvents.json";
import ticketAbi from "./abi/TicketsV1.json";

const eventAddress = process.env.NEXT_PUBLIC_EVENT_ADDRESS;
const ticketAddress = process.env.NEXT_PUBLIC_TICKET_ADDRESS;

const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
export { eventAbi, eventAddress, ticketAbi, ticketAddress, chainId };
