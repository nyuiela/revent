"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { ChevronDown, Search } from "lucide-react";

type TransactionEvent = {
  id: string;
  eventId: string;
  attendee?: string;
  attendeeName?: string;
  txHash: string;
  blockNumber: string;
  blockTimestamp: string;
  eventType: 'EventCreated' | 'AttendeeRegistered' | 'AttendeeConfirmed' | 'AttendeeAttended' | 'TicketCreated' | 'TicketPurchased' | 'EventUpdated' | 'EventStatusChanged';
  metadata?: string;
  amount?: string;
  ticketType?: string;
  ticketId?: string;
};

type Event = {
  id: string;
  eventId: string;
  title: string;
  avatarUrl: string;
  creator: string;
  transactionCount: number;
};

type TxHistoryProps = {
  events?: Event[];
};

type TxRow = {
  hash: string;
  action: string;
  kind: string;
  amount?: string;
  date: string;
  link?: string;
};

function KindBadge({ kind }: { kind: string }) {
  const map: Record<string, { label: string; className: string }> = {
    EventCreated: { label: "Create", className: "bg-indigo-500/10 text-indigo-600" },
    TicketCreated: { label: "Tickets", className: "bg-amber-500/10 text-amber-600" },
    EventUpdated: { label: "Update", className: "bg-emerald-500/10 text-emerald-600" },
    EventStatusChanged: { label: "Status", className: "bg-rose-500/10 text-rose-600" },
    TicketPurchased: { label: "Purchase", className: "bg-fuchsia-500/10 text-fuchsia-600" },
    AttendeeRegistered: { label: "Register", className: "bg-sky-500/10 text-sky-600" },
    AttendeeConfirmed: { label: "Confirm", className: "bg-purple-500/10 text-purple-600" },
    AttendeeAttended: { label: "Attend", className: "bg-green-500/10 text-green-600" },
  };
  const s = map[kind] || { label: kind, className: "bg-gray-500/10 text-gray-600" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-border ${s.className}`}>{s.label}</span>
  );
}

export default function TxHistory({ events: propEvents }: TxHistoryProps) {
  const { address } = useAccount();
  const [events, setEvents] = useState<Event[]>(propEvents || []);
  const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update events when props change
  useEffect(() => {
    if (propEvents) {
      setEvents(propEvents);
    }
  }, [propEvents]);

  useEffect(() => {
    const fetchTransactionData = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/events/transactions/${address}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch transaction data');
        }

        // Only set events if not provided via props
        if (!propEvents) {
          setEvents(data.events || []);
        }
        setTransactions(data.transactions || []);
        setFilteredTransactions(data.transactions || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching transaction data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch transaction data');
        if (!propEvents) {
          setEvents([]);
        }
        setTransactions([]);
        setFilteredTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionData();
  }, [address, propEvents]);

  // Handle event filtering
  useEffect(() => {
    if (selectedEvent) {
      setFilteredTransactions(transactions.filter(tx => tx.eventId === selectedEvent.eventId));
    } else {
      setFilteredTransactions(transactions);
    }
  }, [selectedEvent, transactions]);

  // Handle event search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEvents(events);
      return;
    }

    const filtered = events.filter((event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const getActionText = (tx: TransactionEvent) => {
    switch (tx.eventType) {
      case 'EventCreated':
        return 'Event Created';
      case 'AttendeeRegistered':
        return `Registered: ${tx.attendeeName || 'Anonymous'}`;
      case 'AttendeeConfirmed':
        return `Confirmed: ${tx.attendeeName || 'Anonymous'}`;
      case 'AttendeeAttended':
        return `Attended: ${tx.attendee?.slice(0, 6)}...${tx.attendee?.slice(-4)}`;
      case 'TicketCreated':
        return `Ticket Created: ${tx.ticketId}`;
      case 'TicketPurchased':
        return `Ticket Purchased: ${tx.ticketId}`;
      case 'EventUpdated':
        return 'Event Updated';
      case 'EventStatusChanged':
        return 'Event Status Changed';
      default:
        return tx.eventType;
    }
  };

  const getAmount = (tx: TransactionEvent) => {
    if (tx.amount) {
      const amount = parseInt(tx.amount) / 1e18; // Convert from wei
      return `${amount.toFixed(4)} ETH`;
    }
    return '0.00 ETH';
  };

  if (!address) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Please connect your wallet to view transaction history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Loading transaction history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No events found. Create some events to see transaction history.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Event Filter Dropdown */}
      <div className="border-b border-border px-4 py-3">
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg border border-border bg-muted hover:bg-muted-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              {selectedEvent ? (
                <>
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
                    <Image 
                      src={selectedEvent.avatarUrl || "/icon.png"} 
                      alt={selectedEvent.title} 
                      width={32} 
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">{selectedEvent.title}</div>
                    <div className="text-xs text-muted-foreground">Total tx: {selectedEvent.transactionCount}</div>
                  </div>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">All Events</span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background rounded-lg shadow-lg border border-border max-h-64 overflow-y-auto z-50">
              {/* Search Input */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* All Events Option */}
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setIsDropdownOpen(false);
                  setSearchQuery("");
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
              >
                <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                  {/* <span className="text-xs font-semibold">ALL</span> */}
                  <Image 
                    src={"/icon.png"} 
                    alt={"Event icon"} 
                    width={32} 
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold text-sm">All Events</div>
                  <div className="text-xs text-muted-foreground">Total tx: {transactions.length}</div>
                </div>
              </button>

              {/* Event List */}
              {filteredEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelectedEvent(event);
                    setIsDropdownOpen(false);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                >
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
                    <Image 
                      src={event.avatarUrl || "/icon.png"} 
                      alt={event.title} 
                      width={32} 
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{event.title}</div>
                    <div className="text-xs text-muted-foreground">Total tx: {event.transactionCount}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="grid grid-cols-[110px_1fr_120px] border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
        <div>Tx</div>
        <div>Details</div>
        <div className="text-right">Date</div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {selectedEvent ? 'No transactions found for this event' : 'No transactions found'}
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx, idx) => (
            <div
              key={tx.id}
              className="grid grid-cols-[110px_1fr_120px] items-center px-6 py-4 odd:bg-background"
            >
              {/* TxType + Tx */}
              <div className="flex items-center gap-3 text-sm flex-col">
                <KindBadge kind={tx.eventType} />
                <button 
                  className="text-xs underline" 
                  onClick={() => window.open(`https://basescan.org/tx/${tx.txHash}`, "_blank")}
                >
                  {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                </button>
              </div>
              {/* Details */}
              <div className="text-sm">
                <div className="font-semibold">{getActionText(tx)}</div>
                <div className="text-xs text-muted-foreground">{getAmount(tx)} gas/fee</div>
              </div>
              {/* Date */}
              <div className="text-right text-sm">{formatDate(tx.blockTimestamp)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


