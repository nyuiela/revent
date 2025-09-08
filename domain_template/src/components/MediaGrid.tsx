"use client";

import { useRef, useState } from "react";

export type MediaItem = {
  id: string;
  url: string;
  file?: File;
  objectUrl?: string;
  title?: string;
  description?: string;
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

  function updateItems(next: MediaItem[]) {
    setItems(next);
    if (setItemsExternal) setItemsExternal(next);
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const added: MediaItem[] = [];
    const toUpload: File[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files.item(i)!;
      const objectUrl = URL.createObjectURL(file);
      added.push({ id: `${Date.now()}-${i}-${file.name}`, url: objectUrl, file, objectUrl });
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

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>{title}</h2>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        style={{
          border: "2px dashed #9ca3af",
          borderRadius: 8,
          padding: 24,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <div>Drag & drop images/videos here</div>
        <div style={{ margin: "8px 0" }}>or</div>
        <label style={{ cursor: "pointer", color: "#2563eb", textDecoration: "underline" }}>
          Select files
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            ref={inputRef}
            onChange={onSelect}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {items.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No media yet. Upload to see previews.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((m) => (
            <div
              key={m.id}
              style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", cursor: "pointer" }}
              onClick={() => setPreview(m)}
            >
              {m.file && m.file.type.startsWith("video") ? (
                <video src={m.url} controls style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
              ) : (
                <img src={m.url} alt="upload" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8 }}>
                <div style={{ fontSize: 12, color: "#374151" }}>{m.title ?? "Untitled"}</div>
                <button
                  onClick={() => onRequestDownload?.(m)}
                  style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #e5e7eb", borderRadius: 6 }}
                >
                  Download
                </button>
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
    </div>
  );
}


