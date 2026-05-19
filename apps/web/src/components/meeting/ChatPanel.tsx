// apps/web/components/meeting/ChatPanel.tsx
"use client";

import { useEffect, useRef } from "react";
import { useChatSession } from "@/hooks/meeting/useChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { MeetingStatus } from "@repo/types";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

const SUGGESTED_QUESTIONS = [
  "What were the main decisions made?",
  "Who is responsible for what?",
  "Were any deadlines mentioned?",
  "What problems were discussed?",
];

interface Props {
  meetingId: string;
  meetingStatus: MeetingStatus;
}

export function ChatPanel({ meetingId, meetingStatus }: Props) {
  const { messages, sendMessage, isLoading, isHistoryLoading } =
    useChatSession(meetingId);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isPending =
    meetingStatus === "uploaded" || meetingStatus === "processing";
  const isFailed = meetingStatus === "failed";
  const isReady = meetingStatus === "completed";

  const disabledReason = isPending
    ? "Meeting is still being analyzed…"
    : isFailed
    ? "Meeting processing failed"
    : undefined;

  return (
    <div
      style={{
        border: "1px solid #efefef",
        borderRadius: "12px",
        background: "#fff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #f5f5f5",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#111",
              fontFamily: font,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Ask this meeting
          </p>
          <p
            style={{
              fontSize: "11px",
              color: "#aaa",
              fontFamily: font,
              margin: 0,
            }}
          >
            {isPending
              ? "Available once processing completes"
              : "Powered by your transcript"}
          </p>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div
        style={{
          minHeight: "280px",
          maxHeight: "480px",
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isHistoryLoading ? (
          <LoadingHistory />
        ) : messages.length === 0 ? (
          <EmptyState
            isReady={isReady}
            isPending={isPending}
            isFailed={isFailed}
            onSuggest={sendMessage}
          />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* ── Input ── */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        disabled={!isReady}
        disabledReason={disabledReason}
      />
    </div>
  );
}

// ── Empty state — shown when no messages yet ──────────────────────────────

function EmptyState({
  isReady,
  isPending,
  isFailed,
  onSuggest,
}: {
  isReady: boolean;
  isPending: boolean;
  isFailed: boolean;
  onSuggest: (q: string) => void;
}) {
  if (isFailed) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 0",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "22px" }}>⚠️</span>
        <p
          style={{
            fontSize: "13px",
            color: "#dc2626",
            fontFamily: font,
            margin: 0,
          }}
        >
          Processing failed — chat unavailable
        </p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 0",
          gap: "10px",
        }}
      >
        <svg
          style={{ animation: "spin 0.75s linear infinite" }}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ccc"
          strokeWidth="2"
        >
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <p
          style={{
            fontSize: "13px",
            color: "#aaa",
            fontFamily: font,
            margin: 0,
          }}
        >
          Chat will be ready once your meeting finishes processing
        </p>
      </div>
    );
  }

  // Ready — show suggested questions
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 0",
        gap: "16px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "4px" }}>
        <p
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#333",
            fontFamily: font,
            margin: "0 0 4px",
            letterSpacing: "-0.01em",
          }}
        >
          Ask anything about this meeting
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "#bbb",
            fontFamily: font,
            margin: 0,
          }}
        >
          Try one of these to get started
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          width: "100%",
          maxWidth: "360px",
        }}
      >
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSuggest(q)}
            style={{
              background: "#fafafa",
              border: "1px solid #efefef",
              borderRadius: "8px",
              padding: "9px 12px",
              cursor: "pointer",
              fontSize: "13px",
              color: "#444",
              fontFamily: font,
              textAlign: "left",
              transition: "all 0.15s",
              letterSpacing: "-0.005em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f5f5f5";
              e.currentTarget.style.borderColor = "#e0e0e0";
              e.currentTarget.style.color = "#111";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fafafa";
              e.currentTarget.style.borderColor = "#efefef";
              e.currentTarget.style.color = "#444";
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function LoadingHistory() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 0",
        gap: "8px",
      }}
    >
      <svg
        style={{ animation: "spin 0.75s linear infinite" }}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ccc"
        strokeWidth="2"
      >
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <p style={{ fontSize: "13px", color: "#bbb", fontFamily: font, margin: 0 }}>
        Loading conversation…
      </p>
    </div>
  );
}