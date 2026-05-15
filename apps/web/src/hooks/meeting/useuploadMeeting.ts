// apps/web/hooks/meeting/useUploadMeeting.ts

import { useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UploadMeetingResponse {
  meetingId: string;
  status: "uploaded";
}

interface UseUploadMeetingOptions {
  onSuccess?: (data: UploadMeetingResponse) => void;
  onError?: (error: Error) => void;
}

// ── Shared upload fetcher ─────────────────────────────────────────────────

async function postAudioFile(
  fileOrBlob: File | Blob,
  source: "recording" | "upload"
): Promise<UploadMeetingResponse> {
  const formData = new FormData();
  const file =
    fileOrBlob instanceof File
      ? fileOrBlob
      : new File([fileOrBlob], "recording.webm", {
          type: fileOrBlob.type || "audio/webm",
        });

  formData.append("audio", file);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${apiUrl}/meetings/upload`, {
    method: "POST",
    body: formData,
    headers: { "x-upload-source": source },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Upload failed (${res.status})`);
  }

  return res.json();
}

// ── Hook for RecordingBar (accepts Blob from recorder) ────────────────────

export function useRecordingUpload(options?: UseUploadMeetingOptions) {
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);
  // Keep options in a ref so callbacks never cause re-renders
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutation = useMutation<UploadMeetingResponse, Error, Blob>({
    mutationFn: (blob: Blob) => {
      abortRef.current = new AbortController();
      return postAudioFile(blob, "recording");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      optionsRef.current?.onSuccess?.(data);
    },
    onError: (error) => {
      if (error.name === "AbortError") return;
      optionsRef.current?.onError?.(error);
    },
  });

  // Stable references — won't change between renders
  const upload = useCallback(mutation.mutate, []); // eslint-disable-line
  const cancel = useCallback(() => {
    abortRef.current?.abort();
    mutation.reset();
  }, []); // eslint-disable-line
  const reset = useCallback(mutation.reset, []); // eslint-disable-line

  return {
    upload,
    cancel,
    isUploading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    meetingId: mutation.data?.meetingId ?? null,
    error: mutation.error,
    reset,
  };
}

// ── Hook for UploadModal (accepts File from file picker) ──────────────────

export function useUploadMeeting(options?: UseUploadMeetingOptions) {
  const queryClient = useQueryClient();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutation = useMutation<UploadMeetingResponse, Error, File>({
    mutationFn: (file: File) => postAudioFile(file, "upload"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      optionsRef.current?.onSuccess?.(data);
    },
    onError: (error) => {
      optionsRef.current?.onError?.(error);
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}