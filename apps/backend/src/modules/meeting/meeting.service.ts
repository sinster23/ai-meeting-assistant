// packages/backend/src/modules/meeting/meeting.service.ts

import { saveFile } from "../../utils/file";
import { MeetingModel } from "./meeting.model";
import { runTranscription } from "./meeting.transcription";
import type { UploadMeetingResponse } from "@repo/types";

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

  const meeting = await MeetingModel.create({
    userId: "anonymous",
    audioPath,
    status: "uploaded",
    source,
    originalFileName: originalName || undefined,
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