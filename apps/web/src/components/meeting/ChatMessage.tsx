// apps/web/components/meeting/ChatMessage.tsx
"use client";

import type { UIMessage } from "@/hooks/meeting/useChat";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

interface Props {
  message: UIMessage;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  const isStreaming = message.isStreaming;

  if (isUser) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            maxWidth: "75%",
            background: "#111111",
            color: "#ffffff",
            borderRadius: "16px 16px 4px 16px",
            padding: "10px 14px",
            fontSize: "14px",
            lineHeight: 1.6,
            fontFamily: font,
            fontWeight: "450",
            letterSpacing: "-0.005em",
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        marginBottom: "16px",
      }}
    >
      {/* AI avatar */}
      <div
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "8px",
          background: "#f0f0f0",
          border: "1px solid #e8e8e8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#666"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
          <circle cx="9" cy="14" r="1" />
          <circle cx="15" cy="14" r="1" />
        </svg>
      </div>

      <div
        style={{
          maxWidth: "80%",
          background: "#f8f8f8",
          border: "1px solid #efefef",
          borderRadius: "4px 16px 16px 16px",
          padding: "10px 14px",
          fontSize: "14px",
          lineHeight: 1.75,
          fontFamily: font,
          color: "#333",
          letterSpacing: "-0.005em",
        }}
      >
        {isStreaming ? (
          <StreamingDots />
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}

function StreamingDots() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", height: "20px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#bbb",
            display: "inline-block",
            animation: "chatDotBounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes chatDotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}