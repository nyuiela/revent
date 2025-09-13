"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "./DemoComponents";
import { Icon } from "./DemoComponents";
import { ChevronLeftIcon, ChevronRightIcon, Upload, X, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { eventAbi, eventAddress } from "@/lib/contract";
import { Transaction, TransactionButton, TransactionResponse, TransactionSponsor, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from "@coinbase/onchainkit/transaction";
import { useNotification } from "@coinbase/onchainkit/minikit";
import { WalletModal } from "@coinbase/onchainkit/wallet";
import { useRouter } from 'next/navigation';
import { EventFormData } from "@/utils/types";
// import VerticalLinearStepper from "./register-stepper";
import { useQuery } from "@tanstack/react-query";
import { headers, namesQuery, url } from "@/utils/subgraph";
import request from "graphql-request";
// Removed unused import


const CreateEventForm = () => {
  const { address, isConnected } = useAccount()
  const chainId = 84532;
  const router = useRouter()
  const canUseTransaction = Boolean(address && chainId && eventAddress)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    date: "",
    time: "",
    startDateTime: "",
    endDateTime: "",
    location: "",
    coordinates: { lat: 0, lng: 0 },
    image: "",
    category: "",
    maxParticipants: 100,
    isLive: false,
    platforms: [],
    totalRewards: 0,
    hosts: [],
    agenda: [],
    sponsors: [],
    tickets: {
      available: false,
      types: [],
    },
    socialLinks: {},
    tempHost: { name: "", role: "" },
    tempAgenda: { title: "", description: "", startTime: "", endTime: "", speakers: [] },
    tempTicket: { type: "", price: 0, currency: "USD", quantity: 0, perks: [] },
  });
  console.log('formData: ', formData);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [transactionStep, setTransactionStep] = useState<'event' | 'tickets' | 'domain' | 'complete'>('event');
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [transactionTimeout, setTransactionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [useSimpleMode, setUseSimpleMode] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [preparedContracts, setPreparedContracts] = useState<Record<string, unknown>[] | null>(null);
  const [preparedTicketContracts, setPreparedTicketContracts] = useState<Record<string, unknown>[] | null>(null);
  const [preparedDomainContracts, setPreparedDomainContracts] = useState<Record<string, unknown>[] | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [domainName, setDomainName] = useState<string>('');
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const sendNotification = useNotification();
  const [, setIpfsHash] = useState<string | null>(null);

  const handleSuccess = useCallback(async (response: TransactionResponse) => {
    const transactionHash = response.transactionReceipts[0].transactionHash;

    console.log(`Transaction successful: ${transactionHash}`);

    await sendNotification({
      title: "Congratulations!",
      body: `You sent your a transaction, ${transactionHash}!`,
    });
  }, [sendNotification]);
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transactionTimeout) {
        clearTimeout(transactionTimeout);
      }
    };
  }, [transactionTimeout]);

  const categories = [
    "Gaming & Esports",
    "Technology",
    "Art & Culture",
    "Finance",
    "Music",
    "Sports",
    "Education",
    "Networking",
    "Other",
  ];



  const handleInputChange = (field: keyof EventFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // File upload functions
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setUploadError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileUpload = async () => {
    if (!uploadedFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update form data with IPFS URL
      setFormData(prev => ({ ...prev, image: result.ipfsUrl }));

      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setUploadError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Function to reset transaction state
  const resetTransactionState = () => {
    setIsSubmitting(false);
    setTransactionStep('event');
    setCreatedEventId(null);
    setVerificationStatus('');
    setPreparedContracts(null);
    setPreparedTicketContracts(null);
    setPreparedDomainContracts(null);
    setIsPreparing(false);
    setDomainName('');
    setDomainAvailable(null);
    setCheckingDomain(false);
    if (transactionTimeout) {
      clearTimeout(transactionTimeout);
      setTransactionTimeout(null);
    }
  };

  // Function to auto-fill form with mock data
  const autoFillMockData = () => {
    const mockEvents = [
      {
        title: "Web3 Developer Meetup",
        description: "Join us for an exciting evening of Web3 development discussions, networking, and hands-on workshops. Learn about the latest trends in blockchain development, DeFi protocols, and NFT innovations.",
        category: "Technology",
        location: "San Francisco, CA",
        lat: 37.7749,
        lng: -122.4194,
        startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 7 days from now
        endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString().slice(0, 16), // 3 hours later
        maxAttendees: 150,
        registrationFee: 0.01,
        tickets: {
          available: true,
          types: [
            { type: "Early Bird", price: 0.005, currency: "ETH", quantity: 50, perks: ["Limited early bird tickets"] },
            { type: "General Admission", price: 0.01, currency: "ETH", quantity: 100, perks: ["Standard event access"] }
          ]
        }
      },
      {
        title: "DeFi Summit 2024",
        description: "The premier DeFi conference bringing together industry leaders, developers, and enthusiasts. Explore the future of decentralized finance with keynote speakers, panel discussions, and networking opportunities.",
        category: "Finance",
        location: "New York, NY",
        lat: 40.7128,
        lng: -74.0060,
        startDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 14 days from now
        endDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString().slice(0, 16), // 8 hours later
        maxAttendees: 500,
        registrationFee: 0.05,
        tickets: {
          available: true,
          types: [
            { type: "VIP Pass", price: 0.1, currency: "ETH", quantity: 50, perks: ["VIP access with premium perks"] },
            { type: "Standard Pass", price: 0.05, currency: "ETH", quantity: 300, perks: ["Full conference access"] },
            { type: "Student Pass", price: 0.02, currency: "ETH", quantity: 150, perks: ["Discounted student tickets"] }
          ]
        }
      },
      {
        title: "NFT Art Gallery Opening",
        description: "Experience the intersection of art and technology at our exclusive NFT gallery opening. Featuring works from renowned digital artists and emerging creators in the Web3 space.",
        category: "Art",
        location: "Los Angeles, CA",
        lat: 34.0522,
        lng: -118.2437,
        startDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 3 days from now
        endDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString().slice(0, 16), // 4 hours later
        maxAttendees: 200,
        registrationFee: 0.02,
        tickets: {
          available: true,
          types: [
            { type: "Artist Pass", price: 0.01, currency: "ETH", quantity: 50, perks: ["Special pricing for artists"] },
            { type: "General Admission", price: 0.02, currency: "ETH", quantity: 150, perks: ["Standard gallery access"] }
          ]
        }
      },
      {
        title: "Blockchain Gaming Tournament",
        description: "Compete in the ultimate blockchain gaming tournament featuring popular Web3 games. Prizes include NFTs, tokens, and exclusive gaming items. All skill levels welcome!",
        category: "Gaming",
        location: "Austin, TX",
        lat: 30.2672,
        lng: -97.7431,
        startDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 10 days from now
        endDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString().slice(0, 16), // 6 hours later
        maxAttendees: 100,
        registrationFee: 0.03,
        tickets: {
          available: true,
          types: [
            { type: "Competitor Pass", price: 0.03, currency: "ETH", quantity: 80, perks: ["Tournament participation"] },
            { type: "Spectator Pass", price: 0.01, currency: "ETH", quantity: 20, perks: ["Watch the tournament"] }
          ]
        }
      },
      {
        title: "Crypto Investment Workshop",
        description: "Learn the fundamentals of cryptocurrency investment from industry experts. Topics include portfolio management, risk assessment, and market analysis strategies.",
        category: "Education",
        location: "Chicago, IL",
        lat: 41.8781,
        lng: -87.6298,
        startDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 5 days from now
        endDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString().slice(0, 16), // 2 hours later
        maxAttendees: 75,
        registrationFee: 0.015,
        tickets: {
          available: true,
          types: [
            { type: "Workshop Access", price: 0.015, currency: "ETH", quantity: 75, perks: ["Full workshop participation"] }
          ]
        }
      }
    ];

    // Pick a random mock event
    const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];

    setFormData({
      title: randomEvent.title,
      description: randomEvent.description,
      category: randomEvent.category,
      location: randomEvent.location,
      coordinates: { lat: randomEvent.lat, lng: randomEvent.lng },
      startDateTime: randomEvent.startDateTime,
      endDateTime: randomEvent.endDateTime,
      maxParticipants: randomEvent.maxAttendees,
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&crop=center", // Default event image
      tickets: randomEvent.tickets,
      // Set default values for required fields
      date: '',
      time: '',
      isLive: false,
      platforms: [],
      totalRewards: 0,
      hosts: [],
      agenda: [],
      sponsors: [],
      socialLinks: {}
    });

    setIsAutoFilled(true);
    console.log('Auto-filled form with mock data:', randomEvent);
  };

  // Function to prepare contract calls (upload file and prepare transaction)
  const prepareContractCalls = async () => {
    try {
      setIsPreparing(true);
      setVerificationStatus('Preparing event data...');

      // First, upload the image if one is selected
      if (uploadedFile && !formData.image) {
        setVerificationStatus('Uploading image to IPFS...');
        await handleFileUpload();
      }

      setVerificationStatus('Preparing contract calls...');

      // Prepare the contract calls using the existing handleSubmit logic
      const contracts = await handleSubmit();

      console.log('Prepared contract calls:', contracts);
      setPreparedContracts(contracts);
      setVerificationStatus('Contract calls prepared successfully!');

      return contracts;
    } catch (error) {
      console.error('Error preparing contract calls:', error);
      setVerificationStatus('Failed to prepare contract calls');
      throw error;
    } finally {
      setIsPreparing(false);
    }
  };


  // Function to verify event creation using The Graph Protocol
  const verifyEventCreation = async (expectedEventData: Record<string, unknown>, maxAttempts: number = 10) => {
    console.log('Starting event verification via The Graph Protocol...');
    setVerificationStatus('Verifying event creation...');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Verification attempt ${attempt}/${maxAttempts}`);
        setVerificationStatus(`Verifying event creation... (${attempt}/${maxAttempts})`);

        // Fetch latest events from The Graph Protocol
        const response = await fetch('/api/events/graph');
        const data = await response.json();

        if (data.events && Array.isArray(data.events)) {
          // Look for a new event that matches our expected data
          const newEvent = data.events.find((event: Record<string, unknown>) => {
            // Match by title, creator, or other identifying characteristics
            return event.title === expectedEventData.title ||
              event.creator === expectedEventData.creator ||
              (event.startTime && event.endTime &&
                event.startTime === expectedEventData.startTime &&
                event.endTime === expectedEventData.endTime);
          });

          if (newEvent) {
            console.log('Event verified in The Graph Protocol:', newEvent);
            setVerificationStatus('Event verified successfully!');
            return {
              success: true,
              eventId: newEvent.id || newEvent.eventId,
              eventData: newEvent
            };
          }
        }

        // Wait before next attempt
        if (attempt < maxAttempts) {
          console.log(`Event not found yet, waiting 3 seconds before next attempt...`);
          setVerificationStatus(`Event not found yet, checking again... (${attempt}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`Verification attempt ${attempt} failed:`, error);
        setVerificationStatus(`Verification attempt ${attempt} failed, retrying...`);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    console.log('Event verification failed after all attempts');
    setVerificationStatus('Event verification failed');
    return { success: false, error: 'Event not found in The Graph Protocol' };
  };


  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build Transaction "contracts" for OnchainKit (uploads to IPFS, returns contract call)
  const handleSubmit = async () => {
    // Basic validations already handled in UI; build metadata
    const metadata = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      image: formData.image,
      category: formData.category,
      maxParticipants: formData.maxParticipants,
      hosts: formData.hosts,
      agenda: formData.agenda,
      tickets: formData.tickets,
      socialLinks: formData.socialLinks,
      // store times as ISO for off-chain reference
      startISO: formData.startDateTime,
      endISO: formData.endDateTime,
    };

    try {
      const res = await fetch("/api/ipfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `event-${formData.title}`, content: metadata }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("IPFS upload failed:", t);
        throw new Error("Failed to upload event metadata to IPFS");
      }
      const { uri } = await res.json();
      setIpfsHash(uri);

      // After IPFS, call registerEvent with computed times and IPFS hash
      const startIso = formData.startDateTime || (formData.date && formData.time ? `${formData.date}T${formData.time}` : "");
      const endIso = formData.endDateTime || "";
      if (!startIso || !endIso) {
        throw new Error("Please set both start and end time");
      }
      const startTime = Math.floor(new Date(startIso).getTime() / 1000);
      const endTime = Math.floor(new Date(endIso).getTime() / 1000);
      if (startTime >= endTime) {
        throw new Error("End time must be after start time");
      }

      // Return a ContractFunctionParameters[] for OnchainKit <Transaction contracts={...}>
      const contracts = [
        {
          abi: eventAbi.abi,
          address: eventAddress as `0x${string}`,
          functionName: "createEvent",
          args: [
            uri,
            BigInt(startTime),
            BigInt(endTime),
            BigInt(formData.maxParticipants),
            BigInt(0.006 * 10 ** 18),
          ],
        },
      ];

      return contracts;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // New function to handle ticket creation after event creation
  const handleTicketCreation = async (eventId: string) => {
    const ticketContracts = [];
    // uint256 eventId,
    //     string memory name,
    //     string memory ticketType,
    //     uint256 price,
    //     string memory currency,
    //     uint256 totalQuantity,
    //     string[] memory perks
    // Add tickets if any are configured
    if (formData.tickets.available && formData.tickets.types.length > 0) {
      for (const ticketType of formData.tickets.types) {
        ticketContracts.push({
          abi: eventAbi.abi,
          address: eventAddress as `0x${string}`,
          functionName: "addTicket",
          args: [
            BigInt(eventId),
            ticketType.type,
            ticketType.type,
            BigInt(ticketType.price * 1000000000000000000), // Convert to wei
            ticketType.currency,
            BigInt(ticketType.quantity),
            ticketType.perks || []
          ],
        });
      }
    }

    return ticketContracts;
  };

  type NamesQueryResult = { names?: { items?: { name: string }[] } }

  // Function to check domain availability against fetched registry (full domain input)
  const checkDomainAvailability = async (domain: string) => {
    const normalized = (domain || '').trim().toLowerCase()
    if (!normalized) {
      setDomainAvailable(false)
      return false
    }

    setCheckingDomain(true);
    try {
      console.log(`Checking availability for: ${normalized}`);
      // If query still loading, wait briefly
      if (isLoading || error) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      const isTaken = takenDomainSet.has(normalized)
      const isAvailable = !isTaken

      setDomainAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('Domain availability check failed:', error);
      setDomainAvailable(false);
      return false;
    } finally {
      setCheckingDomain(false);
    }
  };

  // Function to prepare domain minting contracts
  const prepareDomainMinting = async (eventId: string) => {
    try {
      setIsPreparing(true);
      setVerificationStatus('Preparing domain minting...');

      const domainContracts = [
        {
          abi: eventAbi.abi, // Using event ABI for demo
          address: eventAddress as `0x${string}`,
          functionName: "createEvent", // Mock function
          args: [
            `ipfs://event-${eventId}`, // IPFS hash for event metadata
            BigInt(0), // Mock timestamp
            BigInt(0), // Mock timestamp
            BigInt(0), // Mock participants
            BigInt(0), // Mock fee
          ],
        },
      ];

      console.log(`Prepared domain contracts for: ${domainName}`);
      console.log('Domain contracts:', domainContracts);
      setPreparedDomainContracts(domainContracts);
      setVerificationStatus(`Domain contracts prepared for ${domainName}!`);

      return domainContracts;
    } catch (error) {
      console.error('Error preparing domain contracts:', error);
      setVerificationStatus('Failed to prepare domain contracts');
      throw error;
    } finally {
      setIsPreparing(false);
    }
  };

  const steps = [
    { id: 1, title: "Basic Info", icon: "home" },
    { id: 2, title: "Details", icon: "share" },
    { id: 3, title: "Hosts", icon: "users" },
    { id: 4, title: "Agenda", icon: "calendar" },
    { id: 5, title: "Tickets", icon: "plus" },
    { id: 6, title: "Review", icon: "check" },
    { id: 7, title: "Domain", icon: "globe" },
  ];
  const { data, error, isLoading } = useQuery<NamesQueryResult>({
    queryKey: ['domains'],
    queryFn: () => request(url, namesQuery, {}, headers),
  })
  const takenDomainSet = useMemo(() => {
    const items = data?.names?.items || []
    return new Set(items.map((i) => i.name.toLowerCase()))
  }, [data])

  // suggestions removed; availability is checked only against fetched names
  console.log('domains: ', data);
  console.log('error: ', error);
  console.log('isLoading: ', isLoading);
  return (
    <div className="min-h-screen text-foreground bg-background relative z-[20] pt-14 pb-28">
      <div className="max-w-5xl mx-auto py-6 sm:py-8 md:py-10 bg-red-00">
        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          {/* Desktop Steps */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border border-border text-muted-foreground"
                      }`}
                  >
                    <Icon name={step.icon as "home" | "share" | "users" | "calendar" | "star" | "plus" | "check"} size="sm" />
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-4 transition-all ${currentStep > step.id ? "bg-primary" : "bg-border"
                        }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-4">
              {steps.map((step) => (
                <span
                  key={step.id}
                  className={`text-xs transition-colors ${currentStep >= step.id
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                    }`}
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          {/* Mobile Steps */}
          <div className="md:hidden">

            <div className="text-center">
              <span className="text-sm font-medium text-primary">
                Step {currentStep} of {steps.length}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                {steps[currentStep - 1]?.title}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-card rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 mx-2 sm:mx-0">
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-6 sm:mb-8 md:mb-10 tracking-tight text-foreground">Basic Event Information</h2>

              {/* Auto-fill Mock Data Button */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-muted border border-border rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Quick Start</h3>
                    <p className="text-xs text-muted-foreground">
                      Fill the form with realistic mock data for testing
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={autoFillMockData}
                      className="px-4 py-3 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors min-h-[44px]"
                    >
                      {isAutoFilled ? "✓ Auto-filled" : "Auto-fill"}
                    </button>
                    {(isAutoFilled || formData.title) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            title: '',
                            description: '',
                            category: '',
                            location: '',
                            coordinates: { lat: 0, lng: 0 },
                            startDateTime: '',
                            endDateTime: '',
                            maxParticipants: 100,
                            image: '',
                            tickets: {
                              available: false,
                              types: []
                            },
                            // Set default values for required fields
                            date: '',
                            time: '',
                            isLive: false,
                            platforms: [],
                            totalRewards: 0,
                            hosts: [],
                            agenda: [],
                            sponsors: [],
                            socialLinks: {}
                          });
                          setIsAutoFilled(false);
                          setPreparedContracts(null);
                          setPreparedTicketContracts(null);
                          setVerificationStatus('');
                        }}
                        className="px-4 py-3 bg-secondary text-secondary-foreground text-sm rounded-lg hover:bg-secondary/90 transition-colors min-h-[44px]"
                      >
                        Clear Form
                      </button>
                    )}
                  </div>
                </div>
                {isAutoFilled && (
                  <div className="mt-2 text-xs text-blue-600">
                    Form filled with mock data! You can modify any fields as needed.
                  </div>
                )}
                {isAutoFilled && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    <strong>Mock Event:</strong> {formData.title} • {formData.category} • {formData.location}
                  </div>
                )}
              </div>

              {/* Event Title */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-sm sm:text-base font-medium text-foreground">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 sm:py-3.5 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors text-sm sm:text-base"
                  placeholder="Enter event title"
                  required
                />
              </div>

              {/* Event Description */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-sm sm:text-base font-medium text-foreground">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 sm:py-3.5 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none text-sm sm:text-base"
                  placeholder="Describe your event..."
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-sm sm:text-base font-medium text-foreground">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 sm:py-3.5 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:outline-none transition-colors text-sm sm:text-base"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-6 sm:mb-8 md:mb-10 tracking-tight text-foreground">Event Details</h2>

              {/* Event Image */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-base font-medium text-foreground">
                  Event Image
                </label>

                {/* File Upload Area */}
                <div className="space-y-3">
                  {/* Upload Button */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      className="px-4 py-3"
                      icon={<Upload className="w-4 h-4" />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Image
                    </Button>

                    {uploadedFile && (
                      <Button
                        size="sm"
                        className="px-4 py-3"
                        icon={uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        onClick={handleFileUpload}
                        disabled={uploading}
                      >
                        {uploading ? 'Uploading...' : 'Upload to IPFS'}
                      </Button>
                    )}
                  </div>

                  {/* File Preview */}
                  {previewUrl && (
                    <div className="relative">
                      <div className="relative w-full h-52 rounded-xl overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={removeUploadedFile}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadedFile?.name} ({(uploadedFile?.size ? (uploadedFile.size / 1024 / 1024).toFixed(2) : '0')} MB)
                      </p>
                    </div>
                  )}

                  {/* Upload Error */}
                  {uploadError && (
                    <div className="text-red-500 text-sm">
                      {uploadError}
                    </div>
                  )}

                  {/* Current Image URL */}
                  {formData.image && (
                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-xs text-muted-foreground">
                        Current Image URL:
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={formData.image}
                          onChange={(e) => handleInputChange('image', e.target.value)}
                          className="flex-1 px-4 py-3.5 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                        <Button
                          size="sm"
                          className="px-4 py-3"
                          icon={<X className="w-4 h-4" />}
                          onClick={() => handleInputChange('image', '')}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Start and End DateTime */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDateTime}
                    onChange={(e) => handleInputChange('startDateTime', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDateTime}
                    onChange={(e) => handleInputChange('endDateTime', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter event location"
                  required
                />
              </div>

              {/* Max Participants */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Maximum Participants
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 text-foreground">Event Hosts</h2>
              <p className="text-center text-muted-foreground mb-6">
                Add usernames of people who will be hosting this event
              </p>

              {/* Existing Hosts */}
              {formData.hosts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-medium text-foreground">Current Hosts</h3>
                  {formData.hosts.map((host, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <Icon name="users" size="sm" className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium">@{host.name}</h4>
                          <p className="text-sm text-muted-foreground">{host.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newHosts = formData.hosts.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, hosts: newHosts }));
                        }}
                        className="p-3 text-muted-foreground hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Icon name="x" size="sm" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Host Form */}
              <div className="space-y-4 p-4 bg-background border border-border rounded-lg border-none">
                <h3 className="text-base sm:text-lg font-medium text-foreground">Add New Host</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      Username *
                    </label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={formData.tempHost?.name || ""}
                      onChange={(e) => {
                        const username = e.target.value.replace('@', '');
                        setFormData(prev => ({
                          ...prev,
                          tempHost: { ...prev.tempHost!, name: username }
                        }));
                      }}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Organizer, Speaker, Host"
                      value={formData.tempHost?.role || ""}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          tempHost: { ...prev.tempHost!, role: e.target.value }
                        }));
                      }}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <Button
                  loading={isSubmitting}
                  loadingText="Adding Host..."
                  onClick={() => {
                    if (formData.tempHost?.name && formData.tempHost.name.trim()) {
                      const newHost = {
                        name: formData.tempHost.name.trim(),
                        role: formData.tempHost.role || "Host",
                        avatar: "",
                        bio: "",
                        social: {}
                      };
                      setFormData(prev => ({
                        ...prev,
                        hosts: [...prev.hosts, newHost],
                        tempHost: { name: "", role: "" }
                      }));
                    }
                  }}
                  className="w-full py-3"
                  icon={<Icon name="plus" size="sm" />}
                >
                  Add Host
                </Button>
              </div>

            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 text-foreground">Event Agenda</h2>
              <p className="text-center text-muted-foreground mb-8">
                Plan the schedule and sessions for your event
              </p>

              {/* Existing Agenda Items */}
              {formData.agenda.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-medium text-foreground">Current Agenda</h3>
                  {formData.agenda.map((item, index) => (
                    <div key={index} className="p-4 bg-background border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-lg">{item.title}</h4>
                        <button
                          onClick={() => {
                            const newAgenda = formData.agenda.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, agenda: newAgenda }));
                          }}
                          className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Icon name="x" size="sm" />
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon name="calendar" size="sm" />
                          {item.startTime} - {item.endTime}
                        </span>
                        {item.speakers && item.speakers.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Icon name="users" size="sm" />
                            {item.speakers.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Agenda Item Form */}
              <div className="space-y-4 p-4 px-0 bg-background border border-border rounded-lg border-none">
                <h3 className="text-lg font-medium">Add New Agenda Item</h3>

                <div className="space-y-4">
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      Session Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Opening Keynote, Panel Discussion, Networking Break"
                      value={formData.tempAgenda?.title || ""}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          tempAgenda: { ...prev.tempAgenda!, title: e.target.value }
                        }));
                      }}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      Description
                    </label>
                    <textarea
                      placeholder="Describe what will happen in this session..."
                      value={formData.tempAgenda?.description || ""}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          tempAgenda: { ...prev.tempAgenda!, description: e.target.value }
                        }));
                      }}
                      rows={3}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={formData.tempAgenda?.startTime || ""}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            tempAgenda: { ...prev.tempAgenda!, startTime: e.target.value }
                          }));

                        }}
                        className="w-[80%] px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none transition-colors "
                        required
                      />
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={formData.tempAgenda?.endTime || ""}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            tempAgenda: { ...prev.tempAgenda!, endTime: e.target.value }
                          }));
                        }}
                        className="w-[80%] px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      Speakers (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., @alice_smith, @bob_jones (comma separated)"
                      value={formData.tempAgenda?.speakers || ""}
                      onChange={(e) => {
                        const speakers = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                        setFormData(prev => ({
                          ...prev,
                          tempAgenda: { ...prev.tempAgenda!, speakers }
                        }));
                      }}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <Button
                  loading={isSubmitting}
                  loadingText="Adding Agenda..."
                  onClick={() => {
                    if (formData.tempAgenda?.title && formData.tempAgenda?.startTime && formData.tempAgenda?.endTime) {
                      const newAgendaItem = {
                        title: formData.tempAgenda.title.trim(),
                        description: formData.tempAgenda.description || "",
                        startTime: formData.tempAgenda.startTime,
                        endTime: formData.tempAgenda.endTime,
                        speakers: formData.tempAgenda.speakers || []
                      };
                      setFormData(prev => ({
                        ...prev,
                        agenda: [...prev.agenda, newAgendaItem],
                        tempAgenda: { title: "", description: "", startTime: "", endTime: "", speakers: [] }
                      }));
                    }
                  }}
                  className="w-full py-3"
                  icon={<Icon name="plus" size="sm" />}
                >
                  Add Agenda Item
                </Button>
              </div>

            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">Event Tickets</h2>
              <p className="text-center text-muted-foreground mb-6">
                Configure ticketing and pricing options for your event
              </p>

              {/* Ticket Availability Toggle */}
              <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <Icon name="plus" size="sm" className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Tickets Available</h3>
                    <p className="text-sm text-muted-foreground">Sell tickets for this event</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tickets.available}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        tickets: { ...prev.tickets, available: e.target.checked }
                      }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-app-card-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Existing Ticket Types */}
              {formData.tickets.available && formData.tickets.types.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Current Ticket Types</h3>
                  {formData.tickets.types.map((ticket, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                      <div>
                        <h4 className="font-medium">{ticket.type}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${ticket.price} {ticket.currency} • {ticket.quantity} available
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const newTickets = formData.tickets.types.filter((_, i) => i !== index);
                          setFormData(prev => ({
                            ...prev,
                            tickets: { ...prev.tickets, types: newTickets }
                          }));
                        }}
                        className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Icon name="x" size="sm" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Ticket Type Form */}
              {formData.tickets.available && (
                <div className="space-y-4 bg-background border border-border rounded-lg border-none">
                  <h3 className="text-lg font-medium">Add New Ticket Type</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Ticket Type *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., General Admission, VIP, Early Bird"
                        value={formData.tempTicket?.type || ""}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            tempTicket: { ...prev.tempTicket!, type: e.target.value }
                          }));
                        }}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Price *
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={formData.tempTicket?.price || ""}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            tempTicket: { ...prev.tempTicket!, price: parseFloat(e.target.value) || 0 }
                          }));
                        }}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Currency
                      </label>
                      <select
                        value={formData.tempTicket?.currency || "USD"}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            tempTicket: { ...prev.tempTicket!, currency: e.target.value }
                          }));
                        }}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none transition-colors"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="ETH">ETH</option>
                      </select>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Quantity Available *
                      </label>
                      <input
                        type="number"
                        placeholder="100"
                        value={formData.tempTicket?.quantity || ""}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            tempTicket: { ...prev.tempTicket!, quantity: parseInt(e.target.value) || 0 }
                          }));
                        }}
                        min="1"
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    loading={isSubmitting}
                    loadingText="Adding Ticket..."
                    onClick={() => {
                      if (formData.tempTicket?.type && formData.tempTicket?.price && formData.tempTicket?.quantity) {
                        const newTicket = {
                          type: formData.tempTicket.type.trim(),
                          price: formData.tempTicket.price,
                          currency: formData.tempTicket.currency || "USD",
                          quantity: formData.tempTicket.quantity,
                          perks: []
                        };
                        setFormData(prev => ({
                          ...prev,
                          tickets: {
                            ...prev.tickets,
                            types: [...prev.tickets.types, newTicket]
                          },
                          tempTicket: { type: "", price: 0, currency: "USD", quantity: 0, perks: [] }
                        }));
                      }
                    }}
                    className="w-full py-3"
                    icon={<Icon name="plus" size="sm" />}
                  >
                    Add Ticket Type
                  </Button>
                </div>
              )}

            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">Event Summary</h2>

              {/* Event Summary */}
              <div className="space-y-4 bg-background rounded-lg">
                {/* <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 text-foreground">Event Summary</h3> */}

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
                {formData.image && (
                  <div className="pt-3 border-t border-border">
                    <h4 className="text-base sm:text-lg font-medium text-foreground mb-3">Event Image</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Icon name="camera" size="lg" className="text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm sm:text-base text-muted-foreground break-all">{formData.image}</p>
                        <p className="text-xs text-muted-foreground mt-1">Image URL</p>
                      </div>
                    </div>
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
                            <Icon name="users" size="sm" className="text-white" />
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
                              <Icon name="users" size="sm" />
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

              {/* Mode Toggle */}
              {process.env.NEXT_PUBLIC_ENV !== "development" && (
                <div className="mb-4 p-3 bg-app-card-bg border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Transaction Mode</h4>
                      <p className="text-xs text-muted-foreground">
                        {useSimpleMode
                          ? "Simple mode: Create event only (tickets can be added later)"
                          : "Advanced mode: Create event + add tickets in sequence"
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseSimpleMode(!useSimpleMode)}
                      className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-hover transition-colors"
                    >
                      {useSimpleMode ? "Advanced" : "Simple"}
                    </button>
                  </div>
                </div>
              )}

              {/* Simple Event Creation Transaction */}
              {isConnected && canUseTransaction && useSimpleMode && preparedContracts ? (
                <Transaction
                  chainId={chainId}
                  calls={(preparedContracts || []) as never}
                  onSuccess={handleSuccess}
                  onStatus={async (lifecycle) => {
                    console.log('Simple transaction lifecycle:', lifecycle.statusName);

                    if (lifecycle.statusName === 'transactionPending' || lifecycle.statusName === 'buildingTransaction') {
                      setIsSubmitting(true);
                    } else if (lifecycle.statusName === 'success' || lifecycle.statusName === 'error' || lifecycle.statusName === 'transactionLegacyExecuted') {
                      if (lifecycle.statusName === 'success') {
                        console.log('Transaction successful, starting verification...');

                        // Prepare expected event data for verification
                        const expectedEventData = {
                          title: formData.title,
                          creator: address, // Use the connected wallet address
                          startTime: Math.floor(new Date(formData.startDateTime).getTime() / 1000).toString(),
                          endTime: Math.floor(new Date(formData.endDateTime).getTime() / 1000).toString(),
                        };

                        // Verify event creation using The Graph Protocol
                        const verification = await verifyEventCreation(expectedEventData);

                        if (verification.success) {
                          console.log('Event verified successfully:', verification.eventId);
                          setCreatedEventId(verification.eventId);
                          setTransactionStep('domain');
                          setIsSubmitting(false);
                        } else {
                          console.error('Event verification failed:', verification.error);
                          setIsSubmitting(false);
                        }
                      } else {
                        console.log('Simple transaction failed or error');
                        setIsSubmitting(false);
                      }
                    }
                  }}
                >
                  <TransactionButton text={isSubmitting ? "Creating Event..." : "Create Event"} />
                  <TransactionSponsor />
                  <TransactionStatus>
                    <TransactionStatusLabel />
                    <TransactionStatusAction />
                  </TransactionStatus>
                </Transaction>
              ) : null}

              {/* Simple Domain Minting Transaction */}
              {isConnected && canUseTransaction && useSimpleMode && createdEventId ? (
                <div className="space-y-3">
                  <Transaction
                    chainId={1}
                    calls={(preparedDomainContracts || []) as never}
                    onSuccess={handleSuccess}
                    onStatus={async (lifecycle) => {
                      console.log('Simple domain transaction lifecycle:', lifecycle.statusName);

                      if (lifecycle.statusName === 'transactionPending' || lifecycle.statusName === 'buildingTransaction') {
                        setIsSubmitting(true);
                      } else if (lifecycle.statusName === 'success' || lifecycle.statusName === 'error' || lifecycle.statusName === 'transactionLegacyExecuted') {
                        if (lifecycle.statusName === 'success') {
                          console.log('Domain minted successfully');
                          setTransactionStep('complete');
                          setIsSubmitting(false);
                          if (transactionTimeout) {
                            clearTimeout(transactionTimeout);
                            setTransactionTimeout(null);
                          }
                          router.push(`/e/${createdEventId}`);
                        } else {
                          console.log('Domain transaction failed or error');
                          setIsSubmitting(false);
                        }
                      }
                    }}
                  >
                    <TransactionButton text={isSubmitting ? "Minting Domain..." : `Mint ${domainName}`} />
                    <TransactionSponsor />
                    <TransactionStatus>
                      <TransactionStatusLabel />
                      <TransactionStatusAction />
                    </TransactionStatus>
                  </Transaction>

                  {/* Skip Domain Button for Simple Mode */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Skipping domain minting');
                      setTransactionStep('complete');
                      setIsSubmitting(false);
                      if (transactionTimeout) {
                        clearTimeout(transactionTimeout);
                        setTransactionTimeout(null);
                      }
                      router.push(`/e/${createdEventId}`);
                    }}
                    className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Skip Domain (Complete Event Creation)
                  </button>
                </div>
              ) : null}

              {/* Advanced Event Creation Transaction */}
              {isConnected && canUseTransaction && !useSimpleMode && transactionStep === 'event' && preparedContracts ? (
                <Transaction
                  chainId={chainId}
                  calls={(preparedContracts || []) as never}
                  onStatus={async (lifecycle) => {
                    console.log('Event transaction lifecycle:', lifecycle.statusName);

                    if (lifecycle.statusName === 'transactionPending' || lifecycle.statusName === 'buildingTransaction') {
                      setIsSubmitting(true);
                    } else if (lifecycle.statusName === 'success' || lifecycle.statusName === 'error' || lifecycle.statusName === 'transactionLegacyExecuted') {
                      if (lifecycle.statusName === 'success') {
                        console.log('Transaction successful, starting verification...');

                        // Prepare expected event data for verification
                        const expectedEventData = {
                          title: formData.title,
                          creator: address, // Use the connected wallet address
                          startTime: Math.floor(new Date(formData.startDateTime).getTime() / 1000).toString(),
                          endTime: Math.floor(new Date(formData.endDateTime).getTime() / 1000).toString(),
                        };

                        // Verify event creation using The Graph Protocol
                        const verification = await verifyEventCreation(expectedEventData);

                        if (verification.success) {
                          console.log('Event verified successfully:', verification.eventId);
                          setCreatedEventId(verification.eventId);

                          // Check if we need to add tickets
                          if (formData.tickets.available && formData.tickets.types.length > 0) {
                            console.log('Preparing ticket contracts...');
                            try {
                              const ticketContracts = await handleTicketCreation(verification.eventId);
                              setPreparedTicketContracts(ticketContracts);
                              console.log('Moving to ticket creation step');
                              setTransactionStep('tickets');
                              setIsSubmitting(false); // Reset for next transaction
                            } catch (error) {
                              console.error('Error preparing ticket contracts:', error);
                              setIsSubmitting(false);
                            }
                          } else {
                            // No tickets to add, move to domain minting
                            console.log('No tickets to add, moving to domain minting');
                            setTransactionStep('domain');
                            setIsSubmitting(false);
                          }
                        } else {
                          console.error('Event verification failed:', verification.error);
                          setIsSubmitting(false);
                        }
                      } else {
                        // Transaction failed or error
                        console.log('Event transaction failed or error');
                        setIsSubmitting(false);
                      }
                    }
                  }}
                >
                  <TransactionButton text={isSubmitting ? "Creating Event..." : "Create Event"} />
                  <TransactionSponsor />
                  <TransactionStatus>
                    <TransactionStatusLabel />
                    <TransactionStatusAction />
                  </TransactionStatus>
                </Transaction>
              ) : null}

              {/* Advanced Ticket Creation Transaction */}
              {address && isConnected && canUseTransaction && !useSimpleMode && transactionStep === 'tickets' && createdEventId && preparedTicketContracts ? (
                <div className="space-y-3">
                  <Transaction
                    chainId={chainId}
                    onSuccess={handleSuccess}
                    calls={(preparedTicketContracts || []) as never}
                    onStatus={async (lifecycle) => {
                      console.log('Ticket transaction lifecycle:', lifecycle.statusName);

                      if (lifecycle.statusName === 'transactionPending' || lifecycle.statusName === 'buildingTransaction') {
                        setIsSubmitting(true);
                      } else if (lifecycle.statusName === 'success' || lifecycle.statusName === 'error' || lifecycle.statusName === 'transactionLegacyExecuted') {
                        if (lifecycle.statusName === 'success') {
                          // Tickets added successfully, move to domain minting
                          console.log('Tickets added successfully, moving to domain minting');
                          setTransactionStep('domain');
                          setIsSubmitting(false);
                        } else {
                          // Transaction failed or error
                          console.log('Ticket transaction failed or error: ', lifecycle.statusData);
                          setIsSubmitting(false);
                        }
                      }
                    }}
                  >
                    <TransactionButton text={isSubmitting ? "Adding Tickets..." : "Add Tickets"} />
                    <TransactionSponsor />
                    <TransactionStatus>
                      <TransactionStatusLabel />
                      <TransactionStatusAction />
                    </TransactionStatus>
                  </Transaction>

                  {/* Skip Tickets Button */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Skipping ticket creation');
                      setTransactionStep('complete');
                      setIsSubmitting(false);
                      if (transactionTimeout) {
                        clearTimeout(transactionTimeout);
                        setTransactionTimeout(null);
                      }
                      router.push(`/e/${createdEventId}`);
                    }}
                    className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Skip Tickets (Complete Event Creation)
                  </button>
                </div>
              ) : null}

              {/* Domain Minting Transaction */}
              {address && isConnected && canUseTransaction && !useSimpleMode && transactionStep === 'domain' && createdEventId && preparedDomainContracts ? (
                <div className="space-y-3">
                  <Transaction
                    chainId={chainId}
                    onSuccess={handleSuccess}
                    calls={(preparedDomainContracts || []) as never}
                    onStatus={async (lifecycle) => {
                      console.log('Domain transaction lifecycle:', lifecycle.statusName);

                      if (lifecycle.statusName === 'transactionPending' || lifecycle.statusName === 'buildingTransaction') {
                        setIsSubmitting(true);
                      } else if (lifecycle.statusName === 'success' || lifecycle.statusName === 'error' || lifecycle.statusName === 'transactionLegacyExecuted') {
                        if (lifecycle.statusName === 'success') {
                          // Domain minted successfully
                          console.log('Domain minted successfully');
                          setTransactionStep('complete');
                          setIsSubmitting(false);
                          if (transactionTimeout) {
                            clearTimeout(transactionTimeout);
                            setTransactionTimeout(null);
                          }
                          router.push(`/e/${createdEventId}`);
                        } else {
                          // Transaction failed or error
                          console.log('Domain transaction failed or error: ', lifecycle.statusData);
                          setIsSubmitting(false);
                        }
                      }
                    }}
                  >
                    <TransactionButton text={isSubmitting ? "Minting Domain..." : `Mint ${domainName}`} />
                    <TransactionSponsor />
                    <TransactionStatus>
                      <TransactionStatusLabel />
                      <TransactionStatusAction />
                    </TransactionStatus>
                  </Transaction>

                  {/* Skip Domain Button */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Skipping domain minting');
                      setTransactionStep('complete');
                      setIsSubmitting(false);
                      if (transactionTimeout) {
                        clearTimeout(transactionTimeout);
                        setTransactionTimeout(null);
                      }
                      router.push(`/e/${createdEventId}`);
                    }}
                    className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Skip Domain (Complete Event Creation)
                  </button>
                </div>
              ) : null}

              {/* Connect Wallet */}
              {!isConnected ? (
                <div className="mt-6 p-4 bg-app-card-bg border border-border rounded-lg">
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Connect Your Wallet
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Connect your wallet to create events on the blockchain.
                    </p>
                    <button
                      onClick={() => setShowWalletModal(true)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Connect Wallet
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Prepare Contract Calls Button */}
              {isConnected && !preparedContracts && (
                <div className="mt-6 p-4 bg-app-card-bg border border-border rounded-lg">
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Upload Event Data
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Upload your image to IPFS and prepare the contract calls for event creation.
                    </p>
                    <button
                      type="button"
                      onClick={prepareContractCalls}
                      disabled={isPreparing}
                      className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isPreparing ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </div>
                      ) : (
                        "Upload Contract Data"
                      )}
                    </button>
                    {verificationStatus && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {verificationStatus}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Prepared Contracts Status */}
              {/*               
              {isConnected && preparedContracts && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="text-sm text-green-800">
                        Contract calls prepared successfully! Ready to create event.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPreparedContracts(null);
                        setVerificationStatus('');
                      }}
                      className="text-xs text-green-600 hover:text-green-800 underline"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-green-600">
                    {preparedContracts.length} contract call(s) ready
                  </div>
                </div>
              )} */}

              {/* Transaction Progress Indicator */}
              {isSubmitting && (
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
              )}

              <p className="mt-2 text-center text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={resetTransactionState}
                  className="underline hover:text-foreground"
                >
                  Cancel
                </button>
              </p>
            </div>
          )}

          {currentStep === 7 && (
            <div className="">
              <h2 className="text-2xl font-bold text-center mb-0">Mint Domain Name</h2>
              <p className="text-center text-muted-foreground mb-6">
                Create a decentralized domain name for your event using the nyuiela.eth ecosystem
              </p>

              {/* Domain Input */}
              <div className="space-y-4 bg-background">
                <h3 className="text-lg font-medium">Choose Your Domain</h3>

                <div className="space-y-4">
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      Domain Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. myevent.io or myevent.core"
                      value={domainName}
                      onChange={(e) => {
                        setDomainName(e.target.value);
                        setDomainAvailable(null);
                      }}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-muted-foreground">Enter full domain including ending (e.g., .io, .core)</p>
                  </div>

                  {/* Domain Availability Check */}
                  {domainName && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => checkDomainAvailability(domainName)}
                        disabled={checkingDomain || !domainName}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {checkingDomain ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Checking...
                          </div>
                        ) : (
                          'Check Availability'
                        )}
                      </button>

                      {/* Availability Status */}
                      {domainAvailable !== null && (
                        <div className={`p-3 rounded-lg border ${domainAvailable
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                          }`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${domainAvailable ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                            <span className="font-medium">
                              {domainAvailable ? 'Available!' : 'Not Available'}
                            </span>
                          </div>
                          <p className="text-sm mt-1">
                            {domainAvailable
                              ? `You can mint ${domainName} for your event`
                              : `${domainName} is already taken.`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mint Domain Button */}
                  {domainAvailable && domainName && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => prepareDomainMinting(createdEventId || '')}
                        disabled={isPreparing || !createdEventId}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isPreparing ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Preparing Domain Minting...
                          </div>
                        ) : (
                          `Mint ${domainName}`
                        )}
                      </button>

                      {verificationStatus && (
                        <div className="text-xs text-muted-foreground text-center">
                          {verificationStatus}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Domain Benefits */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Domain Benefits</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Easy-to-remember URL for your event (e.g., abc.nyuiela.eth)</li>
                      <li>• Decentralized and censorship-resistant</li>
                      <li>• Points directly to your event&apos;s IPFS metadata</li>
                      <li>• Works with any IPFS gateway</li>
                      <li>• You own the domain permanently</li>
                      <li>• Part of the nyuiela.eth ecosystem</li>
                    </ul>
                  </div>

                  {/* Prepared Domain Status */}
                  {preparedDomainContracts && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="text-sm text-green-800">
                            Domain contracts prepared! Ready to mint {domainName}.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPreparedDomainContracts(null);
                            setVerificationStatus('');
                          }}
                          className="text-xs text-green-600 hover:text-green-800 underline"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  )}
                  {/* <VerticalLinearStepper /> */}
                </div>
              </div>

              {/* Skip Domain Option */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Skipping domain minting');
                    setTransactionStep('complete');
                    if (transactionTimeout) {
                      clearTimeout(transactionTimeout);
                      setTransactionTimeout(null);
                    }
                    router.push(`/e/${createdEventId}`);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Skip Domain Minting
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Static Navigation Buttons at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-app-background border-t border-border p-4 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            variant="outline"
            className="px-4 py-3 border-none bg-background hover:bg-black/10"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={handleNextStep}
              className="px-4 py-3 border-none bg-background text-foreground hover:bg-black/10"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </Button>
          ) : null}
        </div>
      </div>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        className="bg-black shadow-lg"
      />
    </div>
  );
};

export default CreateEventForm;
