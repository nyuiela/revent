import { useReadContracts } from 'wagmi';
import { reventTradingAbi, reventTradingAddress, eventId } from '@/contract/abi/contract';

export interface TradingData {
  // Price Manager Data
  basePrice: bigint;
  currentMultiplier: bigint;
  currentPrice: bigint;
  totalValue: bigint;
  shareSupply: bigint;

  // Volume Manager Data
  totalVolume: bigint;
  buyVolume: bigint;
  sellVolume: bigint;
  momentumFactor: bigint;
  buyRatio: bigint;
  sellRatio: bigint;

  // Order Manager Data
  activeBuyOrders: bigint[];
  activeSellOrders: bigint[];
  userOrders: bigint[];
  eventOrders: bigint[];
}

export function useTradingData(userAddress?: string) {
  const contracts = [
    // Get pricing info
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'getPricingInfo',
      args: [eventId],
    },
    // Get trading info
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'getTradingInfo',
      args: [eventId],
    },
    // Get active buy orders
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'getActiveBuyOrders',
      args: [eventId],
    },
    // Get active sell orders
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'getActiveSellOrders',
      args: [eventId],
    },
    // Get event orders
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'getEventOrders',
      args: [eventId],
    },
  ];

  // Add user-specific contracts if address is provided
  if (userAddress) {
    contracts.push(
      // Get user orders
      {
        address: reventTradingAddress as `0x${string}`,
        abi: reventTradingAbi as any,
        functionName: 'getUserOrders',
        args: [userAddress],
      }
    );
  }

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  });

  // Process the data into a structured format
  const processedData: TradingData | null = data ? {
    // Price Manager Data
    basePrice: data[0]?.result?.[0] as bigint || BigInt(0),
    currentMultiplier: data[0]?.result?.[1] as bigint || BigInt(0),
    currentPrice: data[0]?.result?.[2] as bigint || BigInt(0),
    totalValue: data[0]?.result?.[3] as bigint || BigInt(0),
    shareSupply: data[0]?.result?.[4] as bigint || BigInt(0),

    // Volume Manager Data
    totalVolume: data[1]?.result?.[0] as bigint || BigInt(0),
    buyVolume: data[1]?.result?.[1] as bigint || BigInt(0),
    sellVolume: data[1]?.result?.[2] as bigint || BigInt(0),
    momentumFactor: data[1]?.result?.[3] as bigint || BigInt(0),
    buyRatio: data[1]?.result?.[4] as bigint || BigInt(0),
    sellRatio: data[1]?.result?.[5] as bigint || BigInt(0),

    // Order Manager Data
    activeBuyOrders: data[2]?.result as bigint[] || [],
    activeSellOrders: data[3]?.result as bigint[] || [],
    eventOrders: data[4]?.result as bigint[] || [],
    userOrders: userAddress ? (data[5]?.result as bigint[] || []) : [],
  } : null;

  return {
    data: processedData,
    isLoading,
    error,
    refetch,
    rawData: data,
  };
}


