import { useReadContract, useReadContracts } from "wagmi";
import { ticketAbi, ticketAddress } from "@/lib/contract";
import config from "@/lib/wagmi";
import { useMemo } from "react";
import type { Abi } from "viem";

export interface TicketData {
  ticketId: string;
  eventId: string;
  name: string;
  ticketType: string;
  price: string;
  currency: string;
  totalQuantity: string;
  perks: string[];
  isActive: boolean;
}

// Type for the contract result
interface TicketContractResult {
  ticketId: bigint;
  eventId: bigint;
  name: string;
  ticketType: string;
  price: bigint;
  currency: string;
  totalQuantity: bigint;
  perks: string[];
  isActive: boolean;
}

export function useEventTickets(eventId: string | undefined) {
  // Get ticket IDs for the event
  const { data: ticketIds, isLoading: isLoadingTicketIds, error: ticketIdsError } = useReadContract({
    address: ticketAddress as `0x${string}`,
    abi: ticketAbi.abi,
    functionName: "getEventTickets",
    args: eventId ? [BigInt(eventId)] : undefined,
    config,
    query: {
      enabled: Boolean(eventId),
    },
  });

  // Create contracts array for batch fetching ticket data
  const ticketContracts = useMemo(() => {
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) return [];

    return ticketIds.map((ticketId: bigint) => ({
      address: ticketAddress as `0x${string}`,
      abi: ticketAbi.abi as Abi,
      functionName: "getTicket" as const,
      args: [ticketId],
    }));
  }, [ticketIds]);

  // Fetch all ticket data using useReadContracts for batch fetching
  const { data: ticketsData, isLoading: isLoadingTickets, error: ticketsError } = useReadContracts({
    contracts: ticketContracts,
    config,
    query: {
      enabled: ticketContracts.length > 0,
    },
  });

  // Transform the data into our interface
  const tickets: TicketData[] = useMemo(() => {
    if (!ticketsData || ticketsData.length === 0) return [];

    return ticketsData
      .filter((result) => result.status === 'success' && result.result)
      .map((result) => {
        const ticketData = result.result as TicketContractResult;
        return {
          ticketId: ticketData.ticketId.toString(),
          eventId: ticketData.eventId.toString(),
          name: ticketData.name,
          ticketType: ticketData.ticketType,
          price: ticketData.price.toString(),
          currency: ticketData.currency,
          totalQuantity: ticketData.totalQuantity.toString(),
          perks: ticketData.perks || [],
          isActive: true, // You might want to check this separately using isTicketActive
        };
      });
  }, [ticketsData]);

  return {
    tickets,
    isLoading: isLoadingTicketIds || isLoadingTickets,
    error: ticketIdsError || ticketsError,
    hasTickets: tickets.length > 0,
  };
}

// Hook to get a specific ticket by ID
export function useTicket(ticketId: string | undefined) {
  const { data: ticketData, isLoading, error } = useReadContract({
    address: ticketAddress as `0x${string}`,
    abi: ticketAbi.abi,
    functionName: "getTicket",
    args: ticketId ? [BigInt(ticketId)] : undefined,
    config,
    query: {
      enabled: Boolean(ticketId),
    },
  });

  const ticket: TicketData | null = useMemo(() => {
    if (!ticketData) return null;

    const data = ticketData as TicketContractResult;
    return {
      ticketId: data.ticketId.toString(),
      eventId: data.eventId.toString(),
      name: data.name,
      ticketType: data.ticketType,
      price: data.price.toString(),
      currency: data.currency,
      totalQuantity: data.totalQuantity.toString(),
      perks: data.perks || [],
      isActive: true, // You might want to check this separately
    };
  }, [ticketData]);

  return {
    ticket,
    isLoading,
    error,
  };
}
