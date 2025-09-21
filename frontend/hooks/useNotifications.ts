import { useNotifications as useNotificationsContext, notificationHelpers } from '../contexts/NotificationsContext';

// Re-export the main hook
export const useNotifications = useNotificationsContext;

// Export notification helpers for easy access
export { notificationHelpers };

// Additional helper functions for common notification patterns
export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications();

  return {
    // Event Creation Helpers
    notifyEventCreationStarted: () => {
      return addNotification(notificationHelpers.eventCreationStarted());
    },

    notifyEventCreationSuccess: (eventTitle: string) => {
      return addNotification(notificationHelpers.eventCreationSuccess(eventTitle));
    },

    notifyEventCreationError: (error: string) => {
      return addNotification(notificationHelpers.eventCreationError(error));
    },

    // File Upload Helpers
    notifyFileUploadStarted: (fileName: string) => {
      return addNotification(notificationHelpers.fileUploadStarted(fileName));
    },

    notifyFileUploadSuccess: (fileName: string, ipfsHash?: string) => {
      return addNotification(notificationHelpers.fileUploadSuccess(fileName, ipfsHash));
    },

    notifyFileUploadError: (fileName: string, error: string) => {
      return addNotification(notificationHelpers.fileUploadError(fileName, error));
    },

    // IPFS Helpers
    notifyIpfsUploadStarted: () => {
      return addNotification(notificationHelpers.ipfsUploadStarted());
    },

    notifyIpfsUploadSuccess: (ipfsHash: string) => {
      return addNotification(notificationHelpers.ipfsUploadSuccess(ipfsHash));
    },

    notifyIpfsUploadError: (error: string) => {
      return addNotification(notificationHelpers.ipfsUploadError(error));
    },

    // Contract Interaction Helpers
    notifyContractTransactionStarted: () => {
      return addNotification(notificationHelpers.contractTransactionStarted());
    },

    notifyContractTransactionSuccess: (txHash: string) => {
      return addNotification(notificationHelpers.contractTransactionSuccess(txHash));
    },

    notifyContractTransactionError: (error: string) => {
      return addNotification(notificationHelpers.contractTransactionError(error));
    },

    // Waitlist Helpers
    notifyWaitlistJoined: (position: number) => {
      return addNotification(notificationHelpers.waitlistJoined(position));
    },

    notifyWaitlistDuplicate: () => {
      return addNotification(notificationHelpers.waitlistDuplicate());
    },

    notifyWaitlistError: (error: string) => {
      return addNotification(notificationHelpers.waitlistError(error));
    },

    // Location Helpers
    notifyLocationDetected: () => {
      return addNotification(notificationHelpers.locationDetected());
    },

    notifyLocationError: () => {
      return addNotification(notificationHelpers.locationError());
    },

    // Map Interaction Helpers
    notifyEventSelected: (eventTitle: string) => {
      return addNotification(notificationHelpers.eventSelected(eventTitle));
    },

    // Generic Helpers
    notifySuccess: (title: string, message: string) => {
      return addNotification(notificationHelpers.genericSuccess(title, message));
    },

    notifyError: (title: string, message: string) => {
      return addNotification(notificationHelpers.genericError(title, message));
    },

    notifyInfo: (title: string, message: string) => {
      return addNotification(notificationHelpers.genericInfo(title, message));
    },

    // Custom notification helper
    notify: (notification: Parameters<typeof addNotification>[0]) => {
      return addNotification(notification);
    },
  };
};

// Hook for handling async operations with notifications
export const useAsyncNotification = () => {
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const executeWithNotification = async <T>(
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

    try {
      // Show loading notification
      const loadingId = addNotification({
        type: 'info',
        title: loadingTitle,
        message: loadingMessage,
        duration: 0, // Don't auto-dismiss
      });

      const result = await operation();

      // Remove loading notification
      removeNotification(loadingId);

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
  };

  return { executeWithNotification };
};

