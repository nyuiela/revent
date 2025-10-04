import { useReadContracts } from 'wagmi';
import { reventTradingAbi, reventTradingAddress, eventId } from '@/contract/abi/contract';

export interface EventData {
  eventId: number;
  eventExists: boolean;
  eventStatus: number;
  eventCreator: string;
  domaTokenId: bigint;
  domaStatus: number;
  revenueAccrued: bigint;
  revenueClaimed: bigint;
  investorShareBalance: bigint;
  totalInvested: bigint;
  eventInvestors: string[];
  isInvestor: boolean;
}

export function useEventData(userAddress?: string) {
  const contracts = [
    // Check if event exists
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'eventExistsCheck',
      args: [eventId],
    },
    // Get event status
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'getEventStatus',
      args: [eventId],
    },
    // Get event creator
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'getEventCreator',
      args: [eventId],
    },
    // Get DOMA token ID
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'getDomaTokenId',
      args: [eventId],
    },
    // Get DOMA status
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'getDomaStatus',
      args: [eventId],
    },
    // Get revenue accrued
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'getRevenueAccrued',
      args: [eventId],
    },
    // Get total invested
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'getTotalInvested',
      args: [eventId],
    },
    // Get event investors
    {
      address: reventTradingAddress as `0x${string}`,
      abi: reventTradingAbi as any,
      functionName: 'getEventInvestors',
      args: [eventId],
    },
  ];

  // Add user-specific contracts if address is provided
  if (userAddress) {
    contracts.push(
      // Get revenue claimed by user
      {
        address: reventTradingAddress as `0x${string}`,
        abi: reventTradingAbi as any,
        functionName: 'getRevenueClaimed',
        args: [eventId, userAddress],
      },
      // Get investor share balance
      {
        address: reventTradingAddress as `0x${string}`,
        abi: reventTradingAbi as any,
        functionName: 'getInvestorShareBalance',
        args: [eventId, userAddress],
      },
      // Check if user is investor
      {
        address: reventTradingAddress as `0x${string}`,
        abi: reventTradingAbi as any,
        functionName: 'isInvestor',
        args: [eventId, userAddress],
      }
    );
  }

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      refetchInterval: 15000, // Refetch every 15 seconds
    }
  });

  // Process the data into a structured format
  const processedData: EventData | null = data ? {
    eventId: Number(eventId),
    eventExists: data[0]?.result as boolean || false,
    eventStatus: data[1]?.result as number || 0,
    eventCreator: data[2]?.result as string || '',
    domaTokenId: data[3]?.result as bigint || BigInt(0),
    domaStatus: data[4]?.result as number || 0,
    revenueAccrued: data[5]?.result as bigint || BigInt(0),
    totalInvested: data[6]?.result as bigint || BigInt(0),
    eventInvestors: data[7]?.result as string[] || [],
    revenueClaimed: userAddress ? (data[8]?.result as bigint || BigInt(0)) : BigInt(0),
    investorShareBalance: userAddress ? (data[9]?.result as bigint || BigInt(0)) : BigInt(0),
    isInvestor: userAddress ? (data[10]?.result as boolean || false) : false,
  } : null;

  return {
    data: processedData,
    isLoading,
    error,
    refetch,
    rawData: data,
  };
}
