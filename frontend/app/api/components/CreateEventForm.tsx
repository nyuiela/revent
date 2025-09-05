"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./DemoComponents";
import { Icon } from "./DemoComponents";
import { ChevronLeftIcon, ChevronRightIcon, Upload, X, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { eventAbi, eventAddress } from "@/lib/contract";
import { Transaction, TransactionButton, TransactionResponse, TransactionSponsor, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from "@coinbase/onchainkit/transaction";
import { useNotification } from "@coinbase/onchainkit/minikit";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useRouter } from 'next/navigation';
// Removed unused import


type EventFormData = {
  title: string;
  description: string;
  date: string;
  time: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  coordinates: { lat: number; lng: number };
  image: string;
  category: string;
  maxParticipants: number;
  isLive: boolean;
  platforms: string[];
  totalRewards: number;
  hosts: {
    name: string;
    avatar: string;
    role: string;
    bio?: string;
    social?: {
      twitter?: string;
      linkedin?: string;
      website?: string;
    };
  }[];
  agenda: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    speakers?: string[];
  }[];
  sponsors: {
    name: string;
    logo: string;
    link: string;
  }[];
  tickets: {
    available: boolean;
    types: { type: string; price: number; currency: string; quantity: number; perks?: string[] }[];
  };
  socialLinks: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  tempHost?: {
    name: string;
    role: string;
  };
  tempAgenda?: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    speakers: string[];
  };
  tempTicket?: {
    type: string;
    price: number;
    currency: string;
    quantity: number;
    perks: string[];
  };
};

const CreateEventForm = () => {
  const { address, isConnected } = useAccount()
  const chainId = 84532;
  const router = useRouter()
  const canUseTransaction = Boolean(address && chainId && eventAddress)
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
  const [transactionStep, setTransactionStep] = useState<'event' | 'tickets' | 'complete'>('event');
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [transactionTimeout, setTransactionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [useSimpleMode, setUseSimpleMode] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [preparedContracts, setPreparedContracts] = useState<Record<string, unknown>[] | null>(null);
  const [preparedTicketContracts, setPreparedTicketContracts] = useState<Record<string, unknown>[] | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const sendNotification = useNotification();

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
    setIsPreparing(false);
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
            BigInt(0.005 * 10 ** 18),
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
            // uint256 eventId,
            // string memory name,
            // string memory ticketType,
            // uint256 price,
            // string memory currency,
            // uint256 totalQuantity,
            // string[] memory perks
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

  const steps = [
    { id: 1, title: "Basic Info", icon: "home" },
    { id: 2, title: "Details", icon: "share" },
    { id: 3, title: "Hosts", icon: "users" },
    { id: 4, title: "Agenda", icon: "calendar" },
    { id: 5, title: "Tickets", icon: "plus" },
    { id: 6, title: "Review", icon: "check" },
  ];

  // register event on contract
  // function createEvent(uri: string) {
  //   console.log("Registering event on contract");
  //   // Build placeholder IPFS hash; replace with real IPFS upload integration
  //   const ipfsHash = `ipfs://placeholder-${Date.now()}`;

  //   // Prefer explicit start/end datetime; fallback to separate date/time if provided
  //   const startIso = formData.startDateTime || (formData.date && formData.time ? `${formData.date}T${formData.time}` : "");
  //   const endIso = formData.endDateTime || "";

  //   if (!startIso || !endIso) {
  //     alert("Please set both start time and end time");
  //     return;
  //   }

  //   const startTime = Math.floor(new Date(startIso).getTime() / 1000);
  //   const endTime = Math.floor(new Date(endIso).getTime() / 1000);

  //   if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
  //     alert("Invalid start or end time");
  //     return;
  //   }

  //   if (startTime >= endTime) {
  //     alert("End time must be after start time");
  //     return;
  //   }

  //   writeContract({
  //     abi: eventAbi.abi,
  //     address: eventAddress as `0x${string}`,
  //     account: address,
  //     functionName: "createEvent",
  //     args: [
  //       ipfsHash,
  //       BigInt(startTime),
  //       BigInt(endTime),
  //       BigInt(formData.maxParticipants),
  //       0,
  //     ],
  //   })
  // }

  return (
    <div className="min-h-screen text-[var(--app-foreground)] bg-background relative z-[20] pt-10 pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          {/* Desktop Steps */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${currentStep >= step.id
                      ? "bg-[var(--app-accent)] text-white"
                      : "bg-transparent border border-[var(--app-card-border)] text-[var(--app-foreground-muted)]"
                      }`}
                  >
                    <Icon name={step.icon as "home" | "share" | "users" | "calendar" | "star" | "plus" | "check"} size="sm" />
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-4 transition-all ${currentStep > step.id ? "bg-[var(--app-accent)]" : "bg-[var(--app-card-border)]"
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
                    ? "text-[var(--app-accent)] font-medium"
                    : "text-[var(--app-foreground-muted)]"
                    }`}
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          {/* Mobile Steps */}
          <div className="md:hidden">
            {/* <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${currentStep >= 1
                    ? "bg-[var(--app-accent)] text-white"
                    : "bg-transparent border border-[var(--app-card-border)] text-[var(--app-foreground-muted)]"
                    }`}
                >
                  <Icon name="home" size="sm" />
                </div>
                <span className="text-xs text-[var(--app-foreground-muted)]">→</span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${currentStep >= 2
                    ? "bg-[var(--app-accent)] text-white"
                    : "bg-transparent border border-[var(--app-card-border)] text-[var(--app-foreground-muted)]"
                    }`}
                >
                  <Icon name="share" size="sm" />
                </div>
                <span className="text-xs text-[var(--app-foreground-muted)]">→</span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${currentStep >= 3
                    ? "bg-[var(--app-accent)] text-white"
                    : "bg-transparent border border-[var(--app-card-border)] text-[var(--app-foreground-muted)]"
                    }`}
                >
                  <Icon name="users" size="sm" />
                </div>
                <span className="text-xs text-[var(--app-foreground-muted)]">...</span>
              </div>
            </div> */}

            <div className="text-center">
              <span className="text-sm font-medium text-[var(--app-accent)]">
                Step {currentStep} of {steps.length}
              </span>
              <p className="text-xs text-[var(--app-foreground-muted)] mt-1">
                {steps[currentStep - 1]?.title}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-transparent border-none border-[var(--app-card-border)] rounded-xl p-4 md:p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">Basic Event Information</h2>

              {/* Auto-fill Mock Data Button */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Quick Start</h3>
                    <p className="text-xs text-blue-600">
                      Fill the form with realistic mock data for testing
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={autoFillMockData}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {isAutoFilled ? "✓ Auto-filled" : "Auto-fill Mock Data"}
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
                        className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--app-foreground)]">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
                  placeholder="Enter event title"
                  required
                />
              </div>

              {/* Event Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--app-foreground)]">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors resize-none"
                  placeholder="Describe your event..."
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--app-foreground)]">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
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
              <h2 className="text-2xl font-bold text-center mb-8">Event Details</h2>

              {/* Event Image */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--app-foreground)]">
                  Event Image
                </label>

                {/* File Upload Area */}
                <div className="space-y-3">
                  {/* Upload Button */}
                  <div className="flex gap-3">
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
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-[var(--app-card-border)]">
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
                      <p className="text-xs text-[var(--app-foreground-muted)] mt-1">
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
                    <div className="space-y-2">
                      <label className="text-xs text-[var(--app-foreground-muted)]">
                        Current Image URL:
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={formData.image}
                          onChange={(e) => handleInputChange('image', e.target.value)}
                          className="flex-1 px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--app-foreground)]">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDateTime}
                    onChange={(e) => handleInputChange('startDateTime', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--app-foreground)]">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDateTime}
                    onChange={(e) => handleInputChange('endDateTime', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--app-foreground)]">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
                  placeholder="Enter event location"
                  required
                />
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--app-foreground)]">
                  Maximum Participants
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">Event Hosts</h2>
              <p className="text-center text-[var(--app-foreground-muted)] mb-6">
                Add usernames of people who will be hosting this event
              </p>

              {/* Existing Hosts */}
              {formData.hosts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Current Hosts</h3>
                  {formData.hosts.map((host, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-transparent border border-[var(--app-card-border)] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--app-accent)] rounded-full flex items-center justify-center">
                          <Icon name="users" size="sm" className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium">@{host.name}</h4>
                          <p className="text-sm text-[var(--app-foreground-muted)]">{host.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newHosts = formData.hosts.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, hosts: newHosts }));
                        }}
                        className="p-2 text-[var(--app-foreground-muted)] hover:text-red-500 transition-colors"
                      >
                        <Icon name="x" size="sm" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Host Form */}
              <div className="space-y-4 p-4 bg-transparent border border-[var(--app-card-border)] rounded-lg border-none">
                <h3 className="text-lg font-medium">Add New Host</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--app-foreground)]">
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
                      className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--app-foreground)]">
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
                      className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
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

              {/* Host Tips */}
              <div className="p-4 bg-transparent border border-[var(--app-card-border)] rounded-lg">
                <h4 className="font-medium mb-2">💡 Tips for adding hosts:</h4>
                <ul className="text-sm text-[var(--app-foreground-muted)] space-y-1">
                  <li>• Use usernames without the @ symbol</li>
                  <li>• Add a role to clarify their involvement</li>
                  <li>• You can add multiple hosts for different roles</li>
                  <li>• Hosts will be displayed on the event page</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-center mb-0">Event Agenda</h2>
              <p className="text-center text-[var(--app-foreground-muted)] mb-8">
                Plan the schedule and sessions for your event
              </p>

              {/* Existing Agenda Items */}
              {formData.agenda.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Current Agenda</h3>
                  {formData.agenda.map((item, index) => (
                    <div key={index} className="p-4 bg-transparent border border-[var(--app-card-border)] rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-lg">{item.title}</h4>
                        <button
                          onClick={() => {
                            const newAgenda = formData.agenda.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, agenda: newAgenda }));
                          }}
                          className="p-2 text-[var(--app-foreground-muted)] hover:text-red-500 transition-colors"
                        >
                          <Icon name="x" size="sm" />
                        </button>
                      </div>
                      <p className="text-sm text-[var(--app-foreground-muted)] mb-3">{item.description}</p>
                      <div className="flex items-center gap-4 text-xs text-[var(--app-foreground-muted)]">
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
              <div className="space-y-4 p-4 px-0 bg-transparent border border-[var(--app-card-border)] rounded-lg border-none">
                <h3 className="text-lg font-medium">Add New Agenda Item</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--app-foreground)]">
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
                      className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--app-foreground)]">
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
                      className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--app-foreground)]">
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
                        className="w-[80%] px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors "
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--app-foreground)]">
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
                        className="w-[80%] px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--app-foreground)]">
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
                      className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
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

              {/* Agenda Tips */}
              <div className="p-4 bg-transparent border border-[var(--app-card-border)] rounded-lg">
                <h4 className="font-medium mb-2">💡 Tips for creating your agenda:</h4>
                <ul className="text-sm text-[var(--app-foreground-muted)] space-y-1">
                  <li>• Start with opening remarks and welcome</li>
                  <li>• Include breaks for networking and refreshments</li>
                  <li>• Plan for Q&A sessions after presentations</li>
                  <li>• End with closing remarks and next steps</li>
                  <li>• Consider time zones if it&apos;s a virtual event</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">Event Tickets</h2>
              <p className="text-center text-[var(--app-foreground-muted)] mb-6">
                Configure ticketing and pricing options for your event
              </p>

              {/* Ticket Availability Toggle */}
              <div className="flex items-center justify-between p-4 bg-transparent border border-[var(--app-card-border)] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--app-accent)] rounded-full flex items-center justify-center">
                    <Icon name="plus" size="sm" className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Tickets Available</h3>
                    <p className="text-sm text-[var(--app-foreground-muted)]">Sell tickets for this event</p>
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
                  <div className="w-11 h-6 bg-[var(--app-card-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--app-accent)]"></div>
                </label>
              </div>

              {/* Existing Ticket Types */}
              {formData.tickets.available && formData.tickets.types.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Current Ticket Types</h3>
                  {formData.tickets.types.map((ticket, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-transparent border border-[var(--app-card-border)] rounded-lg">
                      <div>
                        <h4 className="font-medium">{ticket.type}</h4>
                        <p className="text-sm text-[var(--app-foreground-muted)]">
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
                        className="p-2 text-[var(--app-foreground-muted)] hover:text-red-500 transition-colors"
                      >
                        <Icon name="x" size="sm" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Ticket Type Form */}
              {formData.tickets.available && (
                <div className="space-y-4 p-4 bg-transparent border border-[var(--app-card-border)] rounded-lg border-none">
                  <h3 className="text-lg font-medium">Add New Ticket Type</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--app-foreground)]">
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
                        className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--app-foreground)]">
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
                        className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--app-foreground)]">
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
                        className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="ETH">ETH</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--app-foreground)]">
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
                        className="w-full px-4 py-3 bg-transparent border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors"
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

              {/* Ticket Tips */}
              <div className="p-4 bg-transparent border border-[var(--app-card-border)] rounded-lg">
                <h4 className="font-medium mb-2">💡 Tips for ticket pricing:</h4>
                <ul className="text-sm text-[var(--app-foreground-muted)] space-y-1">
                  <li>• Offer early bird discounts to encourage early registration</li>
                  <li>• Create VIP tiers with exclusive benefits</li>
                  <li>• Consider free tickets for speakers and sponsors</li>
                  <li>• Set realistic quantities based on venue capacity</li>
                  <li>• Price competitively within your market</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">Review & Create Event</h2>

              {/* Event Summary */}
              <div className="space-y-6 p-6 bg-transparent border border-[var(--app-card-border)] rounded-lg">
                <h3 className="text-xl font-semibold text-center mb-6">Event Summary</h3>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium border-b border-[var(--app-card-border)] pb-2">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[var(--app-foreground-muted)]">Title:</span>
                      <p className="font-medium text-base">{formData.title || "Not set"}</p>
                    </div>
                    <div>
                      <span className="text-[var(--app-foreground-muted)]">Category:</span>
                      <p className="font-medium text-base">{formData.category || "Not set"}</p>
                    </div>
                    <div>
                      <span className="text-[var(--app-foreground-muted)]">Start:</span>
                      <p className="font-medium text-base">{formData.startDateTime || "Not set"}</p>
                    </div>
                    <div>
                      <span className="text-[var(--app-foreground-muted)]">End:</span>
                      <p className="font-medium text-base">{formData.endDateTime || "Not set"}</p>
                    </div>
                    <div>
                      <span className="text-[var(--app-foreground-muted)]">Location:</span>
                      <p className="font-medium text-base">{formData.location || "Not set"}</p>
                    </div>
                    <div>
                      <span className="text-[var(--app-foreground-muted)]">Max Participants:</span>
                      <p className="font-medium text-base">{formData.maxParticipants}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="pt-4 border-t border-[var(--app-card-border)]">
                  <h4 className="text-lg font-medium mb-3">Description</h4>
                  <p className="text-sm bg-transparent border border-[var(--app-card-border)] rounded-lg p-3">
                    {formData.description || "No description provided"}
                  </p>
                </div>

                {/* Event Image */}
                {formData.image && (
                  <div className="pt-4 border-t border-[var(--app-card-border)]">
                    <h4 className="text-lg font-medium mb-3">Event Image</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 bg-transparent border border-[var(--app-card-border)] rounded-lg flex items-center justify-center">
                        <Icon name="camera" size="lg" className="text-[var(--app-foreground-muted)]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--app-foreground-muted)] break-all">{formData.image}</p>
                        <p className="text-xs text-[var(--app-foreground-muted)] mt-1">Image URL</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hosts */}
                <div className="pt-4 border-t border-[var(--app-card-border)]">
                  <h4 className="text-lg font-medium mb-3">Event Hosts</h4>
                  {formData.hosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formData.hosts.map((host, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-transparent border border-[var(--app-card-border)] rounded-lg">
                          <div className="w-10 h-10 bg-[var(--app-accent)] rounded-full flex items-center justify-center">
                            <Icon name="users" size="sm" className="text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">@{host.name}</p>
                            <p className="text-xs text-[var(--app-foreground-muted)]">{host.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--app-foreground-muted)] italic">No hosts added</p>
                  )}
                </div>

                {/* Agenda */}
                <div className="pt-4 border-t border-[var(--app-card-border)]">
                  <h4 className="text-lg font-medium mb-3">Event Agenda</h4>
                  {formData.agenda.length > 0 ? (
                    <div className="space-y-3">
                      {formData.agenda.map((item, index) => (
                        <div key={index} className="p-4 bg-transparent border border-[var(--app-card-border)] rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-base">{item.title}</h5>
                            <span className="text-sm text-[var(--app-accent)] font-medium">
                              {item.startTime} - {item.endTime}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-[var(--app-foreground-muted)] mb-3">{item.description}</p>
                          )}
                          {item.speakers && item.speakers.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-[var(--app-foreground-muted)]">
                              <Icon name="users" size="sm" />
                              <span>Speakers: {item.speakers.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--app-foreground-muted)] italic">No agenda items added</p>
                  )}
                </div>

                {/* Tickets */}
                <div className="pt-4 border-t border-[var(--app-card-border)]">
                  <h4 className="text-lg font-medium mb-3">Event Tickets</h4>
                  {formData.tickets.available ? (
                    formData.tickets.types.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {formData.tickets.types.map((ticket, index) => (
                          <div key={index} className="p-4 bg-transparent border border-[var(--app-card-border)] rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-base">{ticket.type}</h5>
                              <span className="text-sm text-[var(--app-accent)] font-medium">
                                {ticket.currency} {ticket.price}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--app-foreground-muted)]">
                              {ticket.quantity} tickets available
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--app-foreground-muted)] italic">Tickets enabled but no types added</p>
                    )
                  ) : (
                    <p className="text-sm text-[var(--app-foreground-muted)] italic">No tickets for this event</p>
                  )}
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="mb-4 p-3 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-[var(--app-foreground)]">Transaction Mode</h4>
                    <p className="text-xs text-[var(--app-foreground-muted)]">
                      {useSimpleMode
                        ? "Simple mode: Create event only (tickets can be added later)"
                        : "Advanced mode: Create event + add tickets in sequence"
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseSimpleMode(!useSimpleMode)}
                    className="px-3 py-1 text-xs bg-[var(--app-accent)] text-white rounded hover:bg-[var(--app-accent-hover)] transition-colors"
                  >
                    {useSimpleMode ? "Advanced" : "Simple"}
                  </button>
                </div>
              </div>

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
                          setTransactionStep('complete');
                          setIsSubmitting(false);
                          if (transactionTimeout) {
                            clearTimeout(transactionTimeout);
                            setTransactionTimeout(null);
                          }
                          router.push(`/e/${verification.eventId}`);
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
                            // No tickets to add, complete the process
                            console.log('No tickets to add, completing process');
                            setTransactionStep('complete');
                            setIsSubmitting(false);
                            if (transactionTimeout) {
                              clearTimeout(transactionTimeout);
                              setTransactionTimeout(null);
                            }
                            router.push(`/e/${verification.eventId}`);
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
                          // Tickets added successfully
                          console.log('Tickets added successfully');
                          setTransactionStep('complete');
                          setIsSubmitting(false);
                          if (transactionTimeout) {
                            clearTimeout(transactionTimeout);
                            setTransactionTimeout(null);
                          }
                          router.push(`/e/${createdEventId}`);
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
                    className="w-full px-4 py-2 text-sm text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] underline"
                  >
                    Skip Tickets (Complete Event Creation)
                  </button>
                </div>
              ) : null}

              {/* Connect Wallet */}
              {!isConnected ? (
                <div className="mt-6 p-4 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg">
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-[var(--app-foreground)] mb-2">
                      Connect Your Wallet
                    </h4>
                    <p className="text-xs text-[var(--app-foreground-muted)] mb-4">
                      Connect your wallet to create events on the blockchain.
                    </p>
                    <ConnectWallet />
                  </div>
                </div>
              ) : null}

              {/* Prepare Contract Calls Button */}
              {isConnected && !preparedContracts && (
                <div className="mt-6 p-4 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg">
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-[var(--app-foreground)] mb-2">
                      Step 1: Prepare Event Data
                    </h4>
                    <p className="text-xs text-[var(--app-foreground-muted)] mb-4">
                      Upload your image to IPFS and prepare the contract calls for event creation.
                    </p>
                    <button
                      type="button"
                      onClick={prepareContractCalls}
                      disabled={isPreparing}
                      className="w-full px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg hover:bg-[var(--app-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isPreparing ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Preparing...
                        </div>
                      ) : (
                        "Prepare Contract Calls"
                      )}
                    </button>
                    {verificationStatus && (
                      <div className="mt-2 text-xs text-[var(--app-foreground-muted)]">
                        {verificationStatus}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Prepared Contracts Status */}
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
              )}

              {/* Transaction Progress Indicator */}
              {isSubmitting && (
                <div className="mt-4 p-4 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[var(--app-accent)] rounded-full animate-pulse"></div>
                    <div className="text-sm text-[var(--app-foreground)]">
                      {transactionStep === 'event' && "Creating your event on the blockchain..."}
                      {transactionStep === 'tickets' && "Adding tickets to your event..."}
                      {transactionStep === 'complete' && "Event created successfully!"}
                    </div>
                  </div>
                  {verificationStatus && (
                    <div className="mt-2 text-xs text-[var(--app-foreground-muted)]">
                      {verificationStatus}
                    </div>
                  )}
                  {createdEventId && (
                    <div className="mt-2 text-xs text-[var(--app-foreground-muted)]">
                      Event ID: {createdEventId}
                    </div>
                  )}
                </div>
              )}

              <p className="mt-2 text-center text-xs text-[var(--app-foreground-muted)]">
                <button
                  type="button"
                  onClick={resetTransactionState}
                  className="underline hover:text-[var(--app-foreground)]"
                >
                  Cancel
                </button>
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Static Navigation Buttons at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--app-background)] border-t border-[var(--app-card-border)] p-4 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            variant="outline"
            className="px-4 py-3 border-none bg-transparent hover:bg-black/10"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={handleNextStep}
              className="px-4 py-3 border-none bg-transparent text-foreground hover:bg-black/10"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CreateEventForm;
