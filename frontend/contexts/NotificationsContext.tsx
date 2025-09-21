"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, Upload, MapPin, Calendar, Users, FileText } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
}

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      duration: 5000, // Default 5 seconds
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationsContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationsContext.Provider>
  );
};

// Notification Container Component
const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            relative p-4 rounded-lg border shadow-lg backdrop-blur-sm
            transform transition-all duration-300 ease-in-out
            animate-in slide-in-from-right-full
            ${getNotificationStyles(notification.type)}
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {notification.icon || getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm mb-1">{notification.title}</h4>
              <p className="text-sm opacity-90">{notification.message}</p>
              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="mt-2 text-sm font-medium underline hover:no-underline"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Predefined notification helpers
export const notificationHelpers = {
  // Event Creation Notifications
  eventCreationStarted: () => ({
    type: 'info' as const,
    title: 'Creating Event',
    message: 'Preparing your event for creation...',
    icon: <Calendar className="w-5 h-5 text-blue-500" />,
  }),

  eventCreationSuccess: (eventTitle: string) => ({
    type: 'success' as const,
    title: 'Event Created!',
    message: `"${eventTitle}" has been successfully created and is now live!`,
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
  }),

  eventCreationError: (error: string) => ({
    type: 'error' as const,
    title: 'Event Creation Failed',
    message: `Failed to create event: ${error}`,
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
  }),

  // File Upload Notifications
  fileUploadStarted: (fileName: string) => ({
    type: 'info' as const,
    title: 'Uploading File',
    message: `Uploading "${fileName}" to IPFS...`,
    icon: <Upload className="w-5 h-5 text-blue-500" />,
  }),

  fileUploadSuccess: (fileName: string, ipfsHash?: string) => ({
    type: 'success' as const,
    title: 'File Uploaded!',
    message: `"${fileName}" has been uploaded to IPFS${ipfsHash ? ` (${ipfsHash.slice(0, 10)}...)` : ''}`,
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
  }),

  fileUploadError: (fileName: string, error: string) => ({
    type: 'error' as const,
    title: 'Upload Failed',
    message: `Failed to upload "${fileName}": ${error}`,
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
  }),

  // IPFS Notifications
  ipfsUploadStarted: () => ({
    type: 'info' as const,
    title: 'Uploading to IPFS',
    message: 'Uploading metadata to IPFS...',
    icon: <Upload className="w-5 h-5 text-blue-500" />,
  }),

  ipfsUploadSuccess: (ipfsHash: string) => ({
    type: 'success' as const,
    title: 'IPFS Upload Complete!',
    message: `Metadata uploaded successfully (${ipfsHash.slice(0, 10)}...)`,
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
  }),

  ipfsUploadError: (error: string) => ({
    type: 'error' as const,
    title: 'IPFS Upload Failed',
    message: `Failed to upload to IPFS: ${error}`,
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
  }),

  // Contract Interaction Notifications
  contractTransactionStarted: () => ({
    type: 'info' as const,
    title: 'Processing Transaction',
    message: 'Your transaction is being processed on the blockchain...',
    icon: <FileText className="w-5 h-5 text-blue-500" />,
  }),

  contractTransactionSuccess: (txHash: string) => ({
    type: 'success' as const,
    title: 'Transaction Confirmed!',
    message: `Transaction successful! Hash: ${txHash.slice(0, 10)}...`,
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
  }),

  contractTransactionError: (error: string) => ({
    type: 'error' as const,
    title: 'Transaction Failed',
    message: `Transaction failed: ${error}`,
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
  }),

  // Waitlist Notifications
  waitlistJoined: (position: number) => ({
    type: 'success' as const,
    title: 'Welcome to the Waitlist!',
    message: `You're #${position} on the waitlist. We'll notify you when we launch!`,
    icon: <Users className="w-5 h-5 text-green-500" />,
  }),

  waitlistDuplicate: () => ({
    type: 'warning' as const,
    title: 'Already on Waitlist',
    message: 'This email is already registered on our waitlist.',
    icon: <Info className="w-5 h-5 text-yellow-500" />,
  }),

  waitlistError: (error: string) => ({
    type: 'error' as const,
    title: 'Waitlist Error',
    message: `Failed to join waitlist: ${error}`,
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
  }),

  // Location Notifications
  locationDetected: () => ({
    type: 'success' as const,
    title: 'Location Detected',
    message: 'Your location has been detected. Events are now sorted by proximity.',
    icon: <MapPin className="w-5 h-5 text-green-500" />,
  }),

  locationError: () => ({
    type: 'warning' as const,
    title: 'Location Access Denied',
    message: 'Unable to access your location. Events will be shown in default order.',
    icon: <MapPin className="w-5 h-5 text-yellow-500" />,
  }),

  // Map Interaction Notifications
  eventSelected: (eventTitle: string) => ({
    type: 'info' as const,
    title: 'Event Selected',
    message: `Selected "${eventTitle}" on the map`,
    icon: <MapPin className="w-5 h-5 text-blue-500" />,
    duration: 2000,
  }),

  // General Notifications
  genericSuccess: (title: string, message: string) => ({
    type: 'success' as const,
    title,
    message,
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
  }),

  genericError: (title: string, message: string) => ({
    type: 'error' as const,
    title,
    message,
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
  }),

  genericInfo: (title: string, message: string) => ({
    type: 'info' as const,
    title,
    message,
    icon: <Info className="w-5 h-5 text-blue-500" />,
  }),
};

