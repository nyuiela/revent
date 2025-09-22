"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../DemoComponents";
import { Icon } from "../DemoComponents";
import { ChevronLeftIcon, ChevronRightIcon, Upload, X, Loader2 } from "lucide-react";
import LocationPicker from "../LocationPicker";
import Image from "next/image";
import { EventFormData } from "@/utils/types";
import { generateSlug } from "@/lib/slug-generator";

interface FormStepsProps {
  currentStep: number;
  formData: EventFormData;
  steps: Array<{ id: number; title: string; icon: string }>;
  isAutoFilled: boolean;
  isSubmitting: boolean;
  uploadedFile: File | null;
  previewUrl: string | null;
  uploadError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleInputChange: (field: keyof EventFormData, value: string | number | boolean) => void;
  autoFillMockData: () => void;
  handlePrevStep: () => void;
  handleNextStep: () => void;
  handleFileSelect: (file: File) => void;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeUploadedFile: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
  setIsAutoFilled: React.Dispatch<React.SetStateAction<boolean>>;
  setPreparedContracts: React.Dispatch<React.SetStateAction<any[] | null>>;
  setPreparedTicketContracts: React.Dispatch<React.SetStateAction<any[] | null>>;
  setVerificationStatus: React.Dispatch<React.SetStateAction<string>>;
  checkDomainAvailability: (domain: string) => Promise<boolean>;
  prepareDomainMinting: (eventId: string) => Promise<any[]>;
  handleTicketCreation: (eventId: string) => Promise<any[]>;
  createBatchedTickets: (eventId: string) => any;
  createTicketsSequentially: (eventId: string) => any[];
  verifyEventCreation: (expectedEventData: Record<string, unknown>, maxAttempts?: number) => Promise<any>;
  data: any;
  error: any;
  isLoading: boolean;
  takenDomainSet: Set<string>;
}

const FormSteps: React.FC<FormStepsProps> = ({
  currentStep,
  formData,
  steps,
  isAutoFilled,
  isSubmitting,
  uploadedFile,
  previewUrl,
  uploadError,
  fileInputRef,
  handleInputChange,
  autoFillMockData,
  handlePrevStep,
  handleNextStep,
  handleFileSelect,
  handleFileInputChange,
  removeUploadedFile,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  isDragOver,
  setFormData,
  setIsAutoFilled,
  checkDomainAvailability,
  prepareDomainMinting,
  handleTicketCreation,
  createBatchedTickets,
  createTicketsSequentially,
  verifyEventCreation,
  data,
  error,
  isLoading,
  takenDomainSet,
  setPreparedContracts,
  setPreparedTicketContracts,
  setVerificationStatus,
}) => {
  // Animation state for mobile step transitions
  const [animationDirection, setAnimationDirection] = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedStep, setDisplayedStep] = useState(currentStep);

  // Handle step changes with animation
  useEffect(() => {
    if (displayedStep !== currentStep) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayedStep(currentStep);
        setIsAnimating(false);
        setAnimationDirection(null);
      }, 300); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [currentStep, displayedStep]);

  const handleNextStepWithAnimation = () => {
    setAnimationDirection('next');
    handleNextStep();
  };

  const handlePrevStepWithAnimation = () => {
    setAnimationDirection('prev');
    handlePrevStep();
  };
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

  const eventTypes = [
    "Online",
    "In-Person",
    "Hybrid",
  ];

  return (
    <div className="min-h-screen text-foreground bg-background relative z-[20] pt-14 pb-28">
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideInFromRight {
          0% {
            transform: translateX(128px) rotate(45deg);
            opacity: 0;
          }
          100% {
            transform: translateX(0) rotate(0deg);
            opacity: 1;
          }
        }
        
        @keyframes slideInFromLeft {
          0% {
            transform: translateX(-128px) rotate(-45deg);
            opacity: 0;
          }
          100% {
            transform: translateX(0) rotate(0deg);
            opacity: 1;
          }
        }
        
        .animate-slideInFromRight {
          animation: slideInFromRight 0.3s ease-out forwards;
        }
        
        .animate-slideInFromLeft {
          animation: slideInFromLeft 0.3s ease-out forwards;
        }
      `}</style>
      <div className="max-w-5xl mx-auto py-6 sm:py-8 md:py-10 bg-red-00">
        <div className="min-h-screen bg-[var(--app-background)] relative z-[20] pt-14 pb-28">
          <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 md:py-10">
            {/* Progress Steps */}
            <div className="mb-0">
              {/* Desktop Steps */}
              <div className="hidden md:block">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${currentStep >= step.id
                          ? "bg-[var(--app-accent)] text-white shadow-lg"
                          : "bg-[var(--app-gray)] text-[var(--app-foreground-muted)]"
                          }`}
                      >
                        <Icon name={step.icon as "home" | "share" | "users" | "calendar" | "star" | "plus" | "check"} size="sm" />
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`w-20 h-1 mx-4 rounded-full transition-all duration-300 ${currentStep > step.id ? "bg-[var(--app-accent)]" : "bg-[var(--app-gray)]"
                            }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-6">
                  {steps.map((step) => (
                    <span
                      key={step.id}
                      className={`text-sm font-medium transition-colors ${currentStep >= step.id
                        ? "text-[var(--app-accent)]"
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
                <div className="relative h-32 flex items-center justify-center overflow-hidden">
                  {/* Animated Step Icon Container */}
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Background Glow */}
                    <div className={`absolute inset-0 rounded-full bg-[var(--app-accent)] shadow-lg transition-all duration-300 ${
                      isAnimating ? 'animate-pulse scale-110' : 'animate-pulse'
                    }`}></div>
                    
                    {/* Current Step Icon */}
                    <div className={`relative z-10 w-20 h-20 rounded-full bg-[var(--app-accent)] flex items-center justify-center text-white shadow-xl transition-all duration-300 ${
                      animationDirection === 'next' 
                        ? 'transform -translate-x-32 rotate-45 opacity-0' 
                        : animationDirection === 'prev'
                        ? 'transform translate-x-32 -rotate-45 opacity-0'
                        : 'transform translate-x-0 rotate-0 opacity-100'
                    }`}>
                      <Icon 
                        name={steps[displayedStep - 1]?.icon as "home" | "share" | "users" | "calendar" | "star" | "plus" | "check"} 
                        size="lg" 
                        className="text-white"
                      />
                    </div>

                    {/* Next Step Icon (appears from right when going forward) */}
                    {animationDirection === 'next' && (
                      <div className="absolute z-10 w-20 h-20 rounded-full bg-[var(--app-accent)] flex items-center justify-center text-white shadow-xl animate-slideInFromRight">
                        <Icon 
                          name={steps[currentStep - 1]?.icon as "home" | "share" | "users" | "calendar" | "star" | "plus" | "check"} 
                          size="lg" 
                          className="text-white"
                        />
                      </div>
                    )}

                    {/* Previous Step Icon (appears from left when going backward) */}
                    {animationDirection === 'prev' && (
                      <div className="absolute z-10 w-20 h-20 rounded-full bg-[var(--app-accent)] flex items-center justify-center text-white shadow-xl animate-slideInFromLeft">
                        <Icon 
                          name={steps[currentStep - 1]?.icon as "home" | "share" | "users" | "calendar" | "star" | "plus" | "check"} 
                          size="lg" 
                          className="text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Curved Path Indicator */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path 
                        d="M20,50 Q50,20 80,50" 
                        stroke="var(--app-accent)" 
                        strokeWidth="2" 
                        fill="none"
                        className="transition-all duration-300"
                      />
                    </svg>
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <span className="text-lg font-semibold text-[var(--app-accent)]">
                    Step {displayedStep} of {steps.length}
                  </span>
                  <p className="text-sm text-[var(--app-foreground-muted)] mt-2">
                    {steps[displayedStep - 1]?.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-[var(--app-card-bg)] rounded-2xl p-6 sm:p-8 md:p-10">
              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Auto-fill Mock Data Button */}
                  <div className="mb-6 p-4 bg-[var(--app-gray)] rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--app-foreground)]">Quick Start</h3>
                        <p className="text-xs text-[var(--app-foreground-muted)] mt-1">
                          Fill the form with realistic mock data for testing
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={autoFillMockData}
                          className="px-4 py-2 bg-[var(--app-accent)] text-black dark:text-white text-sm font-medium rounded-lg hover:bg-[var(--app-accent-hover)] transition-colors min-h-[44px] text-nowrap"
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
                                date: '',
                                time: '',
                                isLive: false,
                                platforms: [],
                                totalRewards: 0,
                                eventType: "In-Person",
                                hosts: [],
                                agenda: [],
                                sponsors: [],
                                socialLinks: {},
                                slug: ''
                              });
                              setIsAutoFilled(false);
                              setPreparedContracts(null);
                              setPreparedTicketContracts(null);
                              setVerificationStatus('');
                            }}
                            className="px-4 py-2 bg-[var(--app-gray)] text-[var(--app-foreground)] dark:text-white text-sm font-medium rounded-lg hover:bg-[var(--app-gray-hover)] transition-colors min-h-[44px]"
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
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-[var(--app-foreground)]">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] dark:text-white placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                      placeholder="Enter event title"
                      required
                    />
                  </div>

                  {/* Event Description */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-[var(--app-foreground)]">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] dark:text-white placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors resize-none text-sm"
                      placeholder="Describe your event..."
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-[var(--app-foreground)]">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-4 mt-2 py-3 bg-background border border-border rounded-xl text-[var(--app-foreground)] dark:text-white focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Event Type */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-[var(--app-foreground)]">
                      Event Type *
                    </label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => handleInputChange('eventType', e.target.value)}
                      className="w-full px-4 mt-2 py-3 bg-background border border-border rounded-xl text-[var(--app-foreground)] dark:text-white focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                      required
                    >
                      <option value="">Select a event type</option>
                      {eventTypes.map((eventType) => (
                        <option key={eventType} value={eventType}>{eventType}</option>
                      ))}
                    </select>
                  </div>

                  {/* Event Slug */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-[var(--app-foreground)]">
                      Event Slug
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={formData.slug || ''}
                        onChange={(e) => {
                          const slug = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/-+/g, '-')
                            .trim();
                          handleInputChange('slug', slug);
                        }}
                        className="flex-1 px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] dark:text-white placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                        placeholder="my-awesome-event"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const autoSlug = formData.title
                            .toLowerCase()
                            .replace(/[^a-z0-9\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/-+/g, '-')
                            .trim()
                            .substring(0, 20) || generateSlug();
                          handleInputChange('slug', autoSlug);
                        }}
                        className="px-4 py-3 text-sm bg-[var(--app-gray)] text-[var(--app-foreground)] rounded-lg hover:bg-[var(--app-gray-hover)] transition-colors font-medium"
                      >
                        Auto
                      </button>
                    </div>
                    <p className="text-xs text-[var(--app-foreground-muted)]">
                      A unique identifier for your event URL. Only lowercase letters, numbers, and hyphens allowed.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Event Image */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-[var(--app-foreground)]">
                      Event Image
                    </label>

                    {/* Drag and Drop Upload Area */}
                    <div className="space-y-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      {/* File Preview */}
                      {previewUrl && (
                        <div className="relative">
                          <div className="relative w-full h-52 rounded-xl overflow-hidden border border-[var(--app-border)] bg-[var(--app-background)]">
                            <Image
                              src={previewUrl}
                              alt="Preview"
                              width={100}
                              height={100}
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

                      {/* Upload Status */}
                      {uploadedFile && !formData.image && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-[var(--app-accent)]/10 border border-[var(--app-accent)]/20 rounded-lg">
                          <div className="w-2 h-2 bg-[var(--app-accent)] rounded-full animate-pulse"></div>
                          <span className="text-sm text-[var(--app-accent)] font-medium">
                            Image ready - will upload everything when preparing event
                          </span>
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
                        <div className="space-y-3">
                          <label className="text-xs text-[var(--app-foreground-muted)]">
                            Current Image URL:
                          </label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="text"
                              value={formData.image}
                              onChange={(e) => handleInputChange('image', e.target.value)}
                              className="flex-1 px-4 py-3 bg-[var(--app-background)] border border-[var(--app-border)] rounded-xl text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
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

                      {/* Drag and Drop Zone */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group ${isDragOver
                          ? 'border-[var(--app-accent)] bg-[var(--app-accent)]/10'
                          : 'border-border hover:border-[var(--app-accent)] hover:bg-[var(--app-gray)]/20'
                          }`}
                      >
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200 ${isDragOver
                            ? 'bg-[var(--app-accent)]'
                            : 'bg-[var(--app-gray)] group-hover:bg-[var(--app-accent)]'
                            }`}>
                            <Upload className={`w-8 h-8 transition-colors duration-200 ${isDragOver
                              ? 'text-white'
                              : 'text-[var(--app-foreground-muted)] group-hover:text-white'
                              }`} />
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-[var(--app-foreground)]">
                              {isDragOver ? 'Drop your image here!' : 'Select Event Image'}
                            </h3>
                            <p className="text-sm text-[var(--app-foreground-muted)]">
                              {isDragOver ? (
                                <span className="text-[var(--app-accent)] font-medium">Release to select</span>
                              ) : (
                                <>or <span className="text-[var(--app-accent)] font-medium">click to browse</span></>
                              )}
                            </p>
                            <p className="text-xs text-[var(--app-foreground-muted)]">
                              PNG, JPG, GIF up to 10MB • Will upload everything when preparing event
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Start and End DateTime */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-[var(--app-foreground)]">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startDateTime}
                        onChange={(e) => handleInputChange('startDateTime', e.target.value)}
                        className="w-[90%] px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-[var(--app-foreground)]">
                        End Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endDateTime}
                        onChange={(e) => handleInputChange('endDateTime', e.target.value)}
                        className="w-[90%] px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Location picker with autocomplete + map pin */}
                  <LocationPicker
                    value={{ location: formData.location, coordinates: formData.coordinates }}
                    onChange={(next) => {
                      setFormData(prev => ({ ...prev, location: next.location, coordinates: next.coordinates }));
                    }}
                  />

                  {/* Max Participants */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-[var(--app-foreground)]">
                      Maximum Participants
                    </label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                      min="1"
                      className="w-full px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Existing Hosts */}
                  {formData.hosts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-[var(--app-foreground)]">Current Hosts</h3>
                      {formData.hosts.map((host, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-[var(--app-background)] border border-border rounded-xl dark:bg-black bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[var(--app-accent)] rounded-full flex items-center justify-center">
                              <Icon name="users" size="sm" className="text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-[var(--app-foreground)]">@{host.name}</h4>
                              <p className="text-sm text-[var(--app-foreground-muted)]">{host.role}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newHosts = formData.hosts.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, hosts: newHosts }));
                            }}
                            className="p-3 text-[var(--app-foreground-muted)] hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-50"
                          >
                            <Icon name="x" size="sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Host Form */}
                  <div className="space-y-4 p-6 px-0 rounded-xl ">
                    <h3 className="text-lg font-semibold text-[var(--app-foreground)]">Add New Host</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[var(--app-foreground)]">
                          Address *
                        </label>
                        <input
                          type="text"
                          placeholder="0x..."
                          value={formData.tempHost?.name || ""}
                          onChange={(e) => {
                            const username = e.target.value.replace('@', '');
                            setFormData(prev => ({
                              ...prev,
                              tempHost: { ...prev.tempHost!, name: username }
                            }));
                          }}
                          className="w-full px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[var(--app-foreground)]">
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
                          className="w-full px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
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
                <div className="space-y-6">
                  {/* Existing Agenda Items */}
                  {formData.agenda.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-[var(--app-foreground)]">Current Agenda</h3>
                      {formData.agenda.map((item, index) => (
                        <div key={index} className="p-4 bg-[var(--app-background)] border border-[var(--app-border)] rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-lg text-[var(--app-foreground)]">{item.title}</h4>
                            <button
                              onClick={() => {
                                const newAgenda = formData.agenda.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, agenda: newAgenda }));
                              }}
                              className="p-2 text-[var(--app-foreground-muted)] hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
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
                  <div className="space-y-4 p-6 px-0 bg-[var(--app-gray)] rounded-xl">
                    <h3 className="text-lg font-semibold text-[var(--app-foreground)]">Add New Agenda Item</h3>

                    <div className="space-y-4">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[var(--app-foreground)]">
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
                          className="w-full px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[var(--app-foreground)]">
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
                          className="w-full px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors resize-none text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-[var(--app-foreground)]">
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
                            className="w-[80%] px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                            required
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-[var(--app-foreground)]">
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
                            className="w-[80%] px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[var(--app-foreground)]">
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
                          className="w-full px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
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
                  {/* Ticket Availability Toggle */}
                  <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <Icon name="plus" size="sm" className="text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--app-foreground)]">Tickets Available</h3>
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
                        className="sr-only peer bg-white"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--app-background)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-muted-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-muted"></div>
                    </label>
                  </div>

                  {/* Existing Ticket Types */}
                  {formData.tickets.available && formData.tickets.types.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-black dark:text-white">Current Ticket Types</h3>
                      {formData.tickets.types.map((ticket, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-border rounded-xl bg-white dark:bg-[var(--app-background)] text-black dark:text-white">
                          <div>
                            <h4 className="font-semibold text-[var(--app-foreground)] dark:text-white">{ticket.type}</h4>
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
                            className="p-2 text-[var(--app-foreground-muted)] hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                          >
                            <Icon name="x" size="sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Ticket Type Form */}
                  {formData.tickets.available && (
                    <div className="space-y-4 bg-[var(--app-gray)] rounded-xl">
                      <h3 className="text-lg font-semibold text-[var(--app-foreground)]">Add New Ticket Type</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-[var(--app-foreground)]">
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
                            className="w-full px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-[var(--app-foreground)]">
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
                            className="w-full px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-[var(--app-foreground)]">
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
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
                          >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="ETH">ETH</option>
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-[var(--app-foreground)]">
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
                            className="w-full px-4 py-3 bg-[var(--app-background)] border border-border rounded-xl text-[var(--app-foreground)] focus:border-[var(--app-accent)] focus:outline-none transition-colors text-sm"
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
            </div>
          </div>
        </div>
      </div>

      {/* Static Navigation Buttons at Bottom */}
      <div className="fixed bottom-0 left-0 right-0  border-t border-border p-4 z-50 bg-app-card-bg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            onClick={handlePrevStepWithAnimation}
            disabled={currentStep === 1 || isAnimating}
            variant="outline"
            className="px-6 py-3 border-none text-background-foreground hover:bg-background-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={handleNextStepWithAnimation}
              disabled={isAnimating}
              className="px-6 py-3 bg-[var(--app-accent)] text-background-foreground hover:bg-[var(--app-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FormSteps;
