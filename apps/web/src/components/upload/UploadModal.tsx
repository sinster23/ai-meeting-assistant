// apps/web/components/upload/UploadModal.tsx

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUploadMeeting } from "@/hooks/meeting/useuploadMeeting";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

const ACCEPTED_TYPES: Record<string, string> = {
  "audio/mp3":  ".mp3",
  "audio/mpeg": ".mp3",
  "audio/wav":  ".wav",
  "audio/webm": ".webm",
  "audio/m4a":  ".m4a",
  "audio/mp4":  ".m4a",
  "video/mp4":  ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".webm", ".m4a", ".mp4", ".mov"];
const MAX_SIZE_MB = 100;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const mimeBase = file.type.split(";")[0].trim();
  const mimeOk = Object.keys(ACCEPTED_TYPES).includes(mimeBase);
  const extOk = ACCEPTED_EXTENSIONS.includes(ext);

  if (!mimeOk && !extOk) {
    return `Unsupported format. Please upload ${ACCEPTED_EXTENSIONS.join(", ")}`;
  }
  if (file.size === 0) return "File is empty.";
  if (file.size > MAX_SIZE_BYTES) return `File exceeds ${MAX_SIZE_MB} MB limit (${formatBytes(file.size)}).`;
  return null;
}

interface UploadModalProps {
  onClose: () => void;
}

export function UploadModal({ onClose }: UploadModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { mutate: upload, isPending, isError, error: uploadError, reset } = useUploadMeeting({
    onSuccess: (data) => {
      router.push(`/dashboard/meetings/${data.meetingId}`);
      onClose();
    },
  });

  // Fake progress animation while uploading (real progress needs XHR)
  useEffect(() => {
    if (!isPending) { setUploadProgress(0); return; }
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 85) { clearInterval(interval); return p; }
        return p + Math.random() * 12;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [isPending]);

  const handleFile = useCallback((file: File) => {
    reset();
    const err = validateFile(file);
    if (err) { setValidationError(err); setSelectedFile(null); return; }
    setValidationError(null);
    setSelectedFile(file);
  }, [reset]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    upload(selectedFile);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isPending) onClose();
  };

  const errorMessage = validationError ?? (uploadError?.message ?? null);

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200,
        fontFamily: font,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "32px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* Close */}
        {!isPending && (
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: "16px", right: "16px",
              width: "28px", height: "28px",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #e8e8e8", borderRadius: "8px",
              background: "#f5f5f5", cursor: "pointer", color: "#888",
              fontSize: "16px", lineHeight: 1,
            }}
          >
            ×
          </button>
        )}

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{
            fontSize: "17px", fontWeight: "700", color: "#111",
            letterSpacing: "-0.025em", margin: "0 0 5px", fontFamily: font,
          }}>
            Import Audio or Video
          </h2>
          <p style={{ fontSize: "13px", color: "#999", margin: 0, fontFamily: font }}>
            Zoom recordings, interviews, voice memos — anything goes.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => !isPending && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? "#111" : selectedFile ? "#16a34a" : "#e0e0e0"}`,
            borderRadius: "14px",
            padding: "36px 24px",
            textAlign: "center",
            cursor: isPending ? "default" : "pointer",
            transition: "all 0.18s",
            background: dragging ? "#f8f8f8" : selectedFile ? "#f0fdf4" : "#fafafa",
            marginBottom: "16px",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            onChange={handleInputChange}
            style={{ display: "none" }}
          />

          {isPending ? (
            <UploadingState progress={uploadProgress} fileName={selectedFile?.name ?? ""} />
          ) : selectedFile ? (
            <SelectedFileState file={selectedFile} onClear={() => { setSelectedFile(null); reset(); }} />
          ) : (
            <EmptyDropState />
          )}
        </div>

        {/* Error */}
        {errorMessage && !isPending && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "8px",
            padding: "10px 12px", borderRadius: "8px",
            background: "#fff1f1", border: "1px solid #fecaca",
            marginBottom: "16px",
          }}>
            <span style={{ fontSize: "13px", color: "#dc2626", fontFamily: font, lineHeight: 1.5 }}>
              ⚠ {errorMessage}
            </span>
          </div>
        )}

        {/* Format hint */}
        {!selectedFile && !isPending && (
          <p style={{ fontSize: "11px", color: "#bbb", textAlign: "center", fontFamily: font, margin: "0 0 20px" }}>
            Supports {ACCEPTED_EXTENSIONS.join(" · ")} · Max {MAX_SIZE_MB} MB
          </p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          {!isPending && (
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "10px 0",
                fontSize: "13px", fontWeight: "500", fontFamily: font,
                border: "1px solid #e8e8e8", borderRadius: "10px",
                background: "#fff", color: "#555", cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isPending}
            style={{
              flex: 2, padding: "10px 0",
              fontSize: "13px", fontWeight: "600", fontFamily: font,
              border: "none", borderRadius: "10px",
              background: !selectedFile || isPending ? "#d0d0d0" : "#111",
              color: !selectedFile || isPending ? "#999" : "#fff",
              cursor: !selectedFile || isPending ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {isPending ? "Uploading…" : "Upload & Process"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-states ─────────────────────────────────────────────────────────────

function EmptyDropState() {
  return (
    <>
      <div style={{
        width: "48px", height: "48px", borderRadius: "14px",
        background: "#f0f0f0",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <p style={{ fontSize: "14px", fontWeight: "600", color: "#333", fontFamily: font, margin: "0 0 5px" }}>
        Drop your file here
      </p>
      <p style={{ fontSize: "13px", color: "#bbb", fontFamily: font, margin: 0 }}>
        or <span style={{ color: "#111", fontWeight: "500", textDecoration: "underline" }}>browse files</span>
      </p>
    </>
  );
}

function SelectedFileState({ file, onClear }: { file: File; onClear: () => void }) {
  const isVideo = file.type.startsWith("video/");
  return (
    <>
      <div style={{
        width: "48px", height: "48px", borderRadius: "14px",
        background: "#dcfce7",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px",
      }}>
        {isVideo
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
        }
      </div>
      <p style={{ fontSize: "14px", fontWeight: "600", color: "#111", fontFamily: font, margin: "0 0 4px", wordBreak: "break-all" }}>
        {file.name}
      </p>
      <p style={{ fontSize: "12px", color: "#16a34a", fontFamily: font, margin: "0 0 10px" }}>
        {formatBytes(file.size)} · Ready to upload
      </p>
      <button
        onClick={(e) => { e.stopPropagation(); onClear(); }}
        style={{
          fontSize: "12px", color: "#999", fontFamily: font,
          background: "none", border: "none", cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Choose a different file
      </button>
    </>
  );
}

function UploadingState({ progress, fileName }: { progress: number; fileName: string }) {
  return (
    <>
      <div style={{
        width: "48px", height: "48px", borderRadius: "14px",
        background: "#f0f0f0",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px",
      }}>
        <SpinnerSVG size={22} />
      </div>
      <p style={{ fontSize: "14px", fontWeight: "600", color: "#111", fontFamily: font, margin: "0 0 4px" }}>
        Uploading…
      </p>
      <p style={{ fontSize: "12px", color: "#999", fontFamily: font, margin: "0 0 16px", wordBreak: "break-all" }}>
        {fileName}
      </p>
      {/* Progress bar */}
      <div style={{
        width: "100%", maxWidth: "240px", height: "4px",
        background: "#e8e8e8", borderRadius: "4px",
        margin: "0 auto", overflow: "hidden",
      }}>
        <div style={{
          width: `${Math.min(progress, 100)}%`,
          height: "100%",
          background: "#111",
          borderRadius: "4px",
          transition: "width 0.4s ease",
        }} />
      </div>
    </>
  );
}

function SpinnerSVG({ size = 16 }: { size?: number }) {
  return (
    <svg
      style={{ animation: "spin 0.75s linear infinite", display: "block" }}
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="#999" strokeWidth="2.5"
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}