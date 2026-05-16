// apps/web/components/search/SourceMeetingCard.tsx
"use client";

import { useRouter } from "next/navigation";
import type { SourceMeeting } from "@repo/types";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const STATUS_DOT: Record<string, string> = {
  completed:  "#10b981",
  processing: "#6b7280",
  uploaded:   "#f59e0b",
  failed:     "#ef4444",
};

interface SourceMeetingCardProps {
  source: SourceMeeting;
  index: number;
}

export function SourceMeetingCard({ source, index }: SourceMeetingCardProps) {
  const router = useRouter();

  const name = source.originalFileName ?? "Untitled meeting";
  const dot  = STATUS_DOT[source.status] ?? STATUS_DOT.uploaded;
  const canOpen = source.status === "completed";

  function handleClick() {
    if (canOpen) {
      router.push(`/dashboard/meetings/${source.meetingId}`);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!canOpen}
      title={canOpen ? `Open ${name}` : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "13px 16px",
        background: "#ffffff",
        border: "1px solid #e8e8e8",
        borderRadius: "12px",
        cursor: canOpen ? "pointer" : "default",
        textAlign: "left",
        width: "100%",
        fontFamily: font,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.15s, border-color 0.15s",
        opacity: canOpen ? 1 : 0.7,
      }}
      onMouseEnter={(e) => {
        if (!canOpen) return;
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.09)";
        e.currentTarget.style.borderColor = "#d0d0d0";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
        e.currentTarget.style.borderColor = "#e8e8e8";
      }}
    >
      {/* Index badge */}
      <div style={{
        width: "24px",
        height: "24px",
        borderRadius: "7px",
        background: "#f4f4f4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: "11px",
        fontWeight: "700",
        color: "#888888",
        letterSpacing: "-0.01em",
      }}>
        {index + 1}
      </div>

      {/* Name + date */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "13px",
          fontWeight: "600",
          color: "#111111",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          marginBottom: "2px",
        }}>
          {name}
        </div>
        <div style={{
          fontSize: "11px",
          color: "#bbbbbb",
          fontFamily: font,
        }}>
          {formatRelative(source.createdAt)}
        </div>
      </div>

      {/* Status dot */}
      <div style={{
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: dot,
        flexShrink: 0,
        boxShadow: source.status === "processing" ? `0 0 5px ${dot}` : "none",
      }} />

      {/* Arrow — only when openable */}
      {canOpen && (
        <svg
          width="13" height="13" viewBox="0 0 24 24"
          fill="none" stroke="#cccccc" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      )}
    </button>
  );
}