// packages/backend/src/modules/meeting/meeting.summarisation.ts

import Groq from "groq-sdk";
import type { ActionItem } from "@repo/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Prompt ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert meeting analyst.
Given a meeting transcript, return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must follow this exact shape:a
{
  "summary": "2-3 sentence overview of what the meeting was about",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": [
    { "task": "what needs to be done", "owner": "person name or null", "deadline": "deadline string or null" }
  ]
}

Rules:
- summary: concise, factual, max 3 sentences
- keyPoints: 3-6 bullet points of the main topics discussed
- actionItems: only tasks EXPLICITLY mentioned, never invent them
- owner: only if a specific person was named, otherwise null
- deadline: only if explicitly stated, otherwise null
- If no action items were mentioned, return an empty array
- Never add fields outside the schema above`;

// ── Safe JSON parser ──────────────────────────────────────────────────────

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
}

function parseSummaryResponse(raw: string): SummaryResult | null {
  // Strip markdown code fences if model added them anyway
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Validate shape — never trust LLM output
    if (typeof parsed.summary !== "string") return null;
    if (!Array.isArray(parsed.keyPoints)) return null;
    if (!Array.isArray(parsed.actionItems)) return null;

    const actionItems: ActionItem[] = parsed.actionItems
      .filter((item: unknown) => typeof item === "object" && item !== null)
      .map((item: { task?: unknown; owner?: unknown; deadline?: unknown }) => ({
        task: typeof item.task === "string" ? item.task : "",
        owner: typeof item.owner === "string" ? item.owner : null,
        deadline: typeof item.deadline === "string" ? item.deadline : null,
      }))
      .filter((item: ActionItem) => item.task.length > 0);

    return {
      summary: parsed.summary,
      keyPoints: parsed.keyPoints.filter((p: unknown) => typeof p === "string"),
      actionItems,
    };
  } catch {
    return null;
  }
}

// ── Chunk large transcripts ───────────────────────────────────────────────

const MAX_CHARS_PER_CHUNK = 12000; // ~3000 tokens, safe for llama context

function chunkTranscript(transcript: string): string[] {
  if (transcript.length <= MAX_CHARS_PER_CHUNK) return [transcript];

  const chunks: string[] = [];
  let start = 0;
  while (start < transcript.length) {
    // Try to split on sentence boundary
    let end = start + MAX_CHARS_PER_CHUNK;
    if (end < transcript.length) {
      const boundary = transcript.lastIndexOf(". ", end);
      if (boundary > start) end = boundary + 1;
    }
    chunks.push(transcript.slice(start, end).trim());
    start = end;
  }
  return chunks;
}

// ── LLM call with one retry ───────────────────────────────────────────────

async function callGroq(transcriptChunk: string): Promise<SummaryResult | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here is the meeting transcript:\n\n${transcriptChunk}`,
        },
      ],
      temperature: 0.2, // low = more deterministic JSON
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const result = parseSummaryResponse(raw);
    if (result) return result;

    console.warn(`[summarisation] Parse failed on attempt ${attempt}, retrying...`);
  }
  return null;
}

// ── Merge results from multiple chunks ───────────────────────────────────

function mergeResults(results: SummaryResult[]): SummaryResult {
  if (results.length === 1) return results[0];

  return {
    summary: results.map((r) => r.summary).join(" "),
    keyPoints: results.flatMap((r) => r.keyPoints).slice(0, 8),
    actionItems: results.flatMap((r) => r.actionItems),
  };
}

// ── Main export ───────────────────────────────────────────────────────────

export async function summariseTranscript(
  transcript: string
): Promise<SummaryResult | null> {
  if (!transcript.trim()) return null;

  const chunks = chunkTranscript(transcript);
  const results: SummaryResult[] = [];

  for (const chunk of chunks) {
    const result = await callGroq(chunk);
    if (result) results.push(result);
  }

  if (results.length === 0) return null;
  return mergeResults(results);
}