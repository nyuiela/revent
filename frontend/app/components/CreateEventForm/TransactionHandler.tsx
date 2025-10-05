"use client";

import React from "react";
import { Transaction, TransactionButton, TransactionResponseType, TransactionSponsor, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from "@coinbase/onchainkit/transaction";
import { useNotification } from "@coinbase/onchainkit/minikit";
// import { WalletModal } from "@coinbase/onchainkit/wallet";
import { Loader2 } from "lucide-react";
import { EventFormData } from "@/utils/types";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import MultiContractButton from "../button/MultiContractButton";
import { eventAbi, eventAddress, ticketAbi, ticketAddress } from "@/lib/contract";
import { Abi } from "viem";

interface TransactionHandlerProps {
  isConnected: boolean;
  canUseTransaction: boolean;
  chainId: number;
  address: string | undefined;
  showWalletModal: boolean;
  preparedContracts: any[] | null;
  isSubmitting: boolean;
  transactionStep: 'event' | 'tickets' | 'domain' | 'complete';
  verificationStatus: string;
  createdEventId: string | null;
  preGeneratedEventId: string | null;
  formData: EventFormData;
  setShowWalletModal: (show: boolean) => void;
  setTransactionSuccessful: (success: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setCreatedEventId: (id: string | null) => void;
  setShowSuccessCard: (show: boolean) => void;
  setCreatedEventDetails: (details: any) => void;
  setTransactionStep: (step: 'event' | 'tickets' | 'domain' | 'complete') => void;
  createEventDetails: (eventId: string) => any;
  generateAndUploadEventMetadata: (eventId: string) => Promise<string | null>;
  updateLastEventId: (id: number) => void;
}

const TransactionHandler: React.FC<TransactionHandlerProps> = ({
  isConnected,
  canUseTransaction,
  chainId,
  address,
  showWalletModal,
  preparedContracts,
  isSubmitting,
  transactionStep,
  verificationStatus,
  createdEventId,
  preGeneratedEventId,
  formData,
  setShowWalletModal,
  setTransactionSuccessful,
  setIsSubmitting,
  setCreatedEventId,
  setShowSuccessCard,
  setCreatedEventDetails,
  setTransactionStep,
  createEventDetails,
  generateAndUploadEventMetadata,
  updateLastEventId,
}) => {
  const sendNotification = useNotification();
  const {
    notifyContractTransactionSuccess,
    notifyEventCreationSuccess,
  } = useNotificationHelpers();

  const handleSuccess = React.useCallback(async (response: TransactionResponseType) => {
    try {
      const transactionHash = response.transactionReceipts[0].transactionHash;
      const eventId = preGeneratedEventId || '1';

      console.log(`Transaction successful: ${transactionHash}`);

      // Only show notifications once - check if we've already processed this success
      const notificationsProcessedKey = `notifications_processed_${eventId}`;
      if (!sessionStorage.getItem(notificationsProcessedKey)) {
        // Show contract transaction success notification
        notifyContractTransactionSuccess(transactionHash);

        // Show event creation success notification
        notifyEventCreationSuccess(formData.title || 'Untitled Event');

        await sendNotification({
          title: "Congratulations!",
          body: `You sent your a transaction, ${transactionHash}!`,
        });

        // Mark as processed to prevent duplicate notifications
        sessionStorage.setItem(notificationsProcessedKey, 'true');
      }
    } catch (error) {
      console.error('Error in handleSuccess:', error);
      // Don't throw the error to prevent unhandled promise rejection
    }
  }, [sendNotification, notifyContractTransactionSuccess, notifyEventCreationSuccess, formData.title, preGeneratedEventId]);

  return (
    <>
      {/* Single Batched Event and Ticket Creation Transaction */}
      {true && isConnected && canUseTransaction && preparedContracts ? (

        <Transaction
          chainId={chainId}
          calls={(preparedContracts || []) as never}
          onSuccess={handleSuccess}
          onStatus={async (lifecycle) => {
            try {
              console.log('Batched transaction lifecycle:', lifecycle.statusName);

              if (lifecycle.statusName === 'transactionPending' || lifecycle.statusName === 'buildingTransaction') {
                setIsSubmitting(true);
              } else if (lifecycle.statusName === 'success' || lifecycle.statusName === 'error' || lifecycle.statusName === 'transactionLegacyExecuted') {
                if (lifecycle.statusName === 'success') {
                  console.log('Event and tickets created successfully!');

                  // Show immediate success feedback
                  setTransactionSuccessful(true);
                  setIsSubmitting(false);

                  // Use the pre-generated event ID
                  const eventId = preGeneratedEventId || '1';
                  setCreatedEventId(eventId);

                  // Update the cached event ID for future use
                  updateLastEventId(parseInt(eventId));

                  // Only generate metadata once - check if we've already processed this event
                  const hasProcessedKey = `metadata_generated_${eventId}`;
                  if (!sessionStorage.getItem(hasProcessedKey)) {
                    // Generate and upload event metadata
                    const metadataUrl = await generateAndUploadEventMetadata(eventId);
                    if (metadataUrl) {
                      console.log('Event metadata available at:', metadataUrl);
                    }
                    // Mark as processed to prevent duplicate calls
                    sessionStorage.setItem(hasProcessedKey, 'true');
                  }

                  // Only show success card once - check if we've already processed this success
                  const successProcessedKey = `success_processed_${eventId}`;
                  if (!sessionStorage.getItem(successProcessedKey)) {
                    // Create event details and show success card
                    const eventDetails = createEventDetails(eventId);
                    setCreatedEventDetails(eventDetails);
                    setShowSuccessCard(true);
                    setTransactionStep('complete');
                    // Mark as processed to prevent duplicate success handling
                    sessionStorage.setItem(successProcessedKey, 'true');
                  }
                } else {
                  // Transaction failed or error
                  console.log('Batched transaction failed or error');
                  setIsSubmitting(false);
                }
              }
            } catch (error) {
              console.error('Error in batched transaction onStatus:', error);
              setIsSubmitting(false);
            }
          }}
        >
          <TransactionButton text={isSubmitting ? "Creating Event & Tickets..." : "Create Event & Tickets"} />
          <TransactionSponsor />
          <TransactionStatus>
            <TransactionStatusLabel />
            <TransactionStatusAction />
          </TransactionStatus>
        </Transaction >
      ) : null}

      {/* Connect Wallet */}
      {/* {!isConnected ? (
        <div className="mt-6 p-4 px-0 rounded-lg w-full flex flex-col items-center justify-center">
          <div className="text-center w-full flex flex-col items-center justify-center">
            <button
              onClick={() => setShowWalletModal(true)}
              className="px-4 py-3 bg-muted-foreground text-primary-foreground rounded-lg hover:bg-muted-foreground/90 transition-colors w-full"
            >
              Connect Wallet
            </button>
            <p className="text-xs text-muted-foreground mb-4 pt-2 text-center w-[70%]">
              Connect your wallet to create events on the blockchain.
            </p>
          </div>
        </div>
      ) : null} */}

      {/* Transaction Progress Indicator */}
      {/* {isSubmitting && (
        <div className="mt-4 p-4 bg-app-card-bg border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="text-sm text-foreground">
              {transactionStep === 'event' && "Creating your event on the blockchain..."}
              {transactionStep === 'tickets' && "Adding tickets to your event..."}
              {transactionStep === 'domain' && "Minting domain name for your event..."}
              {transactionStep === 'complete' && "Event created successfully!"}
            </div>
          </div>
          {verificationStatus && (
            <div className="mt-2 text-xs text-muted-foreground">
              {verificationStatus}
            </div>
          )}
          {createdEventId && (
            <div className="mt-2 text-xs text-muted-foreground">
              Event ID: {createdEventId}
            </div>
          )}
        </div>
      )} */}

      {/* Wallet Modal */}
      {/* <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        className="bg-black shadow-lg z-[9999]"
      /> */}
    </>
  );
};

export default TransactionHandler;
