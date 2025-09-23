"use client";

import React from "react";
import { Button } from "../DemoComponents";
import { CheckCircle2Icon, Loader2 } from "lucide-react";
import Image from "next/image";
import { EventFormData } from "@/utils/types";
import { useNotificationHelpers } from "@/hooks/useNotifications";

interface EventSummaryProps {
  formData: EventFormData;
  isConnected: boolean;
  canUseTransaction: boolean;
  preparedContracts: any[] | null;
  useBatchedMode: boolean;
  isPreparingForTransaction: boolean;
  verificationStatus: string;
  isSubmitting: boolean;
  transactionSuccessful: boolean;
  isVerifying: boolean;
  transactionStep: 'event' | 'tickets' | 'domain' | 'complete';
  createdEventId: string | null;
  setUseBatchedMode: (mode: boolean) => void;
  handleCreateEvent: () => void;
  resetTransactionState: () => void;
  notifyEventCreationStarted: () => void;
}

const EventSummary: React.FC<EventSummaryProps> = ({
  formData,
  isConnected,
  canUseTransaction,
  preparedContracts,
  useBatchedMode,
  isPreparingForTransaction,
  verificationStatus,
  isSubmitting,
  transactionSuccessful,
  isVerifying,
  transactionStep,
  createdEventId,
  setUseBatchedMode,
  handleCreateEvent,
  resetTransactionState,
  notifyEventCreationStarted,
}) => {
  return (
    <div className="space-y-6 -mt-28">
      {/* Event Summary */}
      <div className="space-y-4 rounded-lg">
        <CheckCircle2Icon className="w-10 h-10 text-green-500 text-center items-center justify-center" />
        <h1 className="text-2xl font-bold text-center">Event Summary</h1>
        {/* Basic Information */}
        <div className="space-y-3">
          <h4 className="text-base sm:text-lg font-medium text-foreground border-b border-border pb-2">Basic Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Title:</span>
              <p className="font-medium text-sm sm:text-base mt-1">{formData.title || "Not set"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Category:</span>
              <p className="font-medium text-sm sm:text-base mt-1">{formData.category || "Not set"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Start:</span>
              <p className="font-medium text-sm sm:text-base mt-1">{formData.startDateTime || "Not set"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">End:</span>
              <p className="font-medium text-sm sm:text-base mt-1">{formData.endDateTime || "Not set"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Location:</span>
              <p className="font-medium text-sm sm:text-base mt-1">{formData.location || "Not set"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Max Participants:</span>
              <p className="font-medium text-sm sm:text-base mt-1">{formData.maxParticipants}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Event Slug:</span>
              <p className="font-medium text-sm sm:text-base mt-1">{formData.slug || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="pt-3 border-t border-border">
          <h4 className="text-base sm:text-lg font-medium text-foreground mb-3">Description</h4>
          <p className="text-sm sm:text-base bg-muted rounded-lg p-3">
            {formData.description || "No description provided"}
          </p>
        </div>

        {/* Event Image */}
        {formData.image ? (
          <div className="pt-3 border-t border-border">
            <h4 className="text-base sm:text-lg font-medium text-foreground mb-3">Event Image</h4>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <Image src={formData.image || "/revent-logo.png"} alt="Event Image" width={64} height={64} className="object-cover w-full h-full" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base text-muted-foreground break-all">{formData.image}</p>
                <p className="text-xs text-muted-foreground mt-1">Image URL</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-border">
            <h4 className="text-base sm:text-lg font-medium text-foreground mb-3">Event Image</h4>
            <p className="text-sm sm:text-base text-muted-foreground italic">No image added</p>
          </div>
        )}

        {/* Hosts */}
        <div className="pt-3 border-t border-border">
          <h4 className="text-base sm:text-lg font-medium text-foreground mb-3">Event Hosts</h4>
          {formData.hosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formData.hosts.map((host, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <Image src={host.avatar || "/revent-logo.png"} alt="Host Avatar" width={40} height={40} />
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">@{host.name}</p>
                    <p className="text-xs text-muted-foreground">{host.role}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm sm:text-base text-muted-foreground italic">No hosts added</p>
          )}
        </div>

        {/* Agenda */}
        <div className="pt-3 border-t border-border">
          <h4 className="text-base sm:text-lg font-medium text-foreground mb-3">Event Agenda</h4>
          {formData.agenda.length > 0 ? (
            <div className="space-y-3">
              {formData.agenda.map((item, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm sm:text-base">{item.title}</h5>
                    <span className="text-sm text-primary font-medium">
                      {item.startTime} - {item.endTime}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm sm:text-base text-muted-foreground mb-2">{item.description}</p>
                  )}
                  {item.speakers && item.speakers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Image src={"/revent-logo.png"} alt="Speaker Avatar" width={16} height={16} />
                      <span>Speakers: {item.speakers.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm sm:text-base text-muted-foreground italic">No agenda items added</p>
          )}
        </div>

        {/* Tickets */}
        <div className="pt-3 border-t border-border">
          <h4 className="text-base sm:text-lg font-medium text-foreground mb-3">Event Tickets</h4>
          {formData.tickets.available ? (
            formData.tickets.types.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.tickets.types.map((ticket, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-sm sm:text-base">{ticket.type}</h5>
                      <span className="text-sm text-primary font-medium">
                        {ticket.currency} {ticket.price}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {ticket.quantity} tickets available
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm sm:text-base text-muted-foreground italic">Tickets enabled but no types added</p>
            )
          ) : (
            <p className="text-sm sm:text-base text-muted-foreground italic">No tickets for this event</p>
          )}
        </div>
      </div>

      {/* Transaction Mode Selection */}
      {/* {isConnected && canUseTransaction && !preparedContracts && (
        <div className="mb-6 p-4 bg-muted border border-border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Transaction Mode</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="transactionMode"
                value="sequential"
                checked={!useBatchedMode}
                onChange={() => setUseBatchedMode(false)}
                className="w-4 h-4 text-primary"
              />
              <div>
                <div className="font-medium">Sequential Mode</div>
                <div className="text-sm text-muted-foreground">
                  Create event first, then add tickets in separate transactions
                </div>
              </div>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="transactionMode"
                value="batched"
                checked={useBatchedMode}
                onChange={() => setUseBatchedMode(true)}
                className="w-4 h-4 text-primary"
              />
              <div>
                <div className="font-medium">Batched Mode</div>
                <div className="text-sm text-muted-foreground">
                  Create event and tickets in a single transaction (requires custom contract)
                </div>
              </div>
            </label>
          </div>
        </div>
      )} */}

      {/* Create Event Button (prepares everything) */}
      {/* {isConnected && !preparedContracts && (
        <div className="mt-6 p-4 px-0  rounded-lg">
          <div className="text-center flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={handleCreateEvent}
              disabled={isPreparingForTransaction || isSubmitting}
              className="w-full px-4 py-3 bg-muted-foreground text-primary-foreground rounded-lg hover:bg-muted-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isPreparingForTransaction ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing Everything...
                </div>
              ) : (
                "Prepare Event Creation"
              )}
            </button>

            <p className="text-xs text-muted-foreground mb-4 pt-2 flex items-center justify-center w-[70%]">
              Upload image, metadata to IPFS and prepare contract calls for event creation.
            </p>
            {verificationStatus && (
              <div className="mt-2 text-xs text-muted-foreground">
                {verificationStatus}
              </div>
            )}
          </div>
        </div>
      )} */}

      {/* Immediate Success Indicator */}
      {/* {transactionSuccessful && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="text-sm text-green-800 dark:text-green-200 font-medium">
              Transaction Successful!
            </div>
          </div>
          <div className="mt-2 text-xs text-green-700 dark:text-green-300">
            {isVerifying ? "Verifying event creation on the blockchain..." : "Event created successfully!"}
          </div>
          {isVerifying && (
            <div className="mt-2 flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500"></div>
              <span className="text-xs text-green-600 dark:text-green-400">Please wait...</span>
            </div>
          )}
        </div>
      )} */}

      {/* <p className="mt-2 text-center text-xs text-muted-foreground">
        <button
          type="button"
          onClick={resetTransactionState}
          className="underline hover:text-foreground"
        >
          Cancel
        </button>
      </p> */}
    </div>
  );
};

export default EventSummary;
