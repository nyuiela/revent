"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAccount } from 'wagmi';
// import { WalletModal } from '@coinbase/onchainkit/wallet';
import { useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  address: string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { address, isConnected } = useAccount();
  // const [showWalletModal, setShowWalletModal] = useState(false);

  const value = {
    isAuthenticated: isConnected,
    address,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        className="bg-black shadow-lg"
      /> */}
      <appkit-connect-button label="Login" size="sm" />
    </AuthContext.Provider>
  );
};

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated } = useAuth();
  // const [showWalletModal, setShowWalletModal] = useState(false);

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative max-w-[98%] md:max-w-md mx-auto rounded-2xl shadow-xl p-6 bg-background animate-in slide-in-from-bottom-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Please connect your wallet to access this page
            </p>
            {/* <div
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-app-card-bg border border-app-card-border text-sm cursor-pointer hover:bg-app-gray transition-colors mx-auto"
              onClick={() => setShowWalletModal(true)}
            >
              Connect Wallet
              </div> */}
            <appkit-connect-button label="Login" size="sm" />
          </div>
          <div className="mt-4 text-[11px] text-muted-foreground text-center">powered by revent</div>
        </div>
        {/* <WalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          className="bg-black shadow-lg z-50"
        /> */}
      </div>
    );
  }

  return <>{children}</>;
};
