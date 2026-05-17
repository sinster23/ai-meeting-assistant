// apps/web/lib/api.ts
//
// Single source of truth for all API communication.
// Every fetch goes through apiFetch → credentials always sent → no more 401s.
// Base URL defined once — no scattered env reads or port mismatches.

import type {
  MeetingStatus,
  MeetingStatusResponse,
  RecordingListItem,
  SearchRequest,
  SearchResponse,
  StorageStats,
  UploadMeetingResponse,
} from "@repo/types";

// Re-export so hooks can import from one place if needed
export type { RecordingListItem, StorageStats };

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Core helpers ──────────────────────────────────────────────────────────

async function apiFetch(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal
): Promise<Response> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    signal,
    credentials: "include", // sends session cookie — required for all auth'd routes
    headers: { ...init.headers },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  return res;
}

async function apiJson<T>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal
): Promise<T> {
  const res = await apiFetch(path, init, signal);

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* keep status-text fallback */ }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ── Shared types ──────────────────────────────────────────────────────────

export interface MeetingListItem {
  meetingId: string;
  status: MeetingStatus;
  createdAt: string;
  summary: string | null;
  source: string;
  originalFileName: string | null;
}

// ── /meetings ─────────────────────────────────────────────────────────────

export const meetingApi = {
  list: (): Promise<MeetingListItem[]> =>
    apiJson("/meetings"),

  get: (meetingId: string): Promise<MeetingStatusResponse> =>
    apiJson(`/meetings/${meetingId}`),

  /**
   * Accepts File (file-picker) or Blob (recorder).
   * Never set Content-Type manually for FormData — browser sets it with
   * the correct multipart boundary automatically.
   */
  upload: (
    fileOrBlob: File | Blob,
    source: "recording" | "upload",
    signal?: AbortSignal
  ): Promise<UploadMeetingResponse> => {
    if (!fileOrBlob || fileOrBlob.size === 0)
      throw new Error("Audio file is empty. Cannot upload.");

    const file =
      fileOrBlob instanceof File
        ? fileOrBlob
        : new File([fileOrBlob], "recording.webm", {
            type: fileOrBlob.type || "audio/webm",
          });

    const formData = new FormData();
    formData.append("audio", file);

    return apiJson(
      "/meetings/upload",
      { method: "POST", body: formData, headers: { "x-upload-source": source } },
      signal
    );
  },
};

// ── /recordings ───────────────────────────────────────────────────────────

export const recordingApi = {
  list: (): Promise<RecordingListItem[]> =>
    apiJson("/recordings"),

  stats: (): Promise<StorageStats> =>
    apiJson("/recordings/stats"),

  delete: (id: string): Promise<void> =>
    apiJson(`/recordings/${id}`, { method: "DELETE" }),

  retry: (id: string): Promise<{ recordingId: string; status: string }> =>
    apiJson(`/recordings/${id}/retry`, { method: "POST" }),
};

// ── /uploads ──────────────────────────────────────────────────────────────

export const uploadApi = {
  list: (): Promise<RecordingListItem[]> =>
    apiJson("/uploads"),

  stats: (): Promise<StorageStats> =>
    apiJson("/uploads/stats"),

  delete: (id: string): Promise<void> =>
    apiJson(`/uploads/${id}`, { method: "DELETE" }),

  retry: (id: string): Promise<{ recordingId: string; status: string }> =>
    apiJson(`/uploads/${id}/retry`, { method: "POST" }),
};

// ── /search ───────────────────────────────────────────────────────────────

export const searchApi = {
  query: (payload: SearchRequest): Promise<SearchResponse> =>
    apiJson("/search/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};