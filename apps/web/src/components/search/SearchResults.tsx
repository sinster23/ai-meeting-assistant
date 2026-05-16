// apps/web/components/search/SearchResults.tsx
"use client";

import { SourceMeetingCard } from "./SourceMeetingCard";
import type { SearchResponse } from "@repo/types";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

// ── Skeleton ──────────────────────────────────────────────────────────────

export function SearchResultsSkeleton() {
  return (
    <div style={{ animation: "searchFadeIn 0.3s ease" }}>
      {/* Answer skeleton */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e8e8e8",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#f0f0f0" }} />
          <div style={{ width: "80px", height: "11px", borderRadius: "6px", background: "#f0f0f0" }} />
        </div>
        {[100, 85, 92, 60].map((w, i) => (
          <div
            key={i}
            style={{
              width: `${w}%`,
              height: "13px",
              borderRadius: "6px",
              background: "#f4f4f4",
              marginBottom: "10px",
            }}
          />
        ))}
      </div>

      {/* Source skeletons */}
      <div style={{ marginBottom: "10px" }}>
        <div style={{ width: "60px", height: "11px", borderRadius: "6px", background: "#f0f0f0", marginBottom: "10px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                padding: "13px 16px",
                background: "#ffffff",
                border: "1px solid #e8e8e8",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div style={{ width: "24px", height: "24px", borderRadius: "7px", background: "#f0f0f0", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: `${100 + i * 40}px`, height: "13px", borderRadius: "6px", background: "#f0f0f0", marginBottom: "5px" }} />
                <div style={{ width: "50px", height: "10px", borderRadius: "6px", background: "#f5f5f5" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes searchFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────

export function SearchError({ message }: { message: string }) {
  return (
    <div style={{
      background: "#fff8f8",
      border: "1px solid #fecaca",
      borderRadius: "16px",
      padding: "20px 24px",
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      animation: "searchFadeIn 0.3s ease",
      fontFamily: font,
    }}>
      <div style={{
        width: "32px",
        height: "32px",
        borderRadius: "10px",
        background: "#fee2e2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: "#991b1b", marginBottom: "3px" }}>
          Search failed
        </div>
        <div style={{ fontSize: "12.5px", color: "#b91c1c" }}>
          {message}
        </div>
      </div>
      <style>{`
        @keyframes searchFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Main results ──────────────────────────────────────────────────────────

interface SearchResultsProps {
  result: SearchResponse;
  query: string;
}

export function SearchResults({ result, query }: SearchResultsProps) {
  const { answer, sources } = result;
  const hasNoInfo =
    answer.toLowerCase().includes("no relevant") ||
    answer.toLowerCase().includes("not found") ||
    sources.length === 0;

  return (
    <div style={{ animation: "searchFadeIn 0.35s ease" }}>
      {/* ── AI Answer panel ── */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e8e8e8",
        borderRadius: "16px",
        padding: "22px 24px",
        marginBottom: "20px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        fontFamily: font,
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginBottom: "14px",
        }}>
          <div style={{
            width: "22px",
            height: "22px",
            borderRadius: "7px",
            background: "#111111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#888888",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}>
            AI Answer
          </span>

          {/* Query echo */}
          <span style={{
            marginLeft: "auto",
            fontSize: "11.5px",
            color: "#bbbbbb",
            fontStyle: "italic",
            maxWidth: "320px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            "{query}"
          </span>
        </div>

        {/* Answer text */}
        <p style={{
          fontSize: "14px",
          lineHeight: "1.65",
          color: hasNoInfo ? "#999999" : "#111111",
          margin: 0,
          fontFamily: font,
          letterSpacing: "-0.005em",
        }}>
          {answer}
        </p>
      </div>

      {/* ── Sources ── */}
      {sources.length > 0 && (
        <div>
          <div style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#bbbbbb",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            marginBottom: "10px",
            fontFamily: font,
          }}>
            Sources
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sources.map((source, idx) => (
              <SourceMeetingCard
                key={source.meetingId}
                source={source}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes searchFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}