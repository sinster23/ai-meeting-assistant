// packages/backend/src/modules/meeting/meeting.service.ts

import { execFile } from "child_process";
import { promisify } from "util";
import { saveFile } from "../../utils/file";
import { MeetingModel } from "./meeting.model";
import { runTranscription } from "./meeting.transcription";
import type { UploadMeetingResponse } from "@repo/types";

const execFileAsync = promisify(execFile);

// ── Allowed MIME types ────────────────────────────────────────────────────
// Video types are accepted — ffmpeg extracts the audio track before transcribing

const ALLOWED_MIME_BASES = new Set([
  // Audio
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/x-m4a",
  // Video — audio is extracted by ffmpeg downstream
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
]);

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

function isMimeAllowed(mimeType: string): boolean {
  const base = mimeType.split(";")[0].trim().toLowerCase();
  return ALLOWED_MIME_BASES.has(base);
}

function extensionFromMime(mimeType: string, originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase();
  if (ext) return `.${ext}`;
  const base = mimeType.split(";")[0].trim();
  const MAP: Record<string, string> = {
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
    "audio/mp4": ".m4a",
    "audio/m4a": ".m4a",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };
  return MAP[base] ?? ".bin";
}

// ── ffprobe duration helper ───────────────────────────────────────────────

async function getAudioDurationSeconds(filePath: string): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const seconds = parseFloat(stdout.trim());
    return isNaN(seconds) ? null : Math.round(seconds);
  } catch {
    // ffprobe unavailable or file unreadable — degrades gracefully
    return null;
  }
}

// ── Generate display name ─────────────────────────────────────────────────
// Produces compact, no-space slugs:
//   "rec_may16_342pm"    (recording)
//   "upload_may16_342pm" (upload)

function generateDisplayName(source: "recording" | "upload"): string {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" }).toLowerCase(); // "may"
  const day = now.getDate();                                                    // 16
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  const prefix = source === "recording" ? "rec" : "upload";
  // e.g. "rec_may16_342pm" | "upload_may16_1005am"
  return `${prefix}_${month}${day}_${hours}${minutes}${ampm}`;
}

// ── Slugify a user-supplied filename ─────────────────────────────────────
// Strips extension, lowercases, replaces whitespace/special chars with "_",
// collapses repeated underscores, trims to 40 chars.
// e.g. "Q3 Revenue Review (final).mp4" → "q3_revenue_review_final"

function slugifyFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")           // strip extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")       // non-alphanum → underscore
    .replace(/^_+|_+$/g, "")           // trim leading/trailing underscores
    .replace(/_+/g, "_")               // collapse runs
    .slice(0, 40)                       // max 40 chars
    || "upload";                        // fallback if string becomes empty
}

// ── Upload entry point ────────────────────────────────────────────────────

export async function uploadMeeting(
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
  source: "recording" | "upload" = "upload"
): Promise<UploadMeetingResponse> {
  if (!isMimeAllowed(mimeType)) {
    throw Object.assign(
      new Error(`Unsupported file type: ${mimeType}`),
      { status: 422 }
    );
  }
  if (fileBuffer.byteLength === 0) {
    throw Object.assign(new Error("Uploaded file is empty."), { status: 400 });
  }
  if (fileBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw Object.assign(
      new Error("File exceeds maximum allowed size (100 MB)."),
      { status: 413 }
    );
  }

  const ext = extensionFromMime(mimeType, originalName);
  const fileName = `${crypto.randomUUID()}${ext}`;

  let audioPath: string;
  try {
    audioPath = await saveFile(fileName, fileBuffer);
  } catch {
    throw Object.assign(
      new Error("Failed to save audio file."),
      { status: 500 }
    );
  }

  // Size from buffer — always available, zero cost
  const fileSizeBytes = fileBuffer.byteLength;

  // Duration via ffprobe on the saved file — degrades to null if unavailable
  const durationSeconds = await getAudioDurationSeconds(audioPath);

  const displayName =
    source === "recording"
      ? generateDisplayName(source)
      : (originalName?.trim() ? slugifyFileName(originalName) : generateDisplayName(source));

  const meeting = await MeetingModel.create({
    userId: "anonymous",
    audioPath,
    status: "uploaded",
    source,
    originalFileName: displayName,
    fileSizeBytes,
    durationSeconds,
  });

  const meetingId = (
    meeting._id as unknown as { toString(): string }
  ).toString();

  // Fire-and-forget — response returns before pipeline completes
  runTranscription(meetingId, audioPath).catch((err) =>
    console.error("[service] runTranscription rejected:", err)
  );

  return { meetingId, status: "uploaded" };
}