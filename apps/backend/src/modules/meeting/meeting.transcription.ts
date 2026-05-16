// packages/backend/src/modules/meeting/meeting.transcription.ts
//
// Changes vs original:
//   • After summarisation succeeds, calls chunkAndEmbedTranscript() so the
//     meeting is immediately searchable.
//   • Embedding failure is non-fatal: logged as a warning, pipeline continues.

import path from "path";
import fs from "fs/promises";
import { openAsBlob } from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { BatchClient } from "@speechmatics/batch-client";
import { MeetingModel } from "./meeting.model";

// Point fluent-ffmpeg at the bundled binary — no PATH dependency
if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

// ── Audio conversion ───────────────────────────────────────────────────────

function convertToMp3(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.\w+$/, ".mp3");

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(16000)
      .audioChannels(1)
      .audioBitrate("64k")
      .toFormat("mp3")
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

// ── Speechmatics transcription ─────────────────────────────────────────────

async function transcribeWithSpeechmatics(audioPath: string): Promise<string> {
  const client = new BatchClient({
    apiKey: process.env.SPEECHMATICS_API_KEY ?? "",
    appId: "meeting-recorder",
  });

  const blob = await openAsBlob(audioPath);
  const file = new File([blob], path.basename(audioPath));

  console.info(
    `[transcription] Sending file: ${file.name}, size: ${file.size} bytes`
  );

  const response = await client.transcribe(
    file,
    {
      transcription_config: {
        language: "en",
        operating_point: "enhanced",
        diarization: "speaker",
      },
    },
    "json-v2"
  );

  console.info(
    "[transcription] Raw Speechmatics response:",
    JSON.stringify(response, null, 2)
  );

  if (typeof response === "string") return response.trim();

  const results = response.results ?? [];
  return results
    .map(
      (r: { alternatives?: { content: string }[]; type: string }) =>
        r.alternatives?.[0]?.content ?? ""
    )
    .join(" ")
    .replace(/\s([.,!?;:])/g, "$1")
    .trim();
}

// ── Cleanup ────────────────────────────────────────────────────────────────

async function cleanupFiles(paths: string[]): Promise<void> {
  await Promise.allSettled(paths.map((p) => fs.unlink(p)));
}

// ── Main export ────────────────────────────────────────────────────────────

export async function runTranscription(
  meetingId: string,
  audioPath: string
): Promise<void> {
  const tempFiles: string[] = [];

  try {
    await MeetingModel.findByIdAndUpdate(meetingId, { status: "processing" });

    // ── ffmpeg conversion ──────────────────────────────────────────────────
    let mp3Path: string;
    try {
      mp3Path = await convertToMp3(audioPath);
      tempFiles.push(mp3Path);
    } catch (err) {
      console.error("[transcription] ffmpeg conversion failed:", err);
      await MeetingModel.findByIdAndUpdate(meetingId, { status: "failed" });
      return;
    }

    // ── Speechmatics ───────────────────────────────────────────────────────
    let transcript: string;
    try {
      transcript = await transcribeWithSpeechmatics(mp3Path);
    } catch (err) {
      console.error("[transcription] Speechmatics error:", err);
      await MeetingModel.findByIdAndUpdate(meetingId, { status: "failed" });
      return;
    }

    await MeetingModel.findByIdAndUpdate(meetingId, {
      status: "completed",
      transcript,
    });
    console.info(
      `[transcription] Meeting ${meetingId} done. Chars: ${transcript.length}`
    );

    // Retrieve userId for this meeting — needed for embedding isolation
    const meeting = await MeetingModel.findById(meetingId).select("userId").lean();
    const userId = meeting?.userId ?? "anonymous";

    // ── Summarisation ──────────────────────────────────────────────────────
    try {
      const { summariseTranscript } = await import("./meeting.summarisation");
      const summaryResult = await summariseTranscript(transcript);

      if (summaryResult) {
        await MeetingModel.findByIdAndUpdate(meetingId, {
          summary: summaryResult.summary,
          keyPoints: summaryResult.keyPoints,
          actionItems: summaryResult.actionItems,
        });
        console.info(
          `[transcription] Summary done. Points: ${summaryResult.keyPoints.length}, Actions: ${summaryResult.actionItems.length}`
        );
      }
    } catch (err) {
      console.error("[transcription] Groq summarisation failed:", err);
      // Non-fatal — continue to embedding
    }

    // ── Chunking + embedding (enables AI search) ───────────────────────────
    try {
      const { chunkAndEmbedTranscript } = await import("../search/search.service");
      await chunkAndEmbedTranscript(meetingId, userId, transcript);
      console.info(`[transcription] Embedding complete for meeting ${meetingId}`);
    } catch (err) {
      // Non-fatal — search won't work for this meeting but transcript/summary are saved
      console.error("[transcription] Embedding pipeline failed:", err);
    }
  } catch (err) {
    console.error(`[transcription] Unexpected error for ${meetingId}:`, err);
    await MeetingModel.findByIdAndUpdate(meetingId, { status: "failed" });
  } finally {
    await cleanupFiles(tempFiles);
  }
}