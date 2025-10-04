import reventTradingJson from './reventTrading.json';

const reventTradingAddress = process.env.NEXT_PUBLIC_REVENT_TRADING_ADDRESS;
const eventId = process.env.NEXT_PUBLIC_EVENT_ID || 1;
const reventTradingAbi = reventTradingJson.abi;
export { reventTradingAbi, reventTradingAddress, eventId };