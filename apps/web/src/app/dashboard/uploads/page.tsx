// apps/web/app/uploads/page.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUploadsList } from "@/hooks/upload/useUploadList";
import { useUploadsStats } from "@/hooks/upload/useUploadStats";
import { useDeleteUpload, useRetryUpload } from "@/hooks/upload/useUploadActions";
import { UploadModal } from "@/components/upload/UploadModal";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

// ── Types ─────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "completed" | "processing" | "failed" | "uploaded";
type SortOption   = "newest" | "oldest";

// ── Status config — mirrors RecentMeetings.tsx exactly ────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  uploaded:   { label: "Queued",     color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  processing: { label: "Processing", color: "#374151", bg: "#f3f4f6", dot: "#6b7280" },
  completed:  { label: "Completed",  color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  failed:     { label: "Failed",     color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
};

// ── Format helpers ────────────────────────────────────────────────────────

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Status pill ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] ?? STATUS_CONFIG.uploaded;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "11px",
      fontWeight: "600",
      color: s.color,
      background: s.bg,
      padding: "3px 10px",
      borderRadius: "20px",
      flexShrink: 0,
      fontFamily: font,
    }}>
      <div style={{
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        background: s.dot,
        boxShadow: status === "processing" ? `0 0 5px ${s.dot}` : "none",
      }} />
      {s.label}
    </div>
  );
}

// ── Stats cards — mirrors StatsCards.tsx structure ────────────────────────

function UploadStats({
  total,
  totalSize,
  totalDuration,
}: {
  total: number;
  totalSize: number;
  totalDuration: number;
}) {
  const stats = [
    {
      label: "Total Uploads",
      value: String(total),
      subLabel: total === 1 ? "1 file imported" : `${total} files imported`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      ),
    },
    {
      label: "Total Duration",
      value: formatDuration(totalDuration),
      subLabel: "across all uploads",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: "Storage Used",
      value: formatSize(totalSize),
      subLabel: "of local storage",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "14px",
      marginBottom: "28px",
    }}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            background: "#ffffff",
            border: "1px solid #e8e8e8",
            borderRadius: "14px",
            padding: "18px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            fontFamily: font,
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
          }}
        >
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "#f4f4f4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            {stat.icon}
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "500", color: "#999999", letterSpacing: "0.01em", marginBottom: "2px" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#111111", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "11px", color: "#bbbbbb", marginTop: "2px" }}>
              {stat.subLabel}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Upload row — mirrors RecentMeetings row structure ─────────────────────

function UploadRow({
  upload,
  isLast,
  onOpen,
  onRetry,
  onDelete,
  isRetrying,
  isDeleting,
}: {
  upload: any;
  isLast: boolean;
  onOpen: () => void;
  onRetry: () => void;
  onDelete: () => void;
  isRetrying: boolean;
  isDeleting: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const s = STATUS_CONFIG[upload.status] ?? STATUS_CONFIG.uploaded;
  const name = upload.originalFileName ?? "Untitled upload";
  const canOpen = !!upload.meetingId && upload.status !== "failed";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "13px 18px",
        background: hovered ? "#fafafa" : "#ffffff",
        borderBottom: isLast ? "none" : "1px solid #f0f0f0",
        transition: "background 0.1s",
      }}
    >
      {/* Circle checkbox — matches RecentMeetings */}
      <div style={{
        width: "18px",
        height: "18px",
        borderRadius: "50%",
        border: "1.5px solid #d0d0d0",
        flexShrink: 0,
      }} />

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <button
          onClick={onOpen}
          disabled={!canOpen}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: canOpen ? "pointer" : "default",
            textAlign: "left",
            width: "100%",
          }}
        >
          <div style={{
            fontSize: "13.5px",
            fontWeight: "500",
            color: "#111111",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            letterSpacing: "-0.01em",
            fontFamily: font,
          }}>
            {name}
          </div>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
          {upload.durationSeconds && (
            <span style={{ fontSize: "11px", color: "#bbbbbb", fontFamily: font }}>
              {formatDuration(upload.durationSeconds)}
            </span>
          )}
          {upload.durationSeconds && upload.fileSizeBytes && (
            <span style={{ color: "#e0e0e0", fontSize: "11px" }}>·</span>
          )}
          {upload.fileSizeBytes && (
            <span style={{ fontSize: "11px", color: "#bbbbbb", fontFamily: font }}>
              {formatSize(upload.fileSizeBytes)}
            </span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div style={{ fontSize: "11px", color: "#bbbbbb", flexShrink: 0, fontFamily: font }}>
        {formatRelative(upload.createdAt)}
      </div>

      {/* Status pill */}
      <StatusPill status={upload.status} />

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        {upload.status === "failed" && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            style={{
              background: "none",
              border: "1px solid #e8e8e8",
              borderRadius: "7px",
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: "11.5px",
              fontWeight: "600",
              color: "#555555",
              fontFamily: font,
              opacity: isRetrying ? 0.5 : 1,
              transition: "border-color 0.15s, opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#bbbbbb")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e8e8e8")}
          >
            {isRetrying ? "Retrying…" : "Retry"}
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={isDeleting}
          title="Delete"
          style={{
            background: "none",
            border: "none",
            padding: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            opacity: isDeleting ? 0.3 : hovered ? 0.5 : 0.15,
            transition: "opacity 0.15s",
            borderRadius: "5px",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────

function FilterBar({
  filterStatus,
  onFilterChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
  counts,
}: {
  filterStatus: FilterStatus;
  onFilterChange: (s: FilterStatus) => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  search: string;
  onSearchChange: (s: string) => void;
  counts: Record<string, number>;
}) {
  const tabs: { key: FilterStatus; label: string }[] = [
    { key: "all",        label: "All"        },
    { key: "completed",  label: "Completed"  },
    { key: "processing", label: "Processing" },
    { key: "failed",     label: "Failed"     },
  ];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      marginBottom: "10px",
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", gap: "2px" }}>
        {tabs.map((t) => {
          const active = filterStatus === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onFilterChange(t.key)}
              style={{
                padding: "5px 12px",
                borderRadius: "8px",
                border: "none",
                background: active ? "#111111" : "transparent",
                color: active ? "#ffffff" : "#888888",
                fontSize: "12.5px",
                fontWeight: active ? "600" : "500",
                fontFamily: font,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {t.label}
              {(counts[t.key] ?? 0) > 0 && (
                <span style={{
                  background: active ? "rgba(255,255,255,0.2)" : "#eeeeee",
                  color: active ? "#ffffff" : "#888888",
                  borderRadius: "10px",
                  padding: "0 6px",
                  fontSize: "10.5px",
                  fontWeight: "700",
                  lineHeight: "17px",
                  display: "inline-block",
                }}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#bbbbbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              padding: "6px 10px 6px 28px",
              borderRadius: "8px",
              border: "1px solid #e8e8e8",
              fontSize: "12.5px",
              fontFamily: font,
              color: "#111111",
              background: "#ffffff",
              outline: "none",
              width: "170px",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#aaaaaa")}
            onBlur={(e)  => (e.target.style.borderColor = "#e8e8e8")}
          />
        </div>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          style={{
            padding: "6px 10px",
            borderRadius: "8px",
            border: "1px solid #e8e8e8",
            fontSize: "12.5px",
            fontFamily: font,
            color: "#555555",
            background: "#ffffff",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e8e8e8",
      borderRadius: "14px",
      overflow: "hidden",
    }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            padding: "13px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            borderBottom: i < 4 ? "1px solid #f0f0f0" : "none",
          }}
        >
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#f0f0f0", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: `${120 + i * 40}px`, height: "13px", borderRadius: "6px", background: "#f0f0f0", marginBottom: "6px" }} />
            <div style={{ width: `${80 + i * 20}px`, height: "10px", borderRadius: "6px", background: "#f5f5f5" }} />
          </div>
          <div style={{ width: "48px", height: "10px", borderRadius: "6px", background: "#f5f5f5" }} />
          <div style={{ width: "72px", height: "22px", borderRadius: "20px", background: "#f0f0f0" }} />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

function EmptyState({ hasSearch, onImport }: { hasSearch: boolean; onImport: () => void }) {
  return (
    <div style={{
      padding: "48px 24px",
      textAlign: "center",
      background: "#ffffff",
      border: "1px solid #e8e8e8",
      borderRadius: "14px",
    }}>
      <div style={{ fontSize: "32px", marginBottom: "10px" }}>
        {hasSearch ? "🔍" : "📂"}
      </div>
      <div style={{ fontSize: "14px", fontWeight: "600", color: "#111111", marginBottom: "5px", fontFamily: font }}>
        {hasSearch ? "No uploads found" : "No uploads yet"}
      </div>
      <div style={{ fontSize: "12px", color: "#999999", fontFamily: font, marginBottom: hasSearch ? 0 : "20px" }}>
        {hasSearch
          ? "Try a different search or clear filters."
          : "Import an audio or video file to get started."}
      </div>
      {!hasSearch && (
        <button
          onClick={onImport}
          style={{
            display: "inline-flex",
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
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Import File
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function UploadsPage() {
  const router = useRouter();

  const { data: uploads = [], isLoading } = useUploadsList();
  const { data: stats } = useUploadsStats();

  const deleteUpload = useDeleteUpload();
  const retryUpload  = useRetryUpload();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState<FilterStatus>("all");
  const [sort,          setSort]          = useState<SortOption>("newest");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: uploads.length };
    for (const r of uploads) c[(r as any).status] = (c[(r as any).status] ?? 0) + 1;
    return c;
  }, [uploads]);

  const filtered = useMemo(() => {
    let list = [...uploads] as any[];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.originalFileName?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });
    return list;
  }, [uploads, filterStatus, search, sort]);

  const totalSize     = uploads.reduce((s: number, r: any) => s + (r.fileSizeBytes   ?? 0), 0);
  const totalDuration = uploads.reduce((s: number, r: any) => s + (r.durationSeconds ?? 0), 0);

  function handleUploadSuccess(meetingId: string) {
    router.push(`/dashboard/meetings/${meetingId}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: font }}>
      <div style={{
        padding: "40px 58px 32px 48px",
        boxSizing: "border-box",
        width: "100%",
        transition: "padding 0.3s ease",
      }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "32px",
          gap: "16px",
        }}>
          <div>
            <h1 style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#111111",
              letterSpacing: "-0.03em",
              margin: "0 0 6px",
              fontFamily: font,
            }}>
              Uploads
            </h1>
            <p style={{ fontSize: "14px", color: "#999999", margin: 0, fontFamily: font }}>
              Audio and video files imported for transcription.
            </p>
          </div>

          {/* Import button — matches QuickActions Import card */}
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              fontFamily: font,
              border: "1px solid #e8e8e8",
              background: "#ffffff",
              color: "#111111",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              transition: "box-shadow 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.10)";
              e.currentTarget.style.borderColor = "#d0d0d0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
              e.currentTarget.style.borderColor = "#e8e8e8";
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import File
          </button>
        </div>

        {/* ── Stats cards ── */}
        {uploads.length > 0 && (
          <UploadStats
            total={uploads.length}
            totalSize={totalSize}
            totalDuration={totalDuration}
          />
        )}

        {/* ── Privacy badge — matches StatsCards.tsx ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span style={{ fontSize: "12px", fontWeight: "500", color: "#555555", fontFamily: font }}>
            Everything stored locally — your data never leaves your device
          </span>
        </div>

        {/* ── Filters ── */}
        <FilterBar
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          sort={sort}
          onSortChange={setSort}
          search={search}
          onSearchChange={setSearch}
          counts={counts}
        />

        {/* ── List — same white card container as RecentMeetings ── */}
        {isLoading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState
            hasSearch={search.trim().length > 0}
            onImport={() => setShowUploadModal(true)}
          />
        ) : (
          <div style={{
            background: "#ffffff",
            border: "1px solid #e8e8e8",
            borderRadius: "14px",
            overflow: "hidden",
          }}>
            {filtered.map((upload: any, idx: number) => (
              <UploadRow
                key={upload.recordingId}
                upload={upload}
                isLast={idx === filtered.length - 1}
                onOpen={() => {
                  if (upload.meetingId) router.push(`/dashboard/meetings/${upload.meetingId}`);
                }}
                onRetry={() => retryUpload.mutate(upload.recordingId)}
                onDelete={() => deleteUpload.mutate(upload.recordingId)}
                isRetrying={retryUpload.isPending && retryUpload.variables === upload.recordingId}
                isDeleting={deleteUpload.isPending && deleteUpload.variables === upload.recordingId}
              />
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
}