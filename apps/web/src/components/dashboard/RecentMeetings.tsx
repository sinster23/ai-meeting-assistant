// apps/web/components/dashboard/RecentMeetings.tsx
"use client";

import Link from "next/link";
import { SectionLabel } from "./QuickActions";
import type { MeetingStatus } from "@repo/types";

interface MeetingRow {
  meetingId: string;
  status: MeetingStatus;
  createdAt: string;
  summary?: string | null;
}

const STATUS_CONFIG: Record<MeetingStatus, { label: string; color: string; bg: string; dot: string }> = {
  uploaded:   { label: "Queued",     color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  processing: { label: "Processing", color: "#374151", bg: "#f3f4f6", dot: "#6b7280" },
  completed:  { label: "Completed",  color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  failed:     { label: "Failed",     color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentMeetings({ meetings, isLoading }: { meetings: MeetingRow[]; isLoading: boolean }) {
  return (
    <div style={{ width: "100%", fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        marginBottom: "10px",
      }}>
        <div style={{
          width: "18px", height: "18px", borderRadius: "50%",
          border: "2px solid #22c55e",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#111111", letterSpacing: "-0.01em" }}>
          Recent Projects
        </span>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/dashboard/meetings" style={{
            fontSize: "12px", color: "#888888", textDecoration: "none", fontWeight: "500",
          }}>
            View all →
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{
          background: "#ffffff", border: "1px solid #e8e8e8",
          borderRadius: "14px", overflow: "hidden",
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: "52px",
              background: i % 2 === 0 ? "#fafafa" : "#ffffff",
              borderBottom: i < 3 ? "1px solid #f0f0f0" : "none",
            }} />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div style={{
          padding: "48px 24px", textAlign: "center",
          background: "#ffffff", border: "1px solid #e8e8e8",
          borderRadius: "14px", width: "100%", boxSizing: "border-box",
        }}>
          <div style={{ fontSize: "32px", marginBottom: "10px" }}>🎙️</div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#111111", marginBottom: "5px" }}>
            No meetings yet
          </div>
          <div style={{ fontSize: "12px", color: "#999999" }}>
            Start recording to see your meetings here.
          </div>
        </div>
      ) : (
        <div style={{
          background: "#ffffff", border: "1px solid #e8e8e8",
          borderRadius: "14px", overflow: "hidden",
          width: "100%", boxSizing: "border-box",
        }}>
          {meetings.map((meeting, idx) => {
            const s = STATUS_CONFIG[meeting.status];
            return (
              <Link
                key={meeting.meetingId}
                href={`/dashboard/meetings/${meeting.meetingId}`}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "13px 18px",
                  background: "#ffffff",
                  borderBottom: idx < meetings.length - 1 ? "1px solid #f0f0f0" : "none",
                  textDecoration: "none",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
              >
                {/* Circle checkbox */}
                <div style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  border: "1.5px solid #d0d0d0",
                  flexShrink: 0,
                }} />

                {/* Title + date */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "13.5px", fontWeight: "500", color: "#111111",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    letterSpacing: "-0.01em",
                  }}>
                    {meeting.summary
                      ? meeting.summary.slice(0, 70) + (meeting.summary.length > 70 ? "…" : "")
                      : `Meeting · ${meeting.meetingId.slice(-8)}`}
                  </div>
                </div>

                {/* Timestamp */}
                <div style={{ fontSize: "11px", color: "#bbbbbb", flexShrink: 0 }}>
                  {formatDate(meeting.createdAt)}
                </div>

                {/* Status badge */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  fontSize: "11px", fontWeight: "600",
                  color: s.color, background: s.bg,
                  padding: "3px 10px", borderRadius: "20px", flexShrink: 0,
                }}>
                  <div style={{
                    width: "5px", height: "5px", borderRadius: "50%",
                    background: s.dot,
                    boxShadow: meeting.status === "processing" ? `0 0 5px ${s.dot}` : "none",
                  }} />
                  {s.label}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}