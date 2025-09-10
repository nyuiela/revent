"use client";

import { useRef, useState } from "react";
import MediaCard from "./MediaCard";
import Image from "next/image";

export type MediaItem = {
  id: string;
  url: string;
  file?: File;
  objectUrl?: string;
  title?: string;
  description?: string;
  price?: number;
  accessRights?: 'read' | 'write' | 'ownership';
  ipfsHash?: string;
  owner?: string;
  createdAt?: number;
  requests?: PermissionRequest[];
};

export type PermissionRequest = {
  id: string;
  requester: string;
  amount: number;
  accessRights: 'read' | 'write' | 'ownership';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
};

type MediaGridProps = {
  items?: MediaItem[];
  setItemsExternal?: (items: MediaItem[]) => void;
  onUploadFiles?: (files: File[]) => Promise<void> | void; // e.g., upload to IPFS
  onRequestDownload?: (item: MediaItem) => Promise<void> | void; // permission trading hook
  title?: string;
};

export default function MediaGrid({
  items: initialItems,
  setItemsExternal,
  onUploadFiles,
  onRequestDownload,
  title = "Event Media",
}: MediaGridProps) {
  const [items, setItems] = useState<MediaItem[]>(initialItems ?? []);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showMediaCard, setShowMediaCard] = useState(false);

  function updateItems(next: MediaItem[]) {
    setItems(next);
    if (setItemsExternal) setItemsExternal(next);
  }

  const generateIntelligentName = (file: File): string => {
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const fileType = file.type.startsWith('video') ? 'Video' : 'Image';
    const quality = file.size > 5 * 1024 * 1024 ? 'HD' : file.size > 1 * 1024 * 1024 ? 'SD' : 'Low';
    const randomId = Math.random().toString(36).substring(2, 8);
    
    return `${fileType}_${quality}_${timestamp.replace(/[^\w\s]/g, '')}_${randomId}`;
  };

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const added: MediaItem[] = [];
    const toUpload: File[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files.item(i)!;
      const objectUrl = URL.createObjectURL(file);
      const intelligentName = generateIntelligentName(file);
      added.push({ 
        id: `${Date.now()}-${i}-${file.name}`, 
        url: objectUrl, 
        file, 
        objectUrl,
        title: intelligentName,
        price: 0,
        accessRights: 'read',
        owner: 'You',
        createdAt: Date.now(),
        requests: []
      });
      toUpload.push(file);
    }
    updateItems([...added, ...items]);
    if (onUploadFiles) onUploadFiles(toUpload);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  }

  const handleMediaClick = (media: MediaItem) => {
    setSelectedMedia(media);
    setShowMediaCard(true);
  };

  const handleUpdateMedia = (updatedMedia: MediaItem) => {
    const updatedItems = items.map(item => 
      item.id === updatedMedia.id ? updatedMedia : item
    );
    updateItems(updatedItems);
  };

  const handleSelectMedia = (media: MediaItem) => {
    setSelectedMedia(media);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>{title}</h2>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center mb-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200 bg-gray-50 dark:bg-gray-800"
      >
        <div className="text-gray-600 dark:text-gray-300 mb-2">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Upload Media</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Drag & drop images/videos here or click to select</div>
        <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors duration-200">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Select Files
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            ref={inputRef}
            onChange={onSelect}
            className="hidden"
          />
        </label>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No media yet. Upload to see previews.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((m) => (
            <div
              key={m.id}
              className="relative bg-white dark:bg-gray-600 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-500 cursor-pointer hover:shadow-lg transition-shadow duration-200 group"
              onClick={() => handleMediaClick(m)}
            >
              <div className="aspect-square overflow-hidden">
                {m.file && m.file.type.startsWith("video") ? (
                  <video 
                    src={m.url} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                  />
                ) : (
                  <Image 
                    src={m.url} 
                    alt={m.title} 
                    width={100}
                    height={100}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                  />
                )}
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                  {m.title ?? "Untitled"}
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {m.price} ETH
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDownload?.(m);
                    }}
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    Trade
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreview(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", width: "min(960px, 96vw)", maxHeight: "90vh", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            <div style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: 600 }}>{preview.title ?? "Preview"}</div>
              <button onClick={() => setPreview(null)} style={{ padding: "4px 8px", border: "1px solid #e5e7eb", borderRadius: 6 }}>Close</button>
            </div>
            <div style={{ padding: 12, overflow: "auto" }}>
              {preview.file && preview.file.type.startsWith("video") ? (
                <video src={preview.url} controls style={{ width: "100%", maxHeight: 520, display: "block" }} />
              ) : (
                <img src={preview.url} alt={preview.title ?? "preview"} style={{ width: "100%", height: "auto", display: "block" }} />
              )}
            </div>
            <div style={{ padding: 12, borderTop: "1px solid #e5e7eb", display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => onRequestDownload?.(preview)}
                style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6 }}
              >
                Download
              </button>
              <button
                onClick={() => onRequestDownload?.(preview)}
                style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#ecfeff" }}
              >
                Permission Trade
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaCard
        isOpen={showMediaCard}
        onClose={() => setShowMediaCard(false)}
        media={selectedMedia}
        allMedia={items}
        onUpdateMedia={handleUpdateMedia}
        onSelectMedia={handleSelectMedia}
      />
    </div>
  );
}


