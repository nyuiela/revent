"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "./DemoComponents";
import { ChevronLeftIcon } from "lucide-react";
import { useAccount } from "wagmi";
import { eventAbi, eventAddress, ticketAddress, ticketAbi } from "@/lib/contract";
import { useRouter } from 'next/navigation';
import { EventFormData, EventDetails } from "@/utils/types";
import RegistrationSuccessCard from "./RegistrationSuccessCard";
import { generateSlug } from "@/lib/slug-generator";
import { generateAndUploadTokenMetadata, uploadTokenImageToIPFS } from "@/lib/event-metadata";
import { useQuery } from "@tanstack/react-query";
import { headers, namesQuery, url, getLastEventId, updateLastEventId } from "@/utils/subgraph";
import request from "graphql-request";
import { useNotificationHelpers } from "@/hooks/useNotifications";

// Import the new components
import FormSteps from "./CreateEventForm/FormSteps";
import TransactionHandler from "./CreateEventForm/TransactionHandler";
import EventSummary from "./CreateEventForm/EventSummary";
import { mockEvents } from "@/lib/create-event-data";

const CreateEventForm = () => {
  const { address, isConnected } = useAccount()
  const chainId = 84532;
  const canUseTransaction = Boolean(address && chainId && eventAddress)
  const {
    notifyEventCreationStarted,
    notifyEventCreationSuccess,
    notifyEventCreationError,
    notifyFileUploadStarted,
    notifyFileUploadSuccess,
    notifyFileUploadError,
    notifyIpfsUploadStarted,
    notifyIpfsUploadSuccess,
    notifyIpfsUploadError,
    notifyContractTransactionStarted,
    notifyContractTransactionSuccess,
    notifyContractTransactionError
  } = useNotificationHelpers();

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    date: "",
    time: "",
    startDateTime: "",
    endDateTime: "",
    location: "",
    onlinePlatformLink: "",
    coordinates: { lat: 0, lng: 0 },
    image: "",
    category: "",
    maxParticipants: 100,
    isLive: false,
    platforms: [],
    totalRewards: 0,
    eventType: "In-Person",
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

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [transactionStep, setTransactionStep] = useState<'event' | 'tickets' | 'domain' | 'complete'>('event');
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [preGeneratedEventId, setPreGeneratedEventId] = useState<string | null>(null);
  const [transactionTimeout, setTransactionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [useBatchedMode, setUseBatchedMode] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [createdEventDetails, setCreatedEventDetails] = useState<EventDetails | null>(null);
  const [transactionSuccessful, setTransactionSuccessful] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [preparedContracts, setPreparedContracts] = useState<any[] | null>(null);
  const [preparedTicketContracts, setPreparedTicketContracts] = useState<any[] | null>(null);
  const [preparedDomainContracts, setPreparedDomainContracts] = useState<any[] | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPreparingForTransaction, setIsPreparingForTransaction] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [domainName, setDomainName] = useState<string>('');
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [, setIpfsHash] = useState<string | null>(null);
  const router = useRouter()

  const steps = [
    { id: 1, title: "Basic Info", icon: "home" },
    { id: 2, title: "Details", icon: "share" },
    { id: 3, title: "Hosts", icon: "users" },
    { id: 4, title: "Agenda", icon: "calendar" },
    { id: 5, title: "Tickets", icon: "plus" },
    { id: 6, title: "Review", icon: "check" },
  ];

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transactionTimeout) {
        clearTimeout(transactionTimeout);
      }
    };
  }, [transactionTimeout]);

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

    // Show upload started notification
    notifyFileUploadStarted(uploadedFile.name);

    try {
      // Use the new token image upload function
      const result = await uploadTokenImageToIPFS(uploadedFile);

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update form data with IPFS URL
      setFormData(prev => ({ ...prev, image: result.uri || '' }));

      // Show success notification
      notifyFileUploadSuccess(uploadedFile.name, result.cid);

      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);

      // Show error notification
      notifyFileUploadError(uploadedFile.name, errorMessage);
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

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      } else {
        setUploadError('Please select a valid image file');
      }
    }
  };

  // Function to get the next event ID from The Graph
  const getNextEventId = async (): Promise<string> => {
    try {
      const lastEventId = await getLastEventId();
      const nextEventId = lastEventId + 1;
      console.log('Next event ID will be:', nextEventId);
      return nextEventId.toString();
    } catch (error) {
      console.error('Error getting next event ID:', error);
      // Fallback to timestamp-based ID
      return Date.now().toString();
    }
  };

  // Function to generate and upload token metadata
  const generateAndUploadEventMetadata = async (eventId: string): Promise<string | null> => {
    try {
      console.log('Generating token metadata for:', eventId);

      // Generate and upload token metadata to IPFS
      const result = await generateAndUploadTokenMetadata(eventId, formData);

      if (result.success) {
        console.log('✅ Token metadata uploaded successfully:');
        console.log('  - Token ID:', result.tokenId);
        console.log('  - Metadata URI:', result.metadataUri);
        console.log('  - CID:', result.cid);
        return result.metadataUri || null;
      } else {
        console.error('Failed to upload token metadata:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error generating token metadata:', error);
      return null;
    }
  };

  // Function to create event details from form data
  const createEventDetails = (eventId: string): EventDetails => {
    const startDate = new Date(formData.startDateTime);

    // Transform agenda items to include required id field
    const transformedAgenda = formData.agenda.map((item, index) => ({
      id: `agenda-${index}`,
      title: item.title,
      description: item.description,
      startTime: item.startTime,
      endTime: item.endTime,
      speakers: item.speakers,
    }));

    return {
      id: eventId,
      title: formData.title,
      description: formData.description,
      date: startDate.toLocaleDateString(),
      time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: formData.location,
      onlinePlatformLink: formData.onlinePlatformLink,
      coordinates: formData.coordinates,
      image: formData.image,
      category: formData.category,
      maxParticipants: formData.maxParticipants,
      currentParticipants: 0,
      isLive: formData.isLive,
      platforms: formData.platforms,
      totalRewards: formData.totalRewards,
      participants: [],
      media: [],
      rewards: [],
      agenda: transformedAgenda,
      hosts: formData.hosts,
      sponsors: formData.sponsors,
      socialLinks: formData.socialLinks,
    };
  };

  // Function to reset transaction state
  const resetTransactionState = () => {
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
    setShowSuccessCard(false);
    setCreatedEventDetails(null);
    setTransactionSuccessful(false);
    setIsVerifying(false);
    if (transactionTimeout) {
      clearTimeout(transactionTimeout);
      setTransactionTimeout(null);
    }
  };

  // Function to auto-fill form with mock data
  const autoFillMockData = () => {
    // Pick a random mock event
    const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];

    setFormData({
      title: randomEvent.title,
      description: randomEvent.description,
      category: randomEvent.category,
      location: randomEvent.location,
      onlinePlatformLink: "meet.com/example",
      coordinates: randomEvent.coordinates,
      startDateTime: randomEvent.startDateTime,
      endDateTime: randomEvent.endDateTime,
      maxParticipants: randomEvent.maxParticipants,
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&crop=center",
      tickets: randomEvent.tickets,
      date: randomEvent.date,
      time: randomEvent.time,
      isLive: randomEvent.isLive,
      platforms: randomEvent.platforms,
      totalRewards: randomEvent.totalRewards,
      eventType: randomEvent.eventType,
      hosts: randomEvent.hosts,
      agenda: randomEvent.agenda,
      sponsors: randomEvent.sponsors,
      socialLinks: randomEvent.socialLinks,
      slug: randomEvent.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 20)
    });

    setIsAutoFilled(true);
    console.log('Auto-filled form with mock data:', randomEvent);
  };

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
      let endIso = formData.endDateTime || "";
      // Fallback: if end not provided, default to +3 hours from start
      if (!endIso && startIso) {
        const tentativeEnd = new Date(startIso);
        if (!isNaN(tentativeEnd.getTime())) {
          tentativeEnd.setHours(tentativeEnd.getHours() + 3);
          endIso = tentativeEnd.toISOString();
        }
      }
      if (!startIso || !endIso) {
        throw new Error("Please set both start and end time");
      }
      const startTime = Math.floor(new Date(startIso).getTime() / 1000);
      const endTime = Math.floor(new Date(endIso).getTime() / 1000);
      if (startTime >= endTime) {
        throw new Error("End time must be after start time");
      }

      // Generate a unique slug for this event
      const eventSlug = generateSlug();
      console.log('Generated event slug:', eventSlug);

      // Store the slug in form data for reference
      setFormData(prev => ({ ...prev, slug: eventSlug }));

      // Return a ContractFunctionParameters[] for OnchainKit <Transaction contracts={...}>
      const contracts = [
        {
          abi: eventAbi.abi,
          address: eventAddress as `0x${string}`,
          functionName: "createEvent",
          args: [
            uri, // ipfsHash
            BigInt(startTime), // startTime
            BigInt(endTime), // endTime
            BigInt(formData.maxParticipants), // maxAttendees
            formData.tickets.available ? true : false, // isVIP (default to false, can be made configurable)
            "0x", // data (empty bytes for now)
            eventSlug, // slug
          ],
        },
      ];

      return contracts;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // New function to create a single prepared set for Transaction.
  const createBatchedEventAndTickets = async (_eventId: string) => {
    const contracts = [];
    const eventContract = await handleSubmit();
    contracts.push(...eventContract);
    return contracts;
  };

  // Function to prepare contract calls (upload file, metadata, and prepare transaction)
  const prepareContractCalls = async () => {
    try {
      setIsPreparing(true);
      setVerificationStatus('Preparing event data...');

      // Show event creation started notification
      notifyEventCreationStarted();

      // First, upload the image if one is selected
      if (uploadedFile && !formData.image) {
        setVerificationStatus('Uploading image to IPFS...');
        await handleFileUpload();
      }

      setVerificationStatus('Getting next event ID...');

      // Get the next event ID from The Graph
      const nextEventId = await getNextEventId();
      console.log('Next event ID:', nextEventId);
      setPreGeneratedEventId(nextEventId);

      setVerificationStatus('Uploading event metadata to IPFS...');

      // Upload event metadata to IPFS
      const metadataUri = await generateAndUploadEventMetadata(nextEventId);
      if (!metadataUri) {
        throw new Error('Failed to upload event metadata to IPFS');
      }

      // Update form data with the metadata URI
      setFormData(prev => ({
        ...prev,
        metadataUri: metadataUri
      }));

      setVerificationStatus('Preparing contract calls...');

      // Show IPFS upload started notification
      notifyIpfsUploadStarted();

      // Prepare both event and ticket contracts in one go
      const contracts = await createBatchedEventAndTickets(nextEventId);

      console.log('Prepared batched contract calls:', contracts);
      setPreparedContracts(contracts);
      setVerificationStatus('Contract calls prepared successfully!');

      return contracts;
    } catch (error) {
      console.error('Error preparing contract calls:', error);
      setVerificationStatus('Failed to prepare contract calls');

      // Show error notification
      notifyEventCreationError(error instanceof Error ? error.message : 'Failed to prepare contract calls');
      throw error;
    } finally {
      setIsPreparing(false);
    }
  };

  // Function to handle complete event creation (prepare + execute)
  const handleCreateEvent = async () => {
    try {
      setIsPreparingForTransaction(true);
      setVerificationStatus('Preparing everything for event creation...');

      // First prepare all contracts (image upload, metadata upload, contract preparation)
      await prepareContractCalls();

      setVerificationStatus('Ready to create event! Click the transaction button below.');
    } catch (error) {
      console.error('Error preparing for event creation:', error);
      setVerificationStatus('Failed to prepare for event creation');
    } finally {
      setIsPreparingForTransaction(false);
    }
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

  // Domain-related functionality
  type NamesQueryResult = { names?: { items?: { name: string }[] } }

  const { data, error, isLoading } = useQuery<NamesQueryResult>({
    queryKey: ['domains'],
    queryFn: () => request(url, namesQuery, {}, headers),
  })

  const takenDomainSet = useMemo(() => {
    const items = data?.names?.items || [];
    return new Set(items.map((i) => i.name.toLowerCase()));
  }, [data]);

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
    // Add tickets if any are configured (individual createTicket calls)
    // Note: This uses the old individual createTicket function
    // For batched creation, use createBatchedTickets() which uses createTickets()
    if (formData.tickets.available && formData.tickets.types.length > 0) {
      for (const ticketType of formData.tickets.types) {
        ticketContracts.push({
          abi: ticketAbi.abi,
          address: ticketAddress as `0x${string}`,
          functionName: "createTicket",
          args: [
            BigInt(eventId), // eventId
            ticketType.type, // name
            ticketType.type, // ticketType
            BigInt(ticketType.price * 1000000000000000000), // price (Convert to wei)
            ticketType.currency, // currency
            BigInt(ticketType.quantity), // totalQuantity
            ticketType.perks || [] // perks
          ],
        });
      }
    }

    return ticketContracts;
  };

  // Function to create batched tickets using the new createTickets function
  // This uses the new function signature:
  // createTickets(uint256 eventId, string[] memory name, string[] memory ticketType, 
  //               uint256[] memory price, string[] memory currency, uint256[] memory totalQuantity, 
  //               string[][] memory perks)
  const createBatchedTickets = (eventId: string) => {
    if (!formData.tickets.available || formData.tickets.types.length === 0) {
      return null;
    }

    // Prepare arrays for the createTickets function
    const names: string[] = [];
    const ticketTypes: string[] = [];
    const prices: bigint[] = [];
    const currencies: string[] = [];
    const totalQuantities: bigint[] = [];
    const perks: string[][] = [];

    // Populate arrays from form data
    for (const ticketType of formData.tickets.types) {
      names.push(ticketType.type);
      ticketTypes.push(ticketType.type);
      prices.push(BigInt(ticketType.price * 1000000000000000000)); // Convert to wei
      currencies.push(ticketType.currency);
      totalQuantities.push(BigInt(ticketType.quantity));
      perks.push(ticketType.perks || []);
    }

    return {
      abi: ticketAbi.abi,
      address: ticketAddress as `0x${string}`,
      functionName: "createTickets",
      args: [
        BigInt(eventId), // eventId
        names, // name[]
        ticketTypes, // ticketType[]
        prices, // price[]
        currencies, // currency[]
        totalQuantities, // totalQuantity[]
        perks // perks[][]
      ],
    };
  };

  // Function to create tickets sequentially using the new createTickets function
  const createTicketsSequentially = (eventId: string) => {
    if (!formData.tickets.available || formData.tickets.types.length === 0) {
      return [];
    }

    // Use the batched function for sequential creation too
    const batchedContract = createBatchedTickets(eventId);
    return batchedContract ? [batchedContract] : [];
  };

  return (
    <>
      <div className="absolute top-4 left-4 z-[20]">
        <Button variant="ghost" onClick={() => router.back()}>
          <ChevronLeftIcon className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Form Steps Component */}
      {currentStep < 7 && (
        <FormSteps
          currentStep={currentStep}
          formData={formData}
          steps={steps}
          isAutoFilled={isAutoFilled}
          isSubmitting={isSubmitting}
          uploadedFile={uploadedFile}
          previewUrl={previewUrl}
          uploadError={uploadError}
          fileInputRef={fileInputRef}
          handleInputChange={handleInputChange}
          autoFillMockData={autoFillMockData}
          handlePrevStep={handlePrevStep}
          handleNextStep={handleNextStep}
          handleFileSelect={handleFileSelect}
          handleFileInputChange={handleFileInputChange}
          removeUploadedFile={removeUploadedFile}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          isDragOver={isDragOver}
          setFormData={setFormData}
          setIsAutoFilled={setIsAutoFilled}
          setPreparedContracts={setPreparedContracts}
          setPreparedTicketContracts={setPreparedTicketContracts}
          setVerificationStatus={setVerificationStatus}
          checkDomainAvailability={checkDomainAvailability}
          prepareDomainMinting={prepareDomainMinting}
          handleTicketCreation={handleTicketCreation}
          createBatchedTickets={createBatchedTickets}
          createTicketsSequentially={createTicketsSequentially}
          verifyEventCreation={verifyEventCreation}
          data={data}
          error={error}
          isLoading={isLoading}
          takenDomainSet={takenDomainSet}
        />
      )}

      {/* Review Step with Event Summary and Transaction Handler */}
      {currentStep === 6 && (
        <div className="min-h-screen text-foreground bg-background relative z-[20] pt-14 pb-28">
          <div className="max-w-5xl mx-auto py-6 sm:py-8 md:py-10 bg-red-00">
            <div className="min-h-screen bg-[var(--app-background)] relative z-[20] pt-14 pb-28">
              <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 md:py-10">
                <div className="bg-[var(--app-card-bg)] rounded-2xl p-6 sm:p-8 md:p-10">
                  <EventSummary
                    formData={formData}
                    isConnected={isConnected}
                    canUseTransaction={canUseTransaction}
                    preparedContracts={preparedContracts}
                    useBatchedMode={useBatchedMode}
                    isPreparingForTransaction={isPreparingForTransaction}
                    verificationStatus={verificationStatus}
                    isSubmitting={isSubmitting}
                    transactionSuccessful={transactionSuccessful}
                    isVerifying={isVerifying}
                    transactionStep={transactionStep}
                    createdEventId={createdEventId}
                    setUseBatchedMode={setUseBatchedMode}
                    handleCreateEvent={handleCreateEvent}
                    resetTransactionState={resetTransactionState}
                    notifyEventCreationStarted={notifyEventCreationStarted}
                  />

                  <TransactionHandler
                    isConnected={isConnected}
                    canUseTransaction={canUseTransaction}
                    chainId={chainId}
                    address={address}
                    showWalletModal={false}
                    preparedContracts={preparedContracts}
                    isSubmitting={isSubmitting}
                    transactionStep={transactionStep}
                    verificationStatus={verificationStatus}
                    createdEventId={createdEventId}
                    preGeneratedEventId={preGeneratedEventId}
                    formData={formData}
                    setShowWalletModal={() => { }}
                    setTransactionSuccessful={setTransactionSuccessful}
                    setIsSubmitting={setIsSubmitting}
                    setCreatedEventId={setCreatedEventId}
                    setShowSuccessCard={setShowSuccessCard}
                    setCreatedEventDetails={setCreatedEventDetails}
                    setTransactionStep={setTransactionStep}
                    createEventDetails={createEventDetails}
                    generateAndUploadEventMetadata={generateAndUploadEventMetadata}
                    updateLastEventId={updateLastEventId}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Card */}
      {showSuccessCard && createdEventDetails && (
        <RegistrationSuccessCard
          event={createdEventDetails}
          onClose={() => {
            setShowSuccessCard(false);
            setCreatedEventDetails(null);
            // Navigate to the event page after closing
            // if (createdEventId) {
            //   router.push(`/${formData.slug || createdEventId}`);
            // }
          }}
        />
      )}


    </>
  );
};

export default CreateEventForm;
