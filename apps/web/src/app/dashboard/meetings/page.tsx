// apps/web/app/meetings/page.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMeetingsList } from "@/hooks/meeting/useMeetingsList";
import type { MeetingStatus } from "@repo/types";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

type FilterStatus = "all" | MeetingStatus;
type SortOption = "newest" | "oldest";

const STATUS_CONFIG: Record<MeetingStatus, { label: string; color: string; bg: string; dot: string }> = {
  uploaded:   { label: "Uploaded",    color: "#6366f1", bg: "#eef2ff", dot: "#6366f1" },
  processing: { label: "Processing…", color: "#0ea5e9", bg: "#e0f2fe", dot: "#0ea5e9" },
  completed:  { label: "Completed",   color: "#16a34a", bg: "#dcfce7", dot: "#16a34a" },
  failed:     { label: "Failed",      color: "#dc2626", bg: "#fee2e2", dot: "#dc2626" },
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return `Today · ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  if (diffDays === 1) return `Yesterday · ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function truncate(str: string | null, max: number): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max).trimEnd() + "…" : str;
}

// Strip markdown for preview
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,3} /gm, "")
    .replace(/^[\*\-•] /gm, "")
    .replace(/^\d+\. /gm, "")
    .replace(/\n+/g, " ")
    .trim();
}

export default function MeetingsPage() {
  const router = useRouter();
  const { data: meetings = [], isLoading } = useMeetingsList();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const filtered = useMemo(() => {
    let list = [...meetings];

    if (filterStatus !== "all") {
      list = list.filter((m) => m.status === filterStatus);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          (m as any).title?.toLowerCase().includes(q) ||
          m.summary?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });

    return list;
  }, [meetings, filterStatus, search, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: meetings.length };
    for (const m of meetings) {
      c[m.status] = (c[m.status] ?? 0) + 1;
    }
    return c;
  }, [meetings]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fafafa",
      fontFamily: font,
    }}>
<div style={{
  padding: "40px 58px 80px",
  boxSizing: "border-box",
  width: "100%",
}}>
        {/* ── Header ── */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontSize: "24px", fontWeight: "700", color: "#111111",
            letterSpacing: "-0.03em", margin: "0 0 6px", fontFamily: font,
          }}>
            Meetings
          </h1>
          <p style={{ fontSize: "14px", color: "#999999", margin: 0, fontFamily: font }}>
            Manage and revisit your recorded conversations.
          </p>
        </div>

        {/* ── Search + Sort row ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          marginBottom: "16px",
        }}>
          {/* Search */}
          <div style={{ flex: 1, position: "relative" }}>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search meetings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "9px 12px 9px 34px",
                fontSize: "13px", fontFamily: font, color: "#111",
                background: "#ffffff", border: "1px solid #e8e8e8",
                borderRadius: "10px", outline: "none",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "#c0c0c0")}
              onBlur={e => (e.target.style.borderColor = "#e8e8e8")}
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            style={{
              padding: "9px 12px", fontSize: "13px", fontFamily: font,
              color: "#555", background: "#ffffff", border: "1px solid #e8e8e8",
              borderRadius: "10px", outline: "none", cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        {/* ── Filter pills ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          marginBottom: "28px", flexWrap: "wrap",
        }}>
          {(["all", "completed", "processing", "uploaded", "failed"] as const).map((f) => {
            const isActive = filterStatus === f;
            const count = counts[f] ?? 0;
            return (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "5px 12px", borderRadius: "20px", cursor: "pointer",
                  fontSize: "12px", fontWeight: isActive ? "600" : "500",
                  fontFamily: font, border: "1px solid",
                  borderColor: isActive ? "#111111" : "#e8e8e8",
                  background: isActive ? "#111111" : "#ffffff",
                  color: isActive ? "#ffffff" : "#666666",
                  transition: "all 0.15s",
                }}
              >
                {f === "all" ? "All" : STATUS_CONFIG[f as MeetingStatus].label.replace("…", "")}
                <span style={{
                  fontSize: "11px",
                  color: isActive ? "rgba(255,255,255,0.65)" : "#bbb",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Meeting list ── */}
        {isLoading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={search.trim().length > 0} onRecord={() => router.push("/dashboard/record")} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {filtered.map((meeting, idx) => (
              <MeetingRow
                key={meeting.meetingId}
                meeting={meeting}
                isFirst={idx === 0}
                isLast={idx === filtered.length - 1}
                onClick={() => router.push(`/dashboard/meetings/${meeting.meetingId}`)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Meeting Row ────────────────────────────────────────────────────────────

function MeetingRow({
  meeting, isFirst, isLast, onClick,
}: {
  meeting: any;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[meeting.status as MeetingStatus];
  const isPending = meeting.status === "uploaded" || meeting.status === "processing";
  const title = meeting.title ?? "Untitled Meeting";
  const preview = meeting.summary ? truncate(stripMarkdown(meeting.summary), 100) : null;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "16px",
        padding: "16px 20px",
        background: "#ffffff",
        borderLeft: "1px solid #e8e8e8",
        borderRight: "1px solid #e8e8e8",
        borderTop: "1px solid #e8e8e8",
        borderBottom: isLast ? "1px solid #e8e8e8" : "none",
        borderRadius: isFirst && isLast ? "14px"
          : isFirst ? "14px 14px 0 0"
          : isLast ? "0 0 14px 14px"
          : "0",
        cursor: "pointer",
        transition: "background 0.12s",
        boxSizing: "border-box",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
      onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
    >
      {/* Status dot / spinner */}
      <div style={{ flexShrink: 0, width: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isPending
          ? <SpinnerSVG size={12} color={cfg.dot} />
          : <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
        }
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: preview ? "3px" : "0" }}>
          <span style={{
            fontSize: "14px", fontWeight: "600", color: "#111111",
            fontFamily: font, whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis", maxWidth: "340px",
          }}>
            {title}
          </span>
          <span style={{ fontSize: "12px", color: "#bbb", fontFamily: font, flexShrink: 0 }}>
            {formatDate(meeting.createdAt)}
          </span>
        </div>
        {preview && (
          <p style={{
            fontSize: "13px", color: "#888888", margin: 0,
            fontFamily: font, lineHeight: 1.5,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {preview}
          </p>
        )}
        {isPending && !preview && (
          <p style={{ fontSize: "13px", color: "#aaa", margin: 0, fontFamily: font }}>
            Processing your meeting…
          </p>
        )}
      </div>

      {/* Status pill */}
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        fontSize: "11px", fontWeight: "600", color: cfg.color,
        background: cfg.bg, padding: "3px 10px", borderRadius: "20px",
        fontFamily: font, flexShrink: 0,
      }}>
        {cfg.label}
      </span>

      {/* Chevron */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      {[1, 2, 3, 4, 5].map((i, idx, arr) => (
        <div key={i} style={{
          padding: "16px 20px",
          background: "#ffffff",
          border: "1px solid #e8e8e8",
          borderRadius: idx === 0 ? "14px 14px 0 0"
            : idx === arr.length - 1 ? "0 0 14px 14px"
            : "0",
          display: "flex", alignItems: "center", gap: "16px",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f0f0f0", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: `${140 + i * 30}px`, height: "13px", borderRadius: "6px", background: "#f0f0f0", marginBottom: "8px" }} />
            <div style={{ width: `${200 + i * 20}px`, height: "11px", borderRadius: "6px", background: "#f5f5f5" }} />
          </div>
          <div style={{ width: "72px", height: "22px", borderRadius: "20px", background: "#f0f0f0", flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ hasSearch, onRecord }: { hasSearch: boolean; onRecord: () => void }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "72px 0", textAlign: "center",
    }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "14px",
        background: "#f5f5f5", display: "flex", alignItems: "center",
        justifyContent: "center", marginBottom: "16px",
      }}>
        {hasSearch
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
        }
      </div>
      <p style={{ fontSize: "15px", fontWeight: "600", color: "#333", fontFamily: font, margin: "0 0 6px" }}>
        {hasSearch ? "No meetings found" : "No meetings yet"}
      </p>
      <p style={{ fontSize: "13px", color: "#bbb", fontFamily: font, margin: "0 0 24px" }}>
        {hasSearch ? "Try a different search term or clear filters." : "Record or import a conversation to get started."}
      </p>
      {!hasSearch && (
        <button
          onClick={onRecord}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "9px 18px", borderRadius: "10px", cursor: "pointer",
            fontSize: "13px", fontWeight: "600", fontFamily: font,
            border: "none", background: "#111111", color: "#ffffff",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
          Start Recording
        </button>
      )}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────

function SpinnerSVG({ size = 14, color = "#999" }: { size?: number; color?: string }) {
  return (
    <svg style={{ animation: "spin 0.75s linear infinite", display: "block" }}
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}