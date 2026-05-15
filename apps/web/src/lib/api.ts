// apps/web/lib/api.ts

import type { UploadMeetingResponse } from "@repo/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Generic request helper ────────────────────────────────────────────────

async function request<T>(
  path: string,
  init: RequestInit,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { ...init, signal });

  if (!res.ok) {
    // Try to surface a backend error message if available
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ── Meeting endpoints ─────────────────────────────────────────────────────

/**
 * POST /meetings/upload
 * Sends audio blob as multipart/form-data.
 * Returns { meetingId, status }
 */
export async function uploadMeeting(
  blob: Blob,
  signal?: AbortSignal
): Promise<UploadMeetingResponse> {
  // Validate before sending — never trust only the backend
  if (!blob || blob.size === 0) {
    throw new Error("Audio blob is empty. Cannot upload.");
  }

  const formData = new FormData();
  // Use a fixed name with correct extension so multer/mime sniffing works
  formData.append("audio", blob, "recording.webm");

  return request<UploadMeetingResponse>(
    "/meetings/upload",
    {
      method: "POST",
      body: formData,
      // Do NOT set Content-Type — browser sets it with the correct boundary
    },
    signal
  );
}

export async function getMeeting(meetingId: string) {
  const res = await fetch(`${BASE_URL}/meetings/${meetingId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to fetch meeting (${res.status})`);
  }
  return res.json();
}