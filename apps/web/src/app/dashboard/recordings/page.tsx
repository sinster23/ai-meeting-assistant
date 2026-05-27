// apps/web/app/recordings/page.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRecordingsList } from "@/hooks/recording/useRecordingsList";
import { useStorageStats } from "@/hooks/recording/useStorageStats";
import {
  useDeleteRecording,
  useRetryRecording,
} from "@/hooks/recording/useRecordingActions";
import { RecordingControls } from "@/components/recording/RecordingControls";
import { RecordingFilters } from "@/components/recording/RecordingFilters";
import type { FilterStatus, SortOption } from "@/components/recording/RecordingFilters";
import { RecordingCard } from "@/components/recording/RecordingCard";
import { StorageStatsCard } from "@/components/recording/StorageStats";
import { RecordingBar } from "@/components/recording/RecordingBar";
import type { RecordingStatus } from "@repo/types";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

const purple = {
  50:  "#EEEDFE",
  100: "#CECBF6",
  200: "#AFA9EC",
  400: "#7F77DD",
  600: "#534AB7",
  800: "#3C3489",
  900: "#26215C",
};

export default function RecordingsPage() {
  const router = useRouter();

  const { data: recordings = [], isLoading } = useRecordingsList();
  const { data: stats, isLoading: statsLoading } = useStorageStats();

  const deleteRecording = useDeleteRecording();
  const retryRecording = useRetryRecording();

  const [showRecordingBar, setShowRecordingBar] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: recordings.length };
    for (const r of recordings) {
      c[r.status] = (c[r.status] ?? 0) + 1;
    }
    return c;
  }, [recordings]);

  const filtered = useMemo(() => {
    let list = [...recordings];

    if (filterStatus !== "all") {
      list = list.filter((r) => r.status === filterStatus);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.originalFileName?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });

    return list;
  }, [recordings, filterStatus, search, sort]);

  function handleUploadSuccess(meetingId: string) {
    router.push(`/dashboard/meetings/${meetingId}`);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f4fb",
        fontFamily: font,
      }}
    >
      <div
        style={{
          padding: showRecordingBar
            ? "40px 58px 160px"
            : "40px 58px 80px",
          boxSizing: "border-box",
          width: "100%",
          transition: "padding 0.3s ease",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "32px",
            gap: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "#111111",
                letterSpacing: "-0.025em",
                margin: "0 0 6px",
                fontFamily: font,
              }}
            >
              Recordings
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#888888",
                margin: 0,
                fontFamily: font,
              }}
            >
              Manage your captured meeting audio.
            </p>
          </div>
        </div>

        {/* ── Recording Agent card ── */}
        <RecordingControls
          recordingBarVisible={showRecordingBar}
          onToggleRecordingBar={() => setShowRecordingBar((v) => !v)}
        />

        {/* ── Filters ── */}
        <RecordingFilters
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          sort={sort}
          onSortChange={setSort}
          search={search}
          onSearchChange={setSearch}
          counts={counts}
        />

        {/* ── Recording list ── */}
        {isLoading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState
            hasSearch={search.trim().length > 0}
            onStartRecording={() => setShowRecordingBar(true)}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {filtered.map((recording, idx) => (
              <RecordingCard
                key={recording.recordingId}
                recording={recording}
                isFirst={idx === 0}
                isLast={idx === filtered.length - 1}
                onOpen={() => {
                  if (recording.meetingId) {
                    router.push(`/dashboard/meetings/${recording.meetingId}`);
                  }
                }}
                onRetry={() => retryRecording.mutate(recording.recordingId)}
                onDelete={() => deleteRecording.mutate(recording.recordingId)}
                isRetrying={
                  retryRecording.isPending &&
                  retryRecording.variables === recording.recordingId
                }
                isDeleting={
                  deleteRecording.isPending &&
                  deleteRecording.variables === recording.recordingId
                }
              />
            ))}
          </div>
        )}

        {/* ── Storage stats ── */}
        <StorageStatsCard stats={stats} isLoading={statsLoading} />
      </div>

      {/* ── Recording bar (floating) ── */}
      {showRecordingBar && (
        <RecordingBar
          onUploadSuccess={handleUploadSuccess}
          onDismiss={() => setShowRecordingBar(false)}
        />
      )}
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      {[1, 2, 3, 4].map((i, idx, arr) => (
        <div
          key={i}
          style={{
            padding: "16px 20px",
            background: "#ffffff",
            border: `1px solid ${purple[100]}`,
            borderRadius:
              idx === 0
                ? "14px 14px 0 0"
                : idx === arr.length - 1
                ? "0 0 14px 14px"
                : "0",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: purple[100],
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: `${120 + i * 40}px`,
                height: "13px",
                borderRadius: "6px",
                background: purple[50],
                marginBottom: "8px",
              }}
            />
            <div
              style={{
                width: `${160 + i * 20}px`,
                height: "11px",
                borderRadius: "6px",
                background: purple[50],
              }}
            />
          </div>
          <div
            style={{
              width: "72px",
              height: "22px",
              borderRadius: "20px",
              background: purple[50],
              flexShrink: 0,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({
  hasSearch,
  onStartRecording,
}: {
  hasSearch: boolean;
  onStartRecording: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "72px 0",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background: purple[50],
          border: `1px solid ${purple[100]}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        {hasSearch ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </div>
      <p style={{ fontSize: "15px", fontWeight: "600", color: "#333", fontFamily: font, margin: "0 0 6px" }}>
        {hasSearch ? "No recordings found" : "No recordings yet"}
      </p>
      <p style={{ fontSize: "13px", color: purple[400], fontFamily: font, margin: "0 0 24px" }}>
        {hasSearch
          ? "Try a different search or clear filters."
          : "Start a recording to capture your next meeting."}
      </p>
      {!hasSearch && (
        <button
          onClick={onStartRecording}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 18px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
            fontFamily: font,
            border: "none",
            background: "#111111",
            color: "#ffffff",
            transition: "all 0.15s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
          Start Recording
        </button>
      )}
    </div>
  );
}