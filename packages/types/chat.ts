// packages/types/chat.ts
//
// Shared request/response types for the meeting AI chat feature.
// Consumed by both the backend (chat.service.ts) and the frontend (ChatPanel.tsx).

// ── Request ───────────────────────────────────────────────────────────────

/** Body sent to POST /meetings/:id/chat */
export interface ChatRequest {
  message: string;
}

// ── Response ──────────────────────────────────────────────────────────────

/** A single source excerpt returned alongside the answer. */
export interface ChatSource {
  /** Raw text of the transcript chunk that informed the answer. */
  excerpt: string;
  /** Cosine similarity score (0–1). Higher = more relevant. */
  score: number;
}

/** Response from POST /meetings/:id/chat */
export interface ChatResponse {
  answer:  string;
  sources: ChatSource[];
}

// ── History ───────────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant";

/** A single persisted message from GET /meetings/:id/chat/history */
export interface ChatHistoryMessage {
  role:      ChatRole;
  content:   string;
  createdAt: string;   // ISO 8601 string over the wire
}

/** Response from GET /meetings/:id/chat/history */
export interface ChatHistoryResponse {
  history: ChatHistoryMessage[];
}