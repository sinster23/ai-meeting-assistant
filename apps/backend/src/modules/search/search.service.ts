// packages/backend/src/modules/search/search.service.ts
//
// Responsibilities:
//   1. chunkAndEmbedTranscript() — called after transcription completes
//   2. searchMeetings()          — called on POST /search/query
//
// Vector search strategy:
//   PRIMARY   → MongoDB Atlas Vector Search ($vectorSearch aggregation)
//   FALLBACK  → In-process cosine similarity (works on local/free Atlas tiers
//               that don't have the vector search index set up yet)
//
// To enable Atlas Vector Search, create the index described at the bottom
// of this file on the `meetingchunks` collection.

import Groq from "groq-sdk";
import { MeetingChunkModel } from "./meeting-chunk.model";
import { MeetingModel } from "../meeting/meeting.model";
import { embedText, embedBatch, cosineSimilarity } from "./embedding.service";

// ── Config ────────────────────────────────────────────────────────────────

/** Words per chunk (approximate — splits on whitespace). */
const CHUNK_SIZE_WORDS = 400;

/** Word overlap between consecutive chunks for context continuity. */
const CHUNK_OVERLAP_WORDS = 50;

/** How many chunks to retrieve before sending to the LLM. */
const TOP_K = 5;

/** Minimum similarity score to include a chunk (0-1 cosine scale). */
const MIN_SIMILARITY = 0.3;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

// ── Step 1 — Transcript chunking ──────────────────────────────────────────

function splitIntoChunks(transcript: string): string[] {
  const words = transcript.trim().split(/\s+/);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE_WORDS, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = end - CHUNK_OVERLAP_WORDS;
  }

  return chunks;
}

// ── Step 2 — Embed & persist chunks ──────────────────────────────────────

/**
 * Called once after transcription completes.
 * Deletes any stale chunks for this meeting, then creates fresh ones.
 */
export async function chunkAndEmbedTranscript(
  meetingId: string,
  userId: string,
  transcript: string
): Promise<void> {
  if (!transcript.trim()) {
    console.info(`[search] Skipping empty transcript for meeting ${meetingId}`);
    return;
  }

  const chunks = splitIntoChunks(transcript);
  console.info(
    `[search] Embedding ${chunks.length} chunk(s) for meeting ${meetingId}`
  );

  // Embed all chunks in one batched API call
  let embeddings: number[][];
  try {
    embeddings = await embedBatch(chunks);
  } catch (err) {
    console.error("[search] Batch embedding failed:", err);
    throw err;
  }

  // Remove stale chunks from a previous (re-)transcription
  await MeetingChunkModel.deleteMany({ meetingId });

  const docs = chunks.map((chunkText, idx) => ({
    meetingId,
    userId,
    chunkIndex: idx,
    chunkText,
    embedding: embeddings[idx],
  }));

  await MeetingChunkModel.insertMany(docs);
  console.info(
    `[search] Stored ${docs.length} chunk(s) for meeting ${meetingId}`
  );
}

// ── Step 3 — Vector similarity search ────────────────────────────────────

interface ChunkHit {
  meetingId: string;
  chunkText: string;
  score: number;
}

/**
 * Try Atlas Vector Search first; fall back to in-process cosine similarity.
 * userId is always applied as a pre-filter so users only see their own data.
 */
async function findRelevantChunks(
  queryEmbedding: number[],
  userId: string
): Promise<ChunkHit[]> {
  // ── Atlas Vector Search (requires index — see note at bottom of file) ──
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: "meeting_chunks_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: TOP_K * 10,
          limit: TOP_K,
          filter: { userId },
        },
      },
      {
        $project: {
          meetingId: 1,
          chunkText: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await (MeetingChunkModel as any).aggregate(pipeline);

    if (results.length > 0) {
      return results
        .filter((r: { score: number }) => r.score >= MIN_SIMILARITY)
        .map((r: { meetingId: string; chunkText: string; score: number }) => ({
          meetingId: r.meetingId,
          chunkText: r.chunkText,
          score: r.score,
        }));
    }
    // Fall through if Atlas returned nothing (index may not be set up)
  } catch (err: unknown) {
    // PlanExecutor error means the vector index doesn't exist yet — use fallback
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("PlanExecutor") && !message.includes("index")) {
      throw err; // unexpected error — re-throw
    }
    console.warn(
      "[search] Atlas Vector Search unavailable, using in-process fallback."
    );
  }

  // ── In-process cosine similarity fallback ─────────────────────────────
  const allChunks = await MeetingChunkModel.find({ userId }).lean();

  return allChunks
    .map((chunk) => ({
      meetingId: chunk.meetingId,
      chunkText: chunk.chunkText,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .filter((c) => c.score >= MIN_SIMILARITY)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}

// ── Step 4 — LLM answer generation ───────────────────────────────────────

const SEARCH_SYSTEM_PROMPT = `You are a meeting assistant. The user has asked a question about their meetings.
You are given relevant excerpts from meeting transcripts as context.

Rules:
- Answer ONLY from the provided context. Do NOT invent information.
- If the context doesn't contain enough information to answer, say so clearly.
- Be concise and factual.
- If people are mentioned in context of tasks, include their names.
- Do NOT reveal that you are using "chunks" or "embeddings" — just answer naturally.
- Never expose internal system details.`;

async function generateAnswer(
  query: string,
  chunks: ChunkHit[]
): Promise<string> {
  const context = chunks
    .map((c, i) => `[Excerpt ${i + 1}]\n${c.chunkText}`)
    .join("\n\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SEARCH_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Context from meeting transcripts:\n\n${context}\n\n---\n\nQuestion: ${query}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 600,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "No answer generated.";
}

// ── Step 5 — Resolve source meeting metadata ──────────────────────────────

interface SourceMeeting {
  meetingId: string;
  originalFileName: string | null;
  createdAt: Date;
  status: string;
}

async function resolveSources(
  chunks: ChunkHit[]
): Promise<SourceMeeting[]> {
  // Deduplicate meetingIds while preserving relevance order
  const seen = new Set<string>();
  const meetingIds: string[] = [];
  for (const c of chunks) {
    if (!seen.has(c.meetingId)) {
      seen.add(c.meetingId);
      meetingIds.push(c.meetingId);
    }
  }

  const meetings = await MeetingModel.find({
    _id: { $in: meetingIds },
  })
    .select("_id originalFileName createdAt status")
    .lean();

  // Return in relevance order (highest-scoring chunk's meeting first)
  const byId = new Map(
    meetings.map((m) => [
      (m._id as unknown as { toString(): string }).toString(),
      m,
    ])
  );

  return meetingIds
    .map((id) => {
      const m = byId.get(id);
      if (!m) return null;
      return {
        meetingId: id,
        originalFileName: m.originalFileName ?? null,
        createdAt: m.createdAt,
        status: m.status,
      };
    })
    .filter(Boolean) as SourceMeeting[];
}

// ── Public search entry point ─────────────────────────────────────────────

export interface SearchResult {
  answer: string;
  sources: SourceMeeting[];
}

export async function searchMeetings(
  query: string,
  userId: string
): Promise<SearchResult> {
  if (!query.trim()) {
    return { answer: "Please enter a question to search your meetings.", sources: [] };
  }

  // 1. Embed the query
  const queryEmbedding = await embedText(query);

  // 2. Find the most relevant transcript chunks
  const chunks = await findRelevantChunks(queryEmbedding, userId);

  if (chunks.length === 0) {
    return {
      answer: "No relevant information was found in your meetings for that question.",
      sources: [],
    };
  }

  // 3. Generate an LLM answer grounded in retrieved context
  const answer = await generateAnswer(query, chunks);

  // 4. Resolve meeting metadata for the source cards
  const sources = await resolveSources(chunks);

  return { answer, sources };
}

// ── Atlas Vector Search index definition (run once in Atlas UI / CLI) ─────
//
// Collection : meetingchunks
// Index name : meeting_chunks_vector_index
//
// {
//   "fields": [
//     {
//       "type": "vector",
//       "path": "embedding",
//       "numDimensions": 768,       // nomic-embed-text-v1_5 output size
//       "similarity": "cosine"
//     },
//     {
//       "type": "filter",
//       "path": "userId"            // pre-filter for user isolation
//     }
//   ]
// }
//
// Without this index the service automatically falls back to in-process
// cosine similarity — functionally correct but slower for large datasets.