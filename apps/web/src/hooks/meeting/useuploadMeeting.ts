// apps/web/hooks/meeting/useUploadMeeting.ts
"use client";

import { useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { meetingApi } from "@/lib/api";
import type { UploadMeetingResponse } from "@repo/types";

interface UploadOptions {
  onSuccess?: (data: UploadMeetingResponse) => void;
  onError?: (error: Error) => void;
}

// ── useRecordingUpload — for RecordingBar (Blob from MediaRecorder) ───────

export function useRecordingUpload(options?: UploadOptions) {
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutation = useMutation<UploadMeetingResponse, Error, Blob>({
    mutationFn: (blob: Blob) => {
      abortRef.current = new AbortController();
      // Signal is now wired through — cancel() actually cancels the fetch
      return meetingApi.upload(blob, "recording", abortRef.current.signal);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      optionsRef.current?.onSuccess?.(data);
    },
    onError: (error) => {
      if (error.name === "AbortError") return; // cancelled by user — not an error
      optionsRef.current?.onError?.(error);
    },
  });

  const upload = useCallback((blob: Blob) => mutation.mutate(blob), []); // eslint-disable-line
  const cancel = useCallback(() => {
    abortRef.current?.abort();
    mutation.reset();
  }, []); // eslint-disable-line
  const reset = useCallback(() => mutation.reset(), []); // eslint-disable-line

  return {
    upload,
    cancel,
    reset,
    isUploading: mutation.isPending,
    isSuccess:   mutation.isSuccess,
    isError:     mutation.isError,
    meetingId:   mutation.data?.meetingId ?? null,
    error:       mutation.error,
  };
}

// ── useUploadMeeting — for UploadModal (File from file picker) ────────────

export function useUploadMeeting(options?: UploadOptions) {
  const queryClient = useQueryClient();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutation = useMutation<UploadMeetingResponse, Error, File>({
    mutationFn: (file: File) => meetingApi.upload(file, "upload"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      optionsRef.current?.onSuccess?.(data);
    },
    onError: (error) => {
      optionsRef.current?.onError?.(error);
    },
  });

  return {
    mutate:    mutation.mutate,
    isPending: mutation.isPending,
    isError:   mutation.isError,
    error:     mutation.error,
    reset:     mutation.reset,
  };
}