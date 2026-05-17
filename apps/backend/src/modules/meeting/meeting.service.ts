// packages/backend/src/modules/meeting/meeting.service.ts
//
// Changes vs original:
//   • uploadMeeting now accepts userId as a required parameter (from session)
//   • "anonymous" fallback removed — auth middleware guarantees a real userId

import { execFile } from "child_process";
import { promisify } from "util";
import { saveFile } from "../../utils/file";
import { MeetingModel } from "./meeting.model";
import { runTranscription } from "./meeting.transcription";
import type { UploadMeetingResponse } from "@repo/types";

const execFileAsync = promisify(execFile);

// ── Allowed MIME types ────────────────────────────────────────────────────

const ALLOWED_MIME_BASES = new Set([
  "audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg",
  "audio/wav",  "audio/x-wav", "audio/m4a", "audio/x-m4a",
  "video/mp4",  "video/webm",  "video/quicktime",
  "video/x-msvideo", "video/mpeg",
]);

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

function isMimeAllowed(mimeType: string): boolean {
  return ALLOWED_MIME_BASES.has(mimeType.split(";")[0].trim().toLowerCase());
}

function extensionFromMime(mimeType: string, originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase();
  if (ext) return `.${ext}`;
  const MAP: Record<string, string> = {
    "audio/mpeg": ".mp3", "audio/wav": ".wav", "audio/x-wav": ".wav",
    "audio/webm": ".webm", "audio/ogg": ".ogg",
    "audio/mp4": ".m4a",  "audio/m4a": ".m4a",
    "video/mp4": ".mp4",  "video/webm": ".webm", "video/quicktime": ".mov",
  };
  return MAP[mimeType.split(";")[0].trim()] ?? ".bin";
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
    return null;
  }
}

// ── Display name helpers ──────────────────────────────────────────────────

function generateDisplayName(source: "recording" | "upload"): string {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" }).toLowerCase();
  const day = now.getDate();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `${source === "recording" ? "rec" : "upload"}_${month}${day}_${hours}${minutes}${ampm}`;
}

function slugifyFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .slice(0, 40)
    || "upload";
}

// ── Upload entry point ────────────────────────────────────────────────────

export async function uploadMeeting(
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
  source: "recording" | "upload" = "upload",
  userId: string,                          // ← now required; comes from session
): Promise<UploadMeetingResponse> {
  if (!isMimeAllowed(mimeType)) {
    throw Object.assign(new Error(`Unsupported file type: ${mimeType}`), { status: 422 });
  }
  if (fileBuffer.byteLength === 0) {
    throw Object.assign(new Error("Uploaded file is empty."), { status: 400 });
  }
  if (fileBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw Object.assign(new Error("File exceeds maximum allowed size (100 MB)."), { status: 413 });
  }

  const ext      = extensionFromMime(mimeType, originalName);
  const fileName = `${crypto.randomUUID()}${ext}`;

  let audioPath: string;
  try {
    audioPath = await saveFile(fileName, fileBuffer);
  } catch {
    throw Object.assign(new Error("Failed to save audio file."), { status: 500 });
  }

  const fileSizeBytes    = fileBuffer.byteLength;
  const durationSeconds  = await getAudioDurationSeconds(audioPath);
  const displayName      =
    source === "recording"
      ? generateDisplayName(source)
      : (originalName?.trim() ? slugifyFileName(originalName) : generateDisplayName(source));

  const meeting = await MeetingModel.create({
    userId,                    // ← real userId from session
    audioPath,
    status: "uploaded",
    source,
    originalFileName: displayName,
    fileSizeBytes,
    durationSeconds,
  });

  const meetingId = (meeting._id as unknown as { toString(): string }).toString();

  runTranscription(meetingId, audioPath, userId).catch((err) =>
    console.error("[service] runTranscription rejected:", err)
  );

  return { meetingId, status: "uploaded" };
}