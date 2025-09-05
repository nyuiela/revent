"use client";

import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from "@coinbase/onchainkit/transaction";
import { Button, Icon } from "./DemoComponents";
import { eventAbi, eventAddress } from "@/lib/contract";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";

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

  const numericEventId = typeof eventId === "string" ? Number(eventId) : eventId;
  const canTransact = Boolean(address && chainId && eventAddress);

  const toUnix = (iso: string): bigint => BigInt(Math.floor(new Date(iso).getTime() / 1000));

  return (
    <div className="space-y-6 border border-[var(--app-card-border)] rounded-xl p-6 bg-transparent">
      <h2 className="text-xl font-semibold">Event Management</h2>

      {/* Publish Event */}
      <div className="space-y-3">
        <h3 className="font-medium">1. Publish Event</h3>
        {canTransact ? (
          <Transaction
            chainId={chainId}
            contracts={async () => [
              {
                abi: eventAbi.abi,
                address: eventAddress as `0x${string}`,
                functionName: "publishEvent",
                args: [BigInt(numericEventId)],
              },
            ]}
            onStatus={(s) => setIsBusy(s.statusName === "transactionPending" || s.statusName === "buildingTransaction")}
          >
            <TransactionButton text={isBusy ? "Publishing..." : "Publish Event"} />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>
        ) : (
          <ConnectWallet />
        )}
      </div>

      {/* Update Event */}
      <div className="space-y-3">
        <h3 className="font-medium">2. Update Event</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="ipfs://..."
            value={ipfsHash}
            onChange={(e) => setIpfsHash(e.target.value)}
            className="px-3 py-2 bg-transparent border border-[var(--app-card-border)] rounded-lg"
          />
          <input
            type="datetime-local"
            placeholder="Start"
            value={startISO}
            onChange={(e) => setStartISO(e.target.value)}
            className="px-3 py-2 bg-transparent border border-[var(--app-card-border)] rounded-lg"
          />
          <input
            type="datetime-local"
            placeholder="End"
            value={endISO}
            onChange={(e) => setEndISO(e.target.value)}
            className="px-3 py-2 bg-transparent border border-[var(--app-card-border)] rounded-lg"
          />
          <input
            type="number"
            placeholder="Max Attendees"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(Number(e.target.value || 0))}
            className="px-3 py-2 bg-transparent border border-[var(--app-card-border)] rounded-lg"
          />
          <input
            type="text"
            placeholder="Registration Fee (wei)"
            value={registrationFeeWei}
            onChange={(e) => setRegistrationFeeWei(e.target.value)}
            className="px-3 py-2 bg-transparent border border-[var(--app-card-border)] rounded-lg"
          />
        </div>

        {canTransact ? (
          <Transaction
            chainId={chainId}
            contracts={async () => {
              if (!ipfsHash || !startISO || !endISO) throw new Error("Missing fields");
              const start = toUnix(startISO);
              const end = toUnix(endISO);
              return [
                {
                  abi: eventAbi.abi,
                  address: eventAddress as `0x${string}`,
                  functionName: "updateEvent",
                  args: [
                    BigInt(numericEventId),
                    ipfsHash,
                    start,
                    end,
                    BigInt(maxAttendees || 0),
                    BigInt(registrationFeeWei || "0"),
                  ],
                },
              ];
            }}
            onStatus={(s) => setIsBusy(s.statusName === "transactionPending" || s.statusName === "buildingTransaction")}
          >
            <TransactionButton text={isBusy ? "Updating..." : "Update Event"} />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>
        ) : (
          <ConnectWallet />
        )}
      </div>

      {/* End Event */}
      <div className="space-y-3">
        <h3 className="font-medium">3. End Event</h3>
        {canTransact ? (
          <Transaction
            chainId={chainId}
            contracts={async () => [
              {
                abi: eventAbi.abi,
                address: eventAddress as `0x${string}`,
                functionName: "endEvent",
                args: [BigInt(numericEventId)],
              },
            ]}
            onStatus={(s) => setIsBusy(s.statusName === "transactionPending" || s.statusName === "buildingTransaction")}
          >
            <TransactionButton text={isBusy ? "Ending..." : "End Event"} />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>
        ) : (
          <ConnectWallet />
        )}
      </div>

      {/* Cancel Event */}
      <div className="space-y-3">
        <h3 className="font-medium">4. Cancel Event</h3>
        {canTransact ? (
          <Transaction
            chainId={chainId}
            contracts={async () => [
              {
                abi: eventAbi.abi,
                address: eventAddress as `0x${string}`,
                functionName: "cancelEvent",
                args: [BigInt(numericEventId)],
              },
            ]}
            onStatus={(s) => setIsBusy(s.statusName === "transactionPending" || s.statusName === "buildingTransaction")}
          >
            <TransactionButton text={isBusy ? "Cancelling..." : "Cancel Event"} />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>
        ) : (
          <ConnectWallet />
        )}
      </div>

      {/* Confirm Attendance & Mark Attended */}
      <div className="space-y-3">
        <h3 className="font-medium">5. Confirm Attendance & Mark Attended</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Attendee Address 0x..."
            value={attendee}
            onChange={(e) => setAttendee(e.target.value)}
            className="px-3 py-2 bg-transparent border border-[var(--app-card-border)] rounded-lg"
          />
          <input
            type="text"
            placeholder="Confirmation Code"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            className="px-3 py-2 bg-transparent border border-[var(--app-card-border)] rounded-lg"
          />
        </div>

        <div className="flex items-center gap-3">
          {canTransact ? (
            <Transaction
              chainId={chainId}
              contracts={async () => [
                {
                  abi: eventAbi.abi,
                  address: eventAddress as `0x${string}`,
                  functionName: "confirmAttendee",
                  args: [BigInt(numericEventId), attendee as `0x${string}`, confirmationCode],
                },
              ]}
              onStatus={(s) => setIsBusy(s.statusName === "transactionPending" || s.statusName === "buildingTransaction")}
            >
              <TransactionButton text={isBusy ? "Confirming..." : "Confirm Attendance"} />
              <TransactionStatus>
                <TransactionStatusLabel />
                <TransactionStatusAction />
              </TransactionStatus>
            </Transaction>
          ) : (
            <ConnectWallet />
          )}

          {canTransact ? (
            <Transaction
              chainId={chainId}
              contracts={async () => [
                {
                  abi: eventAbi.abi,
                  address: eventAddress as `0x${string}`,
                  functionName: "markAttended",
                  args: [BigInt(numericEventId), attendee as `0x${string}`],
                },
              ]}
              onStatus={(s) => setIsBusy(s.statusName === "transactionPending" || s.statusName === "buildingTransaction")}
            >
              <TransactionButton text={isBusy ? "Marking..." : "Mark Attended"} />
              <TransactionStatus>
                <TransactionStatusLabel />
                <TransactionStatusAction />
              </TransactionStatus>
            </Transaction>
          ) : null}
        </div>
      </div>
    </div>
  );
}


