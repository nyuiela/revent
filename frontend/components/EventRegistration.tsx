import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from '@coinbase/onchainkit/transaction';
import { eventAbi, eventAddress, ticketAbi, ticketAddress } from '@/lib/contract';
import { useEventTickets } from '@/hooks/useEventTickets';
import type { Abi } from 'viem';

interface EventRegistrationProps {
  eventId: string;
  isRegistered?: boolean;
  onRegistrationSuccess?: () => void;
}

export default function EventRegistration({
  eventId,
  isRegistered = false,
  onRegistrationSuccess
}: EventRegistrationProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { tickets, isLoading: ticketsLoading, hasTickets } = useEventTickets(eventId);

  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const canTransact = Boolean(address && chainId && eventAddress);
  const canPurchaseTickets = Boolean(address && chainId && ticketAddress);

  // Convert tickets to display format
  const ticketTypes = hasTickets ? tickets.map(ticket => ({
    type: ticket.name,
    price: parseFloat(ticket.price) / 1e18, // Convert from wei to ETH
    currency: ticket.currency,
    quantity: parseInt(ticket.totalQuantity),
    perks: ticket.perks || []
  })) : [];

  const selectedTicket = ticketTypes[selectedTicketIndex];

  if (isRegistered) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-800 font-medium">You are registered for this event</span>
        </div>
      </div>
    );
  }

  if (ticketsLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {hasTickets ? 'Purchase Tickets' : 'Register for Event'}
      </h3>

      {hasTickets ? (
        <div className="space-y-4">
          {/* Ticket Selection */}
          {ticketTypes.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Ticket Type:</label>
              <div className="grid gap-2">
                {ticketTypes.map((ticket, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedTicketIndex(index)}
                    className={`p-3 text-left border rounded-lg transition-colors ${selectedTicketIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{ticket.type}</div>
                        {ticket.perks.length > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            {ticket.perks.join(' • ')}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {ticket.currency === 'USD' ? '$' : ''}{ticket.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {ticket.quantity} available
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selection */}
          {selectedTicket && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center border rounded-lg">
                <button
                  type="button"
                  onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                  className="px-3 py-1 hover:bg-gray-100"
                >
                  −
                </button>
                <div className="px-4 py-1 min-w-[3rem] text-center">{ticketQuantity}</div>
                <button
                  type="button"
                  onClick={() => setTicketQuantity(Math.min(selectedTicket.quantity, ticketQuantity + 1))}
                  className="px-3 py-1 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Purchase Button */}
          {selectedTicket && canPurchaseTickets && (
            <div className="pt-2">
              <Transaction
                chainId={chainId}
                calls={[
                  {
                    abi: ticketAbi.abi as Abi,
                    address: ticketAddress as `0x${string}`,
                    functionName: 'purchaseTicket',
                    args: [
                      BigInt(tickets[selectedTicketIndex].ticketId),
                      BigInt(ticketQuantity)
                    ],
                    value: BigInt(Math.floor(selectedTicket.price * ticketQuantity * 1e18)), // Convert to wei
                  },
                ]}
                onStatus={(status) => {
                  setIsPurchasing(status.statusName === 'transactionPending' || status.statusName === 'buildingTransaction');
                  if (status.statusName === 'success') {
                    onRegistrationSuccess?.();
                  }
                }}
              >
                <TransactionButton
                  text={isPurchasing ? 'Purchasing...' : `Purchase ${ticketQuantity} Ticket${ticketQuantity > 1 ? 's' : ''}`}
                  className="w-full"
                />
                <TransactionStatus>
                  <TransactionStatusLabel />
                  <TransactionStatusAction />
                </TransactionStatus>
              </Transaction>
            </div>
          )}
        </div>
      ) : (
        /* Regular Registration */
        <div>
          {canTransact ? (
            <Transaction
              chainId={chainId}
              calls={[
                {
                  abi: eventAbi.abi as Abi,
                  address: eventAddress as `0x${string}`,
                  functionName: 'registerForEvent',
                  args: [BigInt(eventId)],
                },
              ]}
              onStatus={(status) => {
                setIsRegistering(status.statusName === 'transactionPending' || status.statusName === 'buildingTransaction');
                if (status.statusName === 'success') {
                  onRegistrationSuccess?.();
                }
              }}
            >
              <TransactionButton
                text={isRegistering ? 'Registering...' : 'Register for Event'}
                className="w-full"
              />
              <TransactionStatus>
                <TransactionStatusLabel />
                <TransactionStatusAction />
              </TransactionStatus>
            </Transaction>
          ) : (
            <div className="p-4 text-center text-gray-600">
              Please connect your wallet to register
            </div>
          )}
        </div>
      )}
    </div>
  );
}
