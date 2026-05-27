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
  IntegrationStatusResponse, 
  CalendarEventsResponse, 
  AutomationSettings
} from "@repo/types";
import type { ChatResponse, ChatHistoryResponse } from "@repo/types/chat";

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
    credentials: "include",
    headers: { ...init.headers },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/";
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

// ── /meetings/:id/chat ────────────────────────────────────────────────────

export const chatApi = {
  /** Send a message and get an AI answer grounded in the meeting transcript. */
  send: (meetingId: string, message: string): Promise<ChatResponse> =>
    apiJson(`/meetings/${meetingId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }),

  /** Fetch the full chat history for a meeting (for page reload restore). */
  history: (meetingId: string): Promise<ChatHistoryResponse> =>
    apiJson(`/meetings/${meetingId}/chat/history`),
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

// ── /integrations ──────────────────────────────────────────────────────────
 
export const integrationApi = {
  /** GET /integrations/status — provider catalogue + automation settings */
  status: (): Promise<IntegrationStatusResponse> =>
    apiJson("/integrations/status"),
 
  /**
   * GET /integrations/google/connect
   * Returns the OAuth redirect URL — we navigate to it directly so the browser
   * cookie is present for the session-based flow.
   * Usage: window.location.href = integrationApi.googleConnectUrl()
   */
  googleConnectUrl: (): string =>
    `${BASE_URL}/integrations/google/connect`,
 
  /** DELETE /integrations/:provider/disconnect */
  disconnect: (provider: string): Promise<{ disconnected: boolean; provider: string }> =>
    apiJson(`/integrations/${provider}/disconnect`, { method: "DELETE" }),
 
  /** GET /integrations/automation */
  getAutomation: (): Promise<AutomationSettings> =>
    apiJson("/integrations/automation"),
 
  /** PATCH /integrations/automation — partial update */
  updateAutomation: (updates: Partial<AutomationSettings>): Promise<AutomationSettings> =>
    apiJson("/integrations/automation", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(updates),
    }),
 
  /** GET /integrations/google/calendar */
  calendarEvents: (daysAhead = 7): Promise<CalendarEventsResponse> =>
    apiJson(`/integrations/google/calendar?daysAhead=${daysAhead}&maxResults=10`),
};