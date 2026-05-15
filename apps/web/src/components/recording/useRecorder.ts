// apps/web/components/recording/useRecorder.ts

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RecorderResult, RecordingState, UseRecorderReturn } from "./recorder.types";

// Minimum valid recording duration in seconds
const MIN_DURATION_SECONDS = 3;

// Preferred MIME types in priority order
const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function getSupportedMimeType(): string {
  for (const type of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export function useRecorder(): UseRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [result, setResult] = useState<RecorderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // ── Cleanup helpers ───────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

const releaseStream = useCallback(() => {
  streamRef.current?.getTracks().forEach((track) => track.stop());
  streamRef.current = null;
}, []);

  const resetChunks = useCallback(() => {
    chunksRef.current = [];
  }, []);

  // ── Finalise recording → validate → set result ────────────────────────────

  const finalise = useCallback(
    (mimeType: string) => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      if (chunksRef.current.length === 0) {
        setError("No audio was captured. Make sure you shared a tab with audio.");
        setRecordingState("error");
        resetChunks();
        stopTimer();
        releaseStream();
        return;
      }

      const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });

      if (blob.size === 0) {
        setError("Recording produced an empty file. Please try again.");
        setRecordingState("error");
        resetChunks();
        stopTimer();
        releaseStream();
        return;
      }

      if (duration < MIN_DURATION_SECONDS) {
        setError(`Recording is too short (minimum ${MIN_DURATION_SECONDS} seconds).`);
        setRecordingState("error");
        resetChunks();
        stopTimer();
        releaseStream();
        return;
      }

      setResult({ blob, duration });
      setRecordingState("stopped");
      resetChunks();
      stopTimer();
      releaseStream();
    },
    [resetChunks, stopTimer, releaseStream]
  );

  // ── startRecording ────────────────────────────────────────────────────────

const startRecording = useCallback(async () => {
  if (recordingState === "recording") return;

  setError(null);
  setResult(null);
  setDurationSeconds(0);
  resetChunks();

  let stream: MediaStream;

  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,   // must request video=true or browser won't show tab picker
      audio: {
        echoCancellation: false,  // don't process tab audio
        noiseSuppression: false,
        sampleRate: 44100,
      },
    });
  } catch (err) {
    const isDenied =
      err instanceof DOMException &&
      (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
    setError(
      isDenied
        ? "Screen share permission denied. Please allow access and try again."
        : "Could not start recording. Your browser may not support tab capture."
    );
    setRecordingState("error");
    return;
  }

  const audioTracks = stream.getAudioTracks();

  // ✅ Log so you can verify in DevTools console
  console.log("[recorder] Audio tracks received:", audioTracks.length);
  audioTracks.forEach((t, i) => {
    console.log(`[recorder] Track ${i}:`, {
      label: t.label,
      muted: t.muted,
      readyState: t.readyState,
    });
  });

  if (audioTracks.length === 0) {
    setError(
      'No audio detected. In the browser picker: select a Tab (not Window/Screen) and check "Share tab audio".'
    );
    setRecordingState("error");
    stream.getTracks().forEach((t) => t.stop());
    return;
  }

  // ✅ Key fix: keep video track alive — stopping it can mute audio on Windows
  // Instead, record only audio tracks but don't stop video until after recorder starts
  const audioOnlyStream = new MediaStream(audioTracks);
  streamRef.current = stream; // keep full stream reference to stop later

  const mimeType = getSupportedMimeType();
  const recorder = new MediaRecorder(
    audioOnlyStream,
    mimeType ? { mimeType } : undefined
  );
  mediaRecorderRef.current = recorder;

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunksRef.current.push(e.data);
    }
  };

  recorder.onstop = () => {
    // Now safe to stop video tracks
    stream.getVideoTracks().forEach((t) => t.stop());
    finalise(mimeType);
  };

  recorder.onerror = () => {
    setError("An unexpected recording error occurred.");
    setRecordingState("error");
    stopTimer();
    releaseStream();
  };

  audioTracks.forEach((track) => {
    track.onended = () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  });

  startTimeRef.current = Date.now();
  recorder.start(250);
  setRecordingState("recording");

  timerRef.current = setInterval(() => {
    setDurationSeconds((s) => s + 1);
  }, 1000);
}, [recordingState, resetChunks, finalise, stopTimer, releaseStream]);

  // ── stopRecording ─────────────────────────────────────────────────────────

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopTimer();
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      releaseStream();
    };
  }, [stopTimer, releaseStream]);

  return {
    recordingState,
    startRecording,
    stopRecording,
    result,
    error,
    durationSeconds,
  };
}