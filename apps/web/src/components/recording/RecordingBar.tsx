// apps/web/components/recording/RecordingBar.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRecorder } from "./useRecorder";
import { useRecordingUpload } from "@/hooks/meeting/useuploadMeeting";
import { Warp } from "@paper-design/shaders-react";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface RecordingBarProps {
  onUploadSuccess?: (meetingId: string) => void;
  onDismiss?: () => void;
}

export function RecordingBar({ onUploadSuccess, onDismiss }: RecordingBarProps) {
  const {
    recordingState,
    startRecording,
    stopRecording,
    result,
    error: recorderError,
    durationSeconds,
  } = useRecorder();

  const {
    upload,
    cancel: cancelUpload,
    isUploading,
    isSuccess,
    isError: isUploadError,
    meetingId,
    error: uploadError,
    reset: resetUpload,
  } = useRecordingUpload({
    onSuccess: (data) => onUploadSuccess?.(data.meetingId),
  });

  const uploadedBlobRef = useRef<Blob | null>(null);
  useEffect(() => {
    if (result?.blob && result.blob.size > 0 && result.blob !== uploadedBlobRef.current) {
      uploadedBlobRef.current = result.blob;
      upload(result.blob);
    }
  }, [result, upload]);

  useEffect(() => {
    if (recordingState === "recording") {
      uploadedBlobRef.current = null;
      resetUpload();
    }
  }, [recordingState, resetUpload]);

  useEffect(() => () => cancelUpload(), [cancelUpload]);

  const isIdle       = recordingState === "idle" && !isUploading && !isSuccess;
  const isRecording  = recordingState === "recording";
  const isProcessing = recordingState === "stopped" && isUploading;
  const isDone       = isSuccess;
  const hasError     = recordingState === "error" || isUploadError;
  const errorMessage = recorderError ?? uploadError?.message ?? null;
  const startDisabled = isRecording || isUploading || isSuccess;
  const stopDisabled  = !isRecording;
  const canDismiss    = isIdle || isDone || hasError;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-lg px-4">

      {/* ── Upper hint banner — original dark style, untouched ── */}
      {isIdle && (
        <div className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 backdrop-blur px-4 py-3 text-center space-y-1">
          <p className="text-sm text-zinc-400">
            Press <span className="text-white font-medium">Start Recording</span>,
            pick your <span className="text-white font-medium">meeting tab</span>,
            and check <span className="text-white font-medium">"Share tab audio"</span>.
          </p>
          <p className="text-xs text-amber-500/80">
            Do not close or refresh this page while recording or uploading.
          </p>
        </div>
      )}

      {/* ── Bottom pill bar — Warp shader background only here ── */}
      <div
        className="relative w-full rounded-full overflow-hidden"
        style={{
          boxShadow: "0 0 32px rgba(100,80,255,0.35), 0 0 64px rgba(0,220,180,0.15), 0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Warp shader — only this bar */}
        <div className="absolute inset-0">
          <Warp
            style={{ width: "100%", height: "100%" }}
            proportion={0.45}
            softness={1}
            distortion={isRecording ? 0.6 : 0.25}
            swirl={isRecording ? 1.2 : 0.8}
            swirlIterations={10}
            shape="checks"
            shapeScale={0.1}
            scale={1}
            rotation={0}
            speed={isRecording ? 2 : 1}
            colors={
              isRecording
                ? ["hsl(0,90%,45%)", "hsl(280,100%,50%)", "hsl(320,100%,55%)", "hsl(20,100%,55%)"]
                : isDone
                ? ["hsl(158,99%,40%)", "hsl(170,90%,45%)", "hsl(140,80%,50%)", "hsl(200,90%,55%)"]
                : hasError
                ? ["hsl(0,90%,45%)", "hsl(15,100%,50%)", "hsl(340,80%,50%)", "hsl(0,70%,35%)"]
                : [
                    "hsl(203,100%,62%)",
                    "hsl(255,100%,72%)",
                    "hsl(158,99%,59%)",
                    "hsl(264,100%,61%)",
                  ]
            }
          />
        </div>

        {/* Scrim for text legibility */}
        <div className="absolute inset-0 bg-black/25" />

        {/* Gloss sheen on top half */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

        {/* Bar content */}
        <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-3">

          {/* Status */}
          <div className="flex items-center gap-2 min-w-0">
            {isRecording && (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
            {isProcessing && <SpinnerIcon className="text-cyan-200 shrink-0" />}

            <span className={`text-sm font-semibold truncate drop-shadow ${
              isRecording   ? "text-red-200"
              : isDone      ? "text-emerald-200"
              : isProcessing ? "text-cyan-200"
              : "text-white"
            }`}>
              {isRecording   ? `● Recording — ${formatDuration(durationSeconds)}`
              : isProcessing ? "Uploading…"
              : isDone       ? "✓ Uploaded — meeting ready"
              : hasError     ? "Something went wrong"
              :                "Ready to record"}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isRecording ? (
              <button
                onClick={stopRecording}
                disabled={stopDisabled}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold bg-red-600/90 hover:bg-red-500 text-white border border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg"
              >
                <StopIcon /> Stop
              </button>
            ) : isProcessing ? (
              <button
                onClick={cancelUpload}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all backdrop-blur-sm shadow-lg"
              >
                Cancel
              </button>
            ) : isDone ? (
              <button
                onClick={() => resetUpload()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold bg-emerald-500/80 hover:bg-emerald-400/90 text-white border border-white/20 transition-all backdrop-blur-sm shadow-lg"
              >
                <CheckIcon /> Done
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={startDisabled}
                className="flex items-center gap-1.5 px-5 py-1.5 rounded-full text-sm font-bold bg-white hover:bg-white/90 text-purple-900 border border-white/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
                style={{ boxShadow: "0 2px 16px rgba(196,132,252,0.4)" }}
              >
                <MicIcon /> Start Recording
              </button>
            )}

            {canDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                aria-label="Dismiss"
                className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white/70 hover:text-white transition-all backdrop-blur-sm"
              >
                <XIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Sub-messages ── */}
      {isProcessing && result && (
        <p className="text-xs text-zinc-500 text-center">
          Sending {formatBytes(result.blob!.size)} to server…
        </p>
      )}
      {isDone && meetingId && (
        <p className="text-xs text-emerald-500/80 text-center font-mono">
          Meeting ID: {meetingId}
        </p>
      )}
      {hasError && errorMessage && (
        <div className="w-full flex items-center justify-between gap-3 bg-red-950/60 border border-red-800/60 px-4 py-2 rounded-xl backdrop-blur-sm">
          <p className="text-xs text-red-400 flex-1">{errorMessage}</p>
          {isUploadError && result?.blob && (
            <button
              onClick={() => { resetUpload(); upload(result.blob!); }}
              className="text-xs text-red-300 hover:text-white font-bold underline underline-offset-2 shrink-0 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  );
}
function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className ?? ""}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}