"use client";

import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { Transaction, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from "@coinbase/onchainkit/transaction";
import { eventAbi, eventAddress } from "@/lib/contract";
import type { Abi } from "viem";
// import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import QRCodeBottomSheet from "./QRCodeBottomSheet";
import { QrCode } from "lucide-react";

type Props = {
  eventId: number | string;
  defaultIpfsHash?: string;
};

export default function EventManagement({ eventId, defaultIpfsHash }: Props) {
  const { address } = useAccount();
  const chainId = useChainId();

  const [isBusy, setIsBusy] = useState(false);
  const [ipfsHash, setIpfsHash] = useState<string>(defaultIpfsHash || "");
  const [startISO, setStartISO] = useState<string>("");
  const [endISO, setEndISO] = useState<string>("");
  const [maxAttendees, setMaxAttendees] = useState<number>(0);
  const [registrationFeeWei, setRegistrationFeeWei] = useState<string>("0");
  const [attendee, setAttendee] = useState<string>("");
  const [confirmationCode, setConfirmationCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);

  const numericEventId = typeof eventId === "string" ? Number(eventId) || 1 : eventId || 1;
  const canTransact = Boolean(address && chainId && eventAddress);

  // Show warning if contract address is not configured
  if (!eventAddress) {
    return (
      <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <h2 className="text-xl font-semibold text-yellow-400 mb-2">Contract Not Configured</h2>
        <p className="text-yellow-300 text-sm">
          The event contract address is not configured. Please set NEXT_PUBLIC_EVENT_ADDRESS in your environment variables.
        </p>
      </div>
    );
  }


  const toUnix = (iso: string): bigint => {
    if (!iso) return BigInt(0);
    const date = new Date(iso);
    if (isNaN(date.getTime())) return BigInt(0);
    return BigInt(Math.floor(date.getTime() / 1000));
  };

  return (
    <div className="relative overflow-hidden text-[12px]">
      {/* Main container with events theme */}
      <div className="relative bg-[var(--events-card-bg)] rounded-3xl p-4 pb-4 shadow-2xl mx-4 mb-5" >
        {/* Header */}
        <div className="flex items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--events-foreground)]">
              Admin Dashboard
            </h2>
            <p className="text-[var(--events-foreground-muted)] text-sm">Manage your event lifecycle with blockchain precision</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-[var(--events-card-bg)] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab === "overview"
              ? "bg-[var(--events-accent)] text-white"
              : "text-[var(--events-foreground-muted)] text-xs hover:text-[var(--events-foreground)] hover:bg-[var(--events-accent)]/10"
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("update")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab === "update"
              ? "bg-[var(--events-accent)] text-white"
              : "text-[var(--events-foreground-muted)] text-nowrap text-xs hover:text-[var(--events-foreground)] hover:bg-[var(--events-accent)]/10"
              }`}
          >
            Update Event
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab === "attendance"
              ? "bg-[var(--events-accent)] text-white"
              : "text-[var(--events-foreground-muted)] text-xs hover:text-[var(--events-foreground)] hover:bg-[var(--events-accent)]/10"
              }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab === "analytics"
              ? "bg-[var(--events-accent)] text-white"
              : "text-[var(--events-foreground-muted)] text-xs hover:text-[var(--events-foreground)] hover:bg-[var(--events-accent)]/10"
              }`}
          >
            Analytics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div>
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {/* Publish Event Card */}
              <div className="group relative overflow-hidden rounded-2xl bg-[var(--events-card-bg)] p-2 px-4 hover:bg-[var(--events-accent)]/10 transition-all duration-300">
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="font-semibold text-[var(--events-foreground)]">Publish Event</h3>
                  </div>
                  <p className="text-[var(--events-foreground-muted)] text-sm mb-4">Deploy your event to the blockchain</p>
                  {canTransact ? (
                    <Transaction
                      chainId={chainId}
                      calls={[
                        {
                          abi: eventAbi.abi as Abi,
                          address: eventAddress as `0x${string}`,
                          functionName: "publishEvent",
                          args: [BigInt(numericEventId)],
                        },
                      ]}
                      onStatus={(s) => setIsBusy(s.statusName === "transactionPending" || s.statusName === "buildingTransaction")}
                    >
                      <button className="w-full px-4 py-2 bg-[var(--events-accent)] text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105">
                        {isBusy ? "Publishing..." : "Publish Event"}
                      </button>
                      <TransactionStatus>
                        <TransactionStatusLabel />
                        <TransactionStatusAction />
                      </TransactionStatus>
                    </Transaction>
                  ) : (
                    <appkit-connect-button label="Login" size="sm" />
                  )}
                </div>
              </div>

              {/* End Event Card */}
              <div className="group relative overflow-hidden rounded-2xl bg-[var(--events-card-bg)] p-2 px-4 hover:bg-[var(--events-accent)]/10 transition-all duration-300">
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="font-semibold text-[var(--events-foreground)]">End Event</h3>
                  </div>
                  <p className="text-[var(--events-foreground-muted)] text-sm mb-4">Conclude your event</p>
                  {canTransact ? (
                    <Transaction
                      chainId={chainId}
                      calls={[
                        {
                          abi: eventAbi.abi as Abi,
                          address: eventAddress as `0x${string}`,
                          functionName: "endEvent",
                          args: [BigInt(numericEventId)],
                        },
                      ]}
                      onStatus={(s) => setIsBusy(s.statusName === "transactionPending" || s.statusName === "buildingTransaction")}
                    >
                      <button className="w-full px-4 py-2 bg-none border-2 border-gray-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105">
                        {isBusy ? "Ending..." : "End Event"}
                      </button>
                      <TransactionStatus>
                        <TransactionStatusLabel />
                        <TransactionStatusAction />
                      </TransactionStatus>
                    </Transaction>
                  ) : (
                    <appkit-connect-button label="Login" size="sm" />
                  )}
                </div>
              </div>

              {/* Cancel Event Card */}
              <div className="group relative overflow-hidden rounded-2xl bg-[var(--events-card-bg)] p-2 px-4 hover:bg-[var(--events-accent)]/10 transition-all duration-300">
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="font-semibold text-[var(--events-foreground)]">Cancel Event</h3>
                  </div>
                  <p className="text-[var(--events-foreground-muted)] text-sm mb-4">Cancel your event</p>
                  {canTransact ? (
                    <Transaction
                      chainId={chainId}
                      calls={[
                        {
                          abi: eventAbi.abi as Abi,
                          address: eventAddress as `0x${string}`,
                          functionName: "cancelEvent",
                          args: [BigInt(numericEventId)],
                        },
                      ]}
                      onStatus={(s) => setIsBusy(s.statusName === "transactionPending" || s.statusName === "buildingTransaction")}
                    >
                      <button className="w-full px-4 py-2 bg-red-500 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105">
                        {isBusy ? "Cancelling..." : "Cancel Event"}
                      </button>
                      <TransactionStatus>
                        <TransactionStatusLabel />
                        <TransactionStatusAction />
                      </TransactionStatus>
                    </Transaction>
                  ) : (
                    <appkit-connect-button label="Login" size="sm" />
                  )}
                </div>
              </div>

              {/* Attendance Management Card */}
              <div className="group relative overflow-hidden rounded-2xl bg-[var(--events-card-bg)] p-2 px-4 hover:bg-[var(--events-accent)]/10 transition-all duration-300">
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="font-semibold text-[var(--events-foreground)]">Attendance</h3>
                  </div>
                  <p className="text-[var(--events-foreground-muted)] text-sm mb-4">Manage attendees</p>
                  <button
                    onClick={() => setActiveTab("attendance")}
                    className="w-full px-4 py-2 bg-none border-2 border-gray-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                  >
                    Manage
                  </button>
                </div>
              </div>

              {/* QR Code Generation Card */}
              <div className="group relative overflow-hidden rounded-2xl bg-[var(--events-card-bg)] p-2 px-4 hover:bg-[var(--events-accent)]/10 transition-all duration-300">
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <QrCode className="w-5 h-5 text-[var(--events-accent)]" />
                    <h3 className="font-semibold text-[var(--events-foreground)]">QR Code</h3>
                  </div>
                  <p className="text-[var(--events-foreground-muted)] text-sm mb-4">Generate verification QR</p>
                  <button
                    onClick={() => setIsQRCodeOpen(true)}
                    className="w-full px-4 py-2 bg-[var(--events-accent)] text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    Generate QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "update" && (
          <div>
            {/* Update Event Section */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--events-foreground)]">Update Event Details</h3>
                    <p className="text-[var(--events-foreground-muted)] text-sm">Modify your event configuration</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-[var(--events-foreground)] text-sm font-medium flex items-center gap-2">
                      IPFS Hash
                    </label>
                    <input
                      type="text"
                      placeholder="ipfs://..."
                      value={ipfsHash}
                      onChange={(e) => setIpfsHash(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--events-card-bg)] rounded-xl text-[var(--events-foreground)] placeholder-[var(--events-foreground-muted)] focus:bg-[var(--events-accent)]/10 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[var(--events-foreground)] text-sm font-medium flex items-center gap-2">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={startISO}
                      onChange={(e) => setStartISO(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--events-card-bg)] rounded-xl text-[var(--events-foreground)] placeholder-[var(--events-foreground-muted)] focus:bg-[var(--events-accent)]/10 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[var(--events-foreground)] text-sm font-medium flex items-center gap-2">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={endISO}
                      onChange={(e) => setEndISO(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--events-card-bg)] rounded-xl text-[var(--events-foreground)] placeholder-[var(--events-foreground-muted)] focus:bg-[var(--events-accent)]/10 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[var(--events-foreground)] text-sm font-medium flex items-center gap-2">
                      Max Attendees
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      value={maxAttendees}
                      onChange={(e) => setMaxAttendees(Number(e.target.value || 0))}
                      className="w-full px-4 py-3 bg-[var(--events-card-bg)] rounded-xl text-[var(--events-foreground)] placeholder-[var(--events-foreground-muted)] focus:bg-[var(--events-accent)]/10 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[var(--events-foreground)] text-sm font-medium flex items-center gap-2">
                      Registration Fee (wei)
                    </label>
                    <input
                      type="text"
                      placeholder="0"
                      value={registrationFeeWei}
                      onChange={(e) => setRegistrationFeeWei(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--events-card-bg)] rounded-xl text-[var(--events-foreground)] placeholder-[var(--events-foreground-muted)] focus:bg-[var(--events-accent)]/10 transition-all duration-200"
                    />
                  </div>
                </div>

                {canTransact ? (
                  <Transaction
                    chainId={chainId}
                    calls={[
                      {
                        abi: eventAbi.abi as Abi,
                        address: eventAddress as `0x${string}`,
                        functionName: "updateEvent",
                        args: [
                          BigInt(numericEventId),
                          ipfsHash,
                          toUnix(startISO),
                          toUnix(endISO),
                          BigInt(maxAttendees || 0),
                          BigInt(registrationFeeWei || "0"),
                        ],
                      },
                    ]}
                    onStatus={(s) => setIsBusy(s.statusName === "transactionPending" || s.statusName === "buildingTransaction")}
                  >
                    <button className="px-8 py-3 bg-[var(--events-accent)] text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2">
                      {isBusy ? "Updating..." : "Update Event"}
                    </button>
                    <TransactionStatus>
                      <TransactionStatusLabel />
                      <TransactionStatusAction />
                    </TransactionStatus>
                  </Transaction>
                ) : (
                  <appkit-connect-button label="Login" size="sm" />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div>
            {/* Attendance Management Section */}
            <div className="mt-8 relative overflow-hidden rounded-2xl">
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--events-foreground)]">Attendance Management</h3>
                    <p className="text-[var(--events-foreground-muted)] text-sm">Confirm and manage event attendees</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-[var(--events-foreground)] text-sm font-medium flex items-center gap-2">
                      Attendee Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={attendee}
                      onChange={(e) => setAttendee(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-purple-400/50 focus:bg-white/10 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[var(--events-foreground)] text-sm font-medium flex items-center gap-2">
                      Confirmation Code
                    </label>
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={confirmationCode}
                      onChange={(e) => setConfirmationCode(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-purple-400/50 focus:bg-white/10 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  {canTransact ? (
                    <Transaction
                      chainId={chainId}
                      calls={[
                        {
                          abi: eventAbi.abi as Abi,
                          address: eventAddress as `0x${string}`,
                          functionName: "confirmAttendee",
                          args: [BigInt(numericEventId), attendee as `0x${string}`, confirmationCode],
                        },
                      ]}
                      onStatus={(s) => setIsBusy(s.statusName === "transactionPending" || s.statusName === "buildingTransaction")}
                    >
                      <button className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2">
                        {isBusy ? "Confirming..." : "Confirm Attendance"}
                      </button>
                      <TransactionStatus>
                        <TransactionStatusLabel />
                        <TransactionStatusAction />
                      </TransactionStatus>
                    </Transaction>
                  ) : (
                    <appkit-connect-button label="Login" size="sm" />
                  )}

                  {canTransact ? (
                    <Transaction
                      chainId={chainId}
                      calls={[
                        {
                          abi: eventAbi.abi as Abi,
                          address: eventAddress as `0x${string}`,
                          functionName: "markAttended",
                          args: [BigInt(numericEventId), attendee as `0x${string}`],
                        },
                      ]}
                      onStatus={(s) => setIsBusy(s.statusName === "transactionPending" || s.statusName === "buildingTransaction")}
                    >
                      <button className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2">
                        {isBusy ? "Marking..." : "Mark Attended"}
                      </button>
                      <TransactionStatus>
                        <TransactionStatusLabel />
                        <TransactionStatusAction />
                      </TransactionStatus>
                    </Transaction>
                  ) : null}

                  <button
                    onClick={() => setIsQRCodeOpen(true)}
                    className="px-6 py-3 bg-[var(--events-accent)] text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    Generate QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            {/* Analytics Section */}
            <div className="relative overflow-hidden">
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--events-foreground)]">Event Analytics</h3>
                    <p className="text-[var(--events-foreground-muted)] text-sm">View event performance and statistics</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Analytics Cards */}
                  <div className="bg-[var(--events-card-bg)] rounded-xl p-3 px-4">
                    <h4 className="text-lg font-semibold text-[var(--events-foreground)] mb-2">Total Registrations</h4>
                    <p className="text-3xl font-bold text-[var(--events-accent)]">0</p>
                    <p className="text-[var(--events-foreground-muted)] text-sm">Event registrations</p>
                  </div>

                  <div className="bg-[var(--events-card-bg)] rounded-xl p-3 px-4">
                    <h4 className="text-lg font-semibold text-[var(--events-foreground)] mb-2">Confirmed Attendance</h4>
                    <p className="text-3xl font-bold text-emerald-500">0</p>
                    <p className="text-[var(--events-foreground-muted)] text-sm">Confirmed attendees</p>
                  </div>

                  <div className="bg-[var(--events-card-bg)] rounded-xl p-3 px-4">
                    <h4 className="text-lg font-semibold text-[var(--events-foreground)] mb-2">Event Status</h4>
                    <p className="text-3xl font-bold text-orange-500">Draft</p>
                    <p className="text-[var(--events-foreground-muted)] text-sm">Current status</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-[var(--events-foreground)] mb-4">Event Timeline</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-[var(--events-card-bg)] rounded-xl">
                      <div className="w-3 h-3 bg-[var(--events-accent)] rounded-full"></div>
                      <div>
                        <p className="text-[var(--events-foreground)] font-medium">Event Created</p>
                        <p className="text-[var(--events-foreground-muted)] text-sm">Event was created and configured</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-[var(--events-card-bg)] rounded-xl opacity-50">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <div>
                        <p className="text-[var(--events-foreground-muted)] font-medium">Event Published</p>
                        <p className="text-[var(--events-foreground-muted)] text-sm">Event will be published to blockchain</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-[var(--events-card-bg)] rounded-xl opacity-50">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <div>
                        <p className="text-[var(--events-foreground-muted)] font-medium">Event Ended</p>
                        <p className="text-[var(--events-foreground-muted)] text-sm">Event will be concluded</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Bottom Sheet */}
      {/* <QRCodeBottomSheet
        isOpen={isQRCodeOpen}
        onClose={() => setIsQRCodeOpen(false)}
        slug={slug}
        eventTitle="Event Verification"
      /> */}
    </div>
  );
}


