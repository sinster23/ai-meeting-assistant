// apps/web/components/recording/RecordingBar.tsx
// Only change from original: imports useRecordingUpload instead of useUploadMeeting

"use client";

import { useEffect, useRef } from "react";
import { useRecorder } from "./useRecorder";
import { useRecordingUpload } from "@/hooks/meeting/useuploadMeeting";

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

  const isIdle = recordingState === "idle" && !isUploading && !isSuccess;
  const isRecording = recordingState === "recording";
  const isProcessing = recordingState === "stopped" && isUploading;
  const isDone = isSuccess;
  const hasError = recordingState === "error" || isUploadError;
  const errorMessage = recorderError ?? uploadError?.message ?? null;
  const startDisabled = isRecording || isUploading || isSuccess;
  const stopDisabled = !isRecording;
  const canDismiss = isIdle || isDone || hasError;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-lg px-4">
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

      <div className={`flex items-center gap-3 px-5 py-3 rounded-full border shadow-2xl transition-all duration-300 w-full justify-between ${isRecording ? "bg-red-950 border-red-700 shadow-red-900/40" : isDone ? "bg-zinc-900 border-emerald-700" : hasError ? "bg-zinc-900 border-red-800" : "bg-zinc-900 border-zinc-700"}`}>
        <div className="flex items-center gap-2 min-w-0">
          {isRecording && (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
          )}
          {isProcessing && <SpinnerIcon className="text-blue-400 shrink-0" />}
          <span className={`text-sm font-medium truncate ${isRecording ? "text-red-300" : isDone ? "text-emerald-400" : isProcessing ? "text-blue-300" : "text-zinc-300"}`}>
            {isRecording ? `● Recording — ${formatDuration(durationSeconds)}` : isProcessing ? "Uploading…" : isDone ? "✓ Uploaded — meeting ready" : hasError ? "Something went wrong" : "Ready to record"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isRecording ? (
            <button onClick={stopRecording} disabled={stopDisabled} aria-label="Stop recording" className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed">
              <StopIcon /> Stop
            </button>
          ) : isProcessing ? (
            <button onClick={cancelUpload} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-all duration-200">
              Cancel
            </button>
          ) : isDone ? (
            <button onClick={() => resetUpload()} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition-all duration-200">
              <CheckIcon /> Done
            </button>
          ) : (
            <button onClick={startRecording} disabled={startDisabled} aria-label="Start recording" className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-white hover:bg-zinc-100 text-zinc-900 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed">
              <MicIcon /> Start Recording
            </button>
          )}
          {canDismiss && onDismiss && (
            <button onClick={onDismiss} aria-label="Dismiss recording bar" className="flex items-center justify-center w-7 h-7 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-all duration-200">
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {isProcessing && result && (
        <p className="text-xs text-zinc-500 text-center">Sending {formatBytes(result.blob!.size)} to server…</p>
      )}
      {isDone && meetingId && (
        <p className="text-xs text-emerald-500/80 text-center font-mono">Meeting ID: {meetingId}</p>
      )}
      {hasError && errorMessage && (
        <div className="w-full flex items-center justify-between gap-3 bg-red-950/60 border border-red-800/60 px-4 py-2 rounded-xl">
          <p className="text-xs text-red-400 flex-1">{errorMessage}</p>
          {isUploadError && result?.blob && (
            <button onClick={() => { resetUpload(); upload(result.blob!); }} className="text-xs text-red-300 hover:text-white font-semibold underline underline-offset-2 shrink-0 transition-colors">
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MicIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>;
}
function StopIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>;
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function SpinnerIcon({ className }: { className?: string }) {
  return <svg className={`animate-spin ${className ?? ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function XIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}