// apps/web/components/upload/UploadModal.tsx

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUploadMeeting } from "@/hooks/meeting/useuploadMeeting";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

// ── Purple palette — mirrors meetings page ────────────────────────────────

const purple = {
  50:  "#EEEDFE",
  100: "#CECBF6",
  200: "#AFA9EC",
  400: "#7F77DD",
  600: "#534AB7",
  800: "#3C3489",
  900: "#26215C",
};

// ── File validation ───────────────────────────────────────────────────────

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

// ── Spinner ───────────────────────────────────────────────────────────────

function SpinnerSVG({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg
      style={{ animation: "spin 0.75s linear infinite", display: "block" }}
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color ?? purple[400]} strokeWidth="2.5"
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────

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

  // Drop zone border color
  const dropBorderColor = dragging
    ? purple[600]
    : selectedFile
    ? "#16a34a"
    : purple[100];

  const dropBg = dragging
    ? purple[50]
    : selectedFile
    ? "#f0fdf4"
    : "#fafafe";

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(38,33,92,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200,
        fontFamily: font,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: `0 24px 80px rgba(38,33,92,0.22), 0 0 0 1px ${purple[100]}`,
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
              border: `1px solid ${purple[100]}`, borderRadius: "8px",
              background: purple[50], cursor: "pointer", color: purple[400],
              fontSize: "16px", lineHeight: 1,
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = purple[100];
              e.currentTarget.style.borderColor = purple[200];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = purple[50];
              e.currentTarget.style.borderColor = purple[100];
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
          <p style={{ fontSize: "13px", color: purple[400], margin: 0, fontFamily: font }}>
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
            border: `2px dashed ${dropBorderColor}`,
            borderRadius: "14px",
            padding: "36px 24px",
            textAlign: "center",
            cursor: isPending ? "default" : "pointer",
            transition: "all 0.18s",
            background: dropBg,
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
            padding: "10px 12px", borderRadius: "10px",
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
          <p style={{ fontSize: "11px", color: purple[200], textAlign: "center", fontFamily: font, margin: "0 0 20px" }}>
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
                border: `1px solid ${purple[100]}`, borderRadius: "10px",
                background: "#fff", color: purple[600], cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = purple[50];
                e.currentTarget.style.borderColor = purple[200];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = purple[100];
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
              background: !selectedFile || isPending ? purple[100] : purple[600],
              color: !selectedFile || isPending ? purple[200] : "#fff",
              cursor: !selectedFile || isPending ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              boxShadow: !selectedFile || isPending ? "none" : `0 1px 3px rgba(83,74,183,0.25)`,
            }}
            onMouseEnter={(e) => {
              if (selectedFile && !isPending) {
                e.currentTarget.style.background = purple[800];
                e.currentTarget.style.boxShadow = `0 2px 6px rgba(83,74,183,0.35)`;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedFile && !isPending) {
                e.currentTarget.style.background = purple[600];
                e.currentTarget.style.boxShadow = `0 1px 3px rgba(83,74,183,0.25)`;
              }
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
        background: purple[50],
        border: `1px solid ${purple[100]}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <p style={{ fontSize: "14px", fontWeight: "600", color: "#333", fontFamily: font, margin: "0 0 5px" }}>
        Drop your file here
      </p>
      <p style={{ fontSize: "13px", color: purple[400], fontFamily: font, margin: 0 }}>
        or <span style={{ color: purple[600], fontWeight: "600", textDecoration: "underline" }}>browse files</span>
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
          fontSize: "12px", color: purple[400], fontFamily: font,
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
        background: purple[50],
        border: `1px solid ${purple[100]}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px",
      }}>
        <SpinnerSVG size={22} />
      </div>
      <p style={{ fontSize: "14px", fontWeight: "600", color: "#111", fontFamily: font, margin: "0 0 4px" }}>
        Uploading…
      </p>
      <p style={{ fontSize: "12px", color: purple[400], fontFamily: font, margin: "0 0 16px", wordBreak: "break-all" }}>
        {fileName}
      </p>
      {/* Progress bar */}
      <div style={{
        width: "100%", maxWidth: "240px", height: "4px",
        background: purple[100], borderRadius: "4px",
        margin: "0 auto", overflow: "hidden",
      }}>
        <div style={{
          width: `${Math.min(progress, 100)}%`,
          height: "100%",
          background: purple[600],
          borderRadius: "4px",
          transition: "width 0.4s ease",
        }} />
      </div>
    </>
  );
}