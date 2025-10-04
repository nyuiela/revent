"use client";

import { useWallet } from '@/components/WalletProvider';
import { useNotifications } from '@/components/NotificationSystem';

export default function WalletConnect() {
  const { isConnected, address, connect, disconnect, isLoading, error } = useWallet();
  const { addNotification } = useNotifications();

  const handleConnect = async () => {
    try {
      await connect();
      addNotification({
        type: 'success',
        title: 'Wallet Connected',
        message: `Successfully connected to ${address?.slice(0, 6)}...${address?.slice(-4)}`,
        duration: 3000
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: error || 'Failed to connect wallet',
        duration: 5000
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    addNotification({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Your wallet has been disconnected',
      duration: 3000
    });
  };

  return (
    <div className="flex items-center space-x-4">
      {isConnected ? (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h4c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
