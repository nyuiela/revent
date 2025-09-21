import { useNotifications as useNotificationsContext, notificationHelpers } from '../contexts/NotificationsContext';
import { useCallback } from 'react';

// Re-export the main hook
export const useNotifications = useNotificationsContext;

// Export notification helpers for easy access
export { notificationHelpers };

// Additional helper functions for common notification patterns
export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications();

  // Memoize all notification functions to prevent infinite re-renders
  const notifyEventCreationStarted = useCallback(() => {
    return addNotification(notificationHelpers.eventCreationStarted());
  }, [addNotification]);

  const notifyEventCreationSuccess = useCallback((eventTitle: string) => {
    return addNotification(notificationHelpers.eventCreationSuccess(eventTitle));
  }, [addNotification]);

  const notifyEventCreationError = useCallback((error: string) => {
    return addNotification(notificationHelpers.eventCreationError(error));
  }, [addNotification]);

  const notifyFileUploadStarted = useCallback((fileName: string) => {
    return addNotification(notificationHelpers.fileUploadStarted(fileName));
  }, [addNotification]);

  const notifyFileUploadSuccess = useCallback((fileName: string, ipfsHash?: string) => {
    return addNotification(notificationHelpers.fileUploadSuccess(fileName, ipfsHash));
  }, [addNotification]);

  const notifyFileUploadError = useCallback((fileName: string, error: string) => {
    return addNotification(notificationHelpers.fileUploadError(fileName, error));
  }, [addNotification]);

  const notifyIpfsUploadStarted = useCallback(() => {
    return addNotification(notificationHelpers.ipfsUploadStarted());
  }, [addNotification]);

  const notifyIpfsUploadSuccess = useCallback((ipfsHash: string) => {
    return addNotification(notificationHelpers.ipfsUploadSuccess(ipfsHash));
  }, [addNotification]);

  const notifyIpfsUploadError = useCallback((error: string) => {
    return addNotification(notificationHelpers.ipfsUploadError(error));
  }, [addNotification]);

  const notifyContractTransactionStarted = useCallback(() => {
    return addNotification(notificationHelpers.contractTransactionStarted());
  }, [addNotification]);

  const notifyContractTransactionSuccess = useCallback((txHash: string) => {
    return addNotification(notificationHelpers.contractTransactionSuccess(txHash));
  }, [addNotification]);

  const notifyContractTransactionError = useCallback((error: string) => {
    return addNotification(notificationHelpers.contractTransactionError(error));
  }, [addNotification]);

  const notifyWaitlistJoined = useCallback((position: number) => {
    return addNotification(notificationHelpers.waitlistJoined(position));
  }, [addNotification]);

  const notifyWaitlistDuplicate = useCallback(() => {
    return addNotification(notificationHelpers.waitlistDuplicate());
  }, [addNotification]);

  const notifyWaitlistError = useCallback((error: string) => {
    return addNotification(notificationHelpers.waitlistError(error));
  }, [addNotification]);

  const notifyLocationDetected = useCallback(() => {
    return addNotification(notificationHelpers.locationDetected());
  }, [addNotification]);

  const notifyLocationError = useCallback(() => {
    return addNotification(notificationHelpers.locationError());
  }, [addNotification]);

  const notifyEventSelected = useCallback((eventTitle: string) => {
    return addNotification(notificationHelpers.eventSelected(eventTitle));
  }, [addNotification]);

  const notifySuccess = useCallback((title: string, message: string) => {
    return addNotification(notificationHelpers.genericSuccess(title, message));
  }, [addNotification]);

  const notifyError = useCallback((title: string, message: string) => {
    return addNotification(notificationHelpers.genericError(title, message));
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message: string) => {
    return addNotification(notificationHelpers.genericInfo(title, message));
  }, [addNotification]);

  const notify = useCallback((notification: Parameters<typeof addNotification>[0]) => {
    return addNotification(notification);
  }, [addNotification]);

  return {
    // Event Creation Helpers
    notifyEventCreationStarted,
    notifyEventCreationSuccess,
    notifyEventCreationError,

    // File Upload Helpers
    notifyFileUploadStarted,
    notifyFileUploadSuccess,
    notifyFileUploadError,

    // IPFS Helpers
    notifyIpfsUploadStarted,
    notifyIpfsUploadSuccess,
    notifyIpfsUploadError,

    // Contract Interaction Helpers
    notifyContractTransactionStarted,
    notifyContractTransactionSuccess,
    notifyContractTransactionError,

    // Waitlist Helpers
    notifyWaitlistJoined,
    notifyWaitlistDuplicate,
    notifyWaitlistError,

    // Location Helpers
    notifyLocationDetected,
    notifyLocationError,

    // Map Interaction Helpers
    notifyEventSelected,

    // Generic Helpers
    notifySuccess,
    notifyError,
    notifyInfo,

    // Custom notification helper
    notify,
  };
};

// Hook for handling async operations with notifications
export const useAsyncNotification = () => {
  const { addNotification, removeNotification } = useNotifications();
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const executeWithNotification = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      loadingTitle?: string;
      loadingMessage?: string;
      successTitle?: string;
      successMessage?: (result: T) => string;
      errorTitle?: string;
      errorMessage?: (error: Error) => string;
    } = {}
  ): Promise<T | null> => {
    const {
      loadingTitle = 'Processing...',
      loadingMessage = 'Please wait while we process your request.',
      successTitle = 'Success!',
      successMessage = () => 'Operation completed successfully.',
      errorTitle = 'Error',
      errorMessage = (error: Error) => error.message,
    } = options;

    let loadingId: string | undefined;

    try {
      // Show loading notification
      loadingId = addNotification({
        type: 'info',
        title: loadingTitle,
        message: loadingMessage,
        duration: 0, // Don't auto-dismiss
      });

      const result = await operation();

      // Remove loading notification
      if (loadingId) {
        removeNotification(loadingId);
      }

      // Show success notification
      notifySuccess(successTitle, successMessage(result));

      return result;
    } catch (error) {
      // Remove loading notification if it exists
      if (loadingId) {
        removeNotification(loadingId);
      }

      // Show error notification
      notifyError(errorTitle, errorMessage(error as Error));

      return null;
    }
  }, [addNotification, removeNotification, notifySuccess, notifyError]);

  return { executeWithNotification };
};

