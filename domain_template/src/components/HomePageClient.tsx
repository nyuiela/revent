"use client";

import { useState, useRef } from 'react';
import CountdownTimer from '@/components/CountdownTimer';
import TVLSection from '@/components/TVLSection';
import SpeakersSection from '@/components/SpeakersSection';
import TicketsSection from '@/components/TicketsSection';
import ScheduleSection from '@/components/ScheduleSection';
import SponsorsSection from '@/components/SponsorsSection';
import InvestModal from '@/components/InvestModal';
import WalletConnect from '@/components/WalletConnect';
import { useWallet } from '@/components/WalletProvider';
import { useNotifications } from '@/components/NotificationSystem';
import heroSectionImage from '../../public/hero-section.png';
import Image from 'next/image';

// Custom Connect Button Component
function CustomConnectButton() {
  const { isConnected, address, connect, disconnect, isLoading } = useWallet();
  const { addNotification } = useNotifications();
  const appKitRef = useRef<HTMLElement>(null);

  const handleConnect = async () => {
    try {
      // Try multiple approaches to trigger AppKit

      // Method 1: Try to find and click any AppKit button
      const appKitButtons = document.querySelectorAll('appkit-button, [data-appkit], .appkit-button');
      let clicked = false;

      for (const button of appKitButtons) {
        try {
          (button as any).click();
          clicked = true;
          break;
        } catch (e) {
          continue;
        }
      }

      // Method 2: Try to trigger AppKit programmatically
      if (!clicked && typeof window !== 'undefined') {
        // Try to access AppKit global
        if ((window as any).AppKit) {
          (window as any).AppKit.open();
          clicked = true;
        }

        // Try to dispatch a custom event
        if (!clicked) {
          const event = new CustomEvent('appkit:connect');
          window.dispatchEvent(event);
          clicked = true;
        }
      }

      // Method 3: Fallback to direct connection
      if (!clicked) {
        await connect();
      }

    } catch (error) {
      console.error('AppKit trigger failed:', error);
      // Fallback to direct wallet connection
      try {
        await connect();
      } catch (fallbackError) {
        addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: 'Please install MetaMask or another Web3 wallet',
          duration: 5000
        });
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
    addNotification({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Your wallet has been disconnected.',
      duration: 3000
    });
  };

  if (isConnected && address) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleDisconnect}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded border border-white transition-all duration-200 flex items-center justify-center space-x-2 relative transform hover:translate-y-[-1px] hover:translate-x-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Disconnect Wallet</span>
        </button>
        <div className="text-center">
          <p className="text-sm text-white/80">
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleDisconnect}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded border border-white transition-all duration-200 flex items-center justify-center space-x-2 relative transform hover:translate-y-[-1px] hover:translate-x-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Disconnect Wallet</span>
        </button>
        <div className="text-center">
          <p className="text-sm text-white/80">
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Styled AppKit button */}
      <appkit-button
        label="Connect Wallet"
        size="lg"
        className="w-full bg-[#6A28D7] hover:bg-[#5A1FA6] text-white font-semibold py-3 px-6 rounded border border-white transition-all duration-200 flex items-center justify-center space-x-2 relative transform hover:translate-y-[-1px] hover:translate-x-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
        style={{
          backgroundColor: '#6A28D7',
          '--appkit-button-background': '#6A28D7',
          '--appkit-button-hover-background': '#5A1FA6',
          '--appkit-button-color': 'white',
          '--appkit-button-border': '1px solid white',
          '--appkit-button-border-radius': '8px',
          '--appkit-button-padding': '12px 24px',
          '--appkit-button-font-weight': '600',
          '--appkit-button-box-shadow': '3px 3px 0px 0px rgba(0,0,0,0.3)',
          '--appkit-button-hover-box-shadow': '4px 4px 0px 0px rgba(0,0,0,0.4)',
          '--appkit-button-transform': 'translateY(-1px) translateX(1px)',
        } as any}
      />
    </div>
  );
}

export default function HomePageClient() {
  const [showInvest, setShowInvest] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Countdown Timer Bar */}
      <CountdownTimer />

      {/* Hero Section */}
      <div className="relative min-h-screen moonshot-hero">
        {/* Navigation */}
        <nav className="relative z-10 flex justify-end p-6">
          <div className="flex items-center space-x-8 text-white">
            <a href="#" className="flex items-center space-x-1 hover:text-gray-200 transition-colors">
              <span>Why Attend</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="flex items-center space-x-1 hover:text-gray-200 transition-colors">
              <span>Plan Your Trip</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="/gallery" className="hover:text-gray-200 transition-colors">Media</a>
            <a href="#" className="hover:text-gray-200 transition-colors">FAQS</a>
          </div>
        </nav>

        {/* Main Content */}
        <div className="relative z-10 flex items-center min-h-[calc(100vh-120px)] px-6">
          <div className="w-full flex items-center justify-between">
            {/* Left Side - Logos and Headlines */}
            <div className="flex-1">
              {/* Logos */}
              <div className="mb-12">
                <div className="flex items-center space-x-4 mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-white">MOONSHOT</h1>
                    <p className="text-white/80 text-sm">by techcabal</p>
                  </div>
                  <div className="text-white/60">×</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#6A28D7]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 5v10l6-5-6-5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-bold">sabi</p>
                      <p className="text-white/60 text-xs">In partnership with</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Headlines */}
              <div className="mb-8">
                <h2 className="text-6xl font-moonshot-bold text-white mb-2">MOONSHOT 2025</h2>
                <h3 className="text-8xl font-moonshot-black text-white mb-4">BUILDING</h3>
                <h3 className="text-8xl font-moonshot-black text-white mb-6">MOMENTUM</h3>
                <p className="text-xl text-white/90 max-w-md">
                  Africa's tech ecosystem positions itself for its next big leap.
                </p>
              </div>
            </div>

            {/* Right Side - CTA Buttons */}
            <div className="flex flex-col space-y-4">
              <button className="bg-[#50C878] hover:bg-[#45B06A] text-white font-semibold py-4 px-8 rounded border border-white transition-all duration-200 flex items-center space-x-2 relative transform hover:translate-y-[-2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)]">
                <span>Get Your Ticket</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="bg-[#FF8C00] hover:bg-[#E67E00] text-white font-semibold py-4 px-8 rounded border border-white transition-all duration-200 flex items-center space-x-2 relative transform hover:translate-y-[-2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)]">
                <span>Become A Sponsor</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Wallet Connect */}
              <div className="mt-4">
                <CustomConnectButton />
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Picture slideshow section */}
      <div className='w-full h-[60vh] relative'>
        <Image src={heroSectionImage} alt='slideshow' fill className='object-cover w-full h-[60vh]' />
      </div>

      {/* TVL Section */}
      <TVLSection onInvestClick={() => setShowInvest(true)} />

      {/* Speaker Image Section */}
      <div className="relative bg-gray-900 min-h-[500px] flex items-center justify-center">
        <div className="relative w-full max-w-4xl mx-auto">
          {/* Placeholder Speaker Image */}
          <div className="w-full h-96 bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600"></div>
            <div className="relative z-10 text-center text-white">
              <div className="w-32 h-32 bg-gray-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold">CN</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">CHARLES NWEKE</h3>
              <div className="bg-yellow-500 text-black px-4 py-2 rounded font-bold text-lg inline-block">
                SPEAKER
              </div>
            </div>

            {/* MOONSHOT Badge */}
            <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-lg">
              <div className="text-center">
                <div className="text-[#6A28D7] font-bold text-lg">MOONSHOT</div>
                <div className="text-gray-600 text-sm">by techcabal</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Section */}
      <div className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            EKO CONVENTION CENTRE, LAGOS
          </h2>
          <h3 className="text-6xl font-black text-gray-900">
            15TH - 16TH, OCTOBER, 2025
          </h3>
        </div>
      </div>

      {/* Sponsors Section */}
      <div className="bg-white">
        <div className="flex">
          {/* Left Panel - Green */}
          <div className="w-1/3 bg-[#50C878] relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
              }}></div>
            </div>
            <div className="relative z-10 flex items-center justify-center h-64">
              <div className="text-white text-center">
                <div className="text-6xl font-black leading-tight">
                  <div>2025</div>
                  <div>SPONSORS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Sponsor Logos */}
          <div className="w-2/3 bg-white p-8">
            <div className="flex items-center justify-between h-64">
              <div className="flex items-center space-x-8">
                {/* Sponsor 1 - ethnos */}
                <div className="text-center">
                  <div className="w-24 h-16 bg-red-500 rounded flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">ethnos</span>
                  </div>
                </div>

                {/* Sponsor 2 - wimbart */}
                <div className="text-center">
                  <div className="w-24 h-16 bg-orange-400 rounded flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">wimbart</span>
                  </div>
                </div>

                {/* Sponsor 3 - MacTAY */}
                <div className="text-center">
                  <div className="w-24 h-16 bg-red-600 rounded flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">MacTAY</span>
                  </div>
                  <div className="text-xs text-gray-600">...improving performance</div>
                </div>

                {/* Sponsor 4 - AllON */}
                <div className="text-center">
                  <div className="w-24 h-16 bg-orange-500 rounded flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">AllON</span>
                  </div>
                  <div className="text-xs text-gray-600">Energy innovations. Powerful collaborations.</div>
                </div>

                {/* Sponsor 5 - Sofri */}
                <div className="text-center">
                  <div className="w-24 h-16 bg-green-500 rounded flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">Sofri</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Speakers Section */}
      <SpeakersSection />

      {/* Tickets Section */}
      <TicketsSection />

      {/* Schedule Section */}
      <ScheduleSection />

      {/* Sponsors Section */}
      <SponsorsSection />

      {/* Decorative Footer with CTA */}
      <div className="relative bg-gradient-to-r from-[#6A28D7] to-[#50C878] min-h-[200px] overflow-hidden">
        {/* Wave Pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0,10 Q25,0 50,10 T100,10 L100,20 L0,20 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Get Tickets Button */}
        <div className="relative z-10 flex justify-end items-center h-full pr-8">
          <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 px-8 rounded-lg flex items-center space-x-3 transition-colors shadow-lg">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
              <path d="M6 7h8v2H6V7zm0 3h8v2H6v-2z" />
            </svg>
            <span className="text-lg">Get Tickets</span>
          </button>
        </div>
      </div>

      {/* Invest Modal */}
      <InvestModal
        isOpen={showInvest}
        onClose={() => setShowInvest(false)}
      />
    </div>
  );
}
