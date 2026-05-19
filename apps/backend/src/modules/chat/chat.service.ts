// packages/backend/src/modules/chat/chat.service.ts
//
// Implements per-meeting RAG chat:
//   1. Verify the meeting belongs to the requesting user
//   2. Embed the user's question
//   3. Retrieve the top-K most relevant chunks — scoped to THIS meeting only
//   4. Generate a grounded answer via Groq (llama-3.3-70b-versatile)
//   5. Persist both the user message and assistant reply
//   6. Return the answer + source chunk excerpts

import Groq from "groq-sdk";
import { MeetingModel }      from "../meeting/meeting.model";
import { MeetingChunkModel } from "../search/meeting-chunk.model";
import { ChatMessageModel }  from "./chat.model";
import { embedText, cosineSimilarity } from "../search/embedding.service";

// ── Config ────────────────────────────────────────────────────────────────

/** Number of chunks to feed into the LLM context window. */
const TOP_K = 5;

/** Discard chunks below this cosine similarity threshold. */
const MIN_SIMILARITY = 0.25;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

// ── System prompt ─────────────────────────────────────────────────────────

const CHAT_SYSTEM_PROMPT = `You are an AI assistant helping a user understand the contents of a single meeting.
You have been given relevant excerpts from the meeting transcript as context.

Rules:
- Answer ONLY from the provided meeting context. Do NOT invent or infer information not present.
- If the context does not contain enough information to answer the question, respond with:
  "I couldn't find that in this meeting."
- Be concise, factual, and specific. Quote names and decisions when relevant.
- Do NOT mention "chunks", "embeddings", "context", or any internal system details.
- Respond naturally, as if you attended the meeting.`;

// ── Chunk retrieval ───────────────────────────────────────────────────────

interface ChunkHit {
  chunkText: string;
  score:     number;
}

/**
 * Retrieve the most relevant transcript chunks for this specific meeting.
 *
 * Strategy:
 *   PRIMARY  → MongoDB Atlas $vectorSearch (if the index is configured)
 *   FALLBACK → In-process cosine similarity (always works, slower at scale)
 *
 * The meetingId + userId double-filter ensures strict data isolation.
 */
async function findRelevantChunks(
  queryEmbedding: number[],
  meetingId: string,
  userId: string,
): Promise<ChunkHit[]> {
  // ── Atlas Vector Search ───────────────────────────────────────────────
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index:        "meeting_chunks_vector_index",
          path:         "embedding",
          queryVector:  queryEmbedding,
          numCandidates: TOP_K * 10,
          limit:        TOP_K,
          filter:       { meetingId, userId },   // scoped to this meeting
        },
      },
      {
        $project: {
          chunkText: 1,
          score:     { $meta: "vectorSearchScore" },
        },
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await (MeetingChunkModel as any).aggregate(pipeline);

    if (results.length > 0) {
      return results
        .filter((r: { score: number }) => r.score >= MIN_SIMILARITY)
        .map((r: { chunkText: string; score: number }) => ({
          chunkText: r.chunkText,
          score:     r.score,
        }));
    }
    // Fall through if Atlas returned nothing (index not set up)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("PlanExecutor") && !message.includes("index")) {
      throw err; // unexpected error — re-throw
    }
    console.warn("[chat] Atlas Vector Search unavailable, using in-process fallback.");
  }

  // ── In-process cosine similarity fallback ────────────────────────────
  const allChunks = await MeetingChunkModel.find({ meetingId, userId }).lean();

  return allChunks
    .map((chunk) => ({
      chunkText: chunk.chunkText,
      score:     cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .filter((c) => c.score >= MIN_SIMILARITY)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}

// ── LLM answer generation ─────────────────────────────────────────────────

async function generateAnswer(
  question: string,
  chunks:   ChunkHit[],
): Promise<string> {
  const context = chunks
    .map((c, i) => `[Excerpt ${i + 1}]\n${c.chunkText}`)
    .join("\n\n");

  const completion = await groq.chat.completions.create({
    model:    "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      {
        role:    "user",
        content: `Meeting transcript excerpts:\n\n${context}\n\n---\n\nQuestion: ${question}`,
      },
    ],
    temperature: 0.1,
    max_tokens:  600,
  });

  return (
    completion.choices[0]?.message?.content?.trim() ??
    "I couldn't generate an answer. Please try again."
  );
}

// ── Public types ──────────────────────────────────────────────────────────

export interface ChatResponse {
  answer:    string;
  sources:   { excerpt: string; score: number }[];
}

// ── Main export ───────────────────────────────────────────────────────────

export async function chatWithMeeting(
  meetingId: string,
  userId:    string,
  message:   string,
): Promise<ChatResponse> {
  // 1. Verify the meeting exists and belongs to this user
  const meeting = await MeetingModel.findOne({ _id: meetingId, userId }).lean();

  if (!meeting) {
    throw Object.assign(
      new Error("Meeting not found."),
      { status: 404 },
    );
  }

  if (meeting.status !== "completed") {
    throw Object.assign(
      new Error(
        meeting.status === "processing"
          ? "This meeting is still being analyzed. Please try again shortly."
          : "This meeting has not been successfully transcribed.",
      ),
      { status: 422 },
    );
  }

  // 2. Embed the user's question
  const queryEmbedding = await embedText(message);

  // 3. Retrieve relevant chunks (meeting-scoped)
  const chunks = await findRelevantChunks(queryEmbedding, meetingId, userId);

  let answer: string;

  if (chunks.length === 0) {
    answer = "I couldn't find that in this meeting.";
  } else {
    // 4. Generate grounded answer
    answer = await generateAnswer(message, chunks);
  }

  // 5. Persist both turns for conversation history
  await ChatMessageModel.insertMany([
    { meetingId, userId, role: "user",      content: message },
    { meetingId, userId, role: "assistant", content: answer  },
  ]);

  // 6. Return answer + top source excerpts (useful for frontend citations)
  return {
    answer,
    sources: chunks.map((c) => ({ excerpt: c.chunkText, score: c.score })),
  };
}

// ── Chat history helper ───────────────────────────────────────────────────

export interface HistoryMessage {
  role:      "user" | "assistant";
  content:   string;
  createdAt: Date;
}

/**
 * Returns the persisted conversation history for a meeting, oldest first.
 * Used by the frontend to restore the chat panel on page reload.
 */
export async function getChatHistory(
  meetingId: string,
  userId:    string,
): Promise<HistoryMessage[]> {
  // Verify ownership before returning history
  const exists = await MeetingModel.exists({ _id: meetingId, userId });
  if (!exists) {
    throw Object.assign(new Error("Meeting not found."), { status: 404 });
  }

  const messages = await ChatMessageModel.find({ meetingId, userId })
    .sort({ createdAt: 1 })
    .lean();

  return messages.map((m) => ({
    role:      m.role,
    content:   m.content,
    createdAt: m.createdAt,
  }));
}