// apps/web/app/uploads/page.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUploadsList } from "@/hooks/upload/useUploadList";
import { useUploadsStats } from "@/hooks/upload/useUploadStats";
import { useDeleteUpload, useRetryUpload } from "@/hooks/upload/useUploadActions";
import { UploadModal } from "@/components/upload/UploadModal";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

// ── Purple palette — mirrors meetings page exactly ────────────────────────

const purple = {
  50:  "#EEEDFE",
  100: "#CECBF6",
  200: "#AFA9EC",
  400: "#7F77DD",
  600: "#534AB7",
  800: "#3C3489",
  900: "#26215C",
};

// ── Types ─────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "completed" | "processing" | "failed" | "uploaded";
type SortOption   = "newest" | "oldest";

// ── Status config — purple-themed ─────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  uploaded:   { label: "Queued",     color: purple[800], bg: purple[50],  dot: purple[600] },
  processing: { label: "Processing", color: "#0369a1",   bg: "#e0f2fe",   dot: "#0ea5e9"   },
  completed:  { label: "Completed",  color: "#15803d",   bg: "#dcfce7",   dot: "#16a34a"   },
  failed:     { label: "Failed",     color: "#dc2626",   bg: "#fee2e2",   dot: "#dc2626"   },
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

// ── Spinner ───────────────────────────────────────────────────────────────

function SpinnerSVG({ size = 14 }: { size?: number }) {
  return (
    <svg
      style={{ animation: "spin 0.75s linear infinite", display: "block" }}
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={purple[400]} strokeWidth="2.5"
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] ?? STATUS_CONFIG.uploaded;
  const isPending = status === "processing" || status === "uploaded";
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
      {isPending
        ? <SpinnerSVG size={10} />
        : <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.dot }} />
      }
      {s.label}
    </div>
  );
}

// ── Stats cards ───────────────────────────────────────────────────────────

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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
            border: `1px solid ${purple[100]}`,
            borderRadius: "14px",
            padding: "18px 20px",
            boxShadow: `0 1px 3px rgba(83,74,183,0.06)`,
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
            background: purple[50],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            {stat.icon}
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "500", color: purple[400], letterSpacing: "0.01em", marginBottom: "2px" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#111111", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "11px", color: purple[200], marginTop: "2px" }}>
              {stat.subLabel}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Upload row ────────────────────────────────────────────────────────────

function UploadRow({
  upload,
  isFirst,
  isLast,
  onOpen,
  onRetry,
  onDelete,
  isRetrying,
  isDeleting,
}: {
  upload: any;
  isFirst: boolean;
  isLast: boolean;
  onOpen: () => void;
  onRetry: () => void;
  onDelete: () => void;
  isRetrying: boolean;
  isDeleting: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const name = upload.originalFileName ?? "Untitled upload";
  const canOpen = !!upload.meetingId && upload.status !== "failed";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        background: hovered ? purple[50] : "#ffffff",
        borderLeft: `1px solid ${purple[100]}`,
        borderRight: `1px solid ${purple[100]}`,
        borderTop: `1px solid ${purple[100]}`,
        borderBottom: isLast ? `1px solid ${purple[100]}` : "none",
        borderRadius: isFirst && isLast ? "14px"
          : isFirst ? "14px 14px 0 0"
          : isLast ? "0 0 14px 14px"
          : "0",
        transition: "background 0.12s",
        boxSizing: "border-box",
      }}
    >
      {/* Status dot / spinner */}
      <div style={{ flexShrink: 0, width: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {upload.status === "processing" || upload.status === "uploaded"
          ? <SpinnerSVG size={12} />
          : <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: STATUS_CONFIG[upload.status]?.dot ?? purple[400],
              display: "inline-block",
            }} />
        }
      </div>

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
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
            marginBottom: upload.durationSeconds || upload.fileSizeBytes ? "3px" : 0,
          }}>
            <span style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#111111",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "340px",
              fontFamily: font,
            }}>
              {name}
            </span>
            <span style={{ fontSize: "12px", color: purple[400], fontFamily: font, flexShrink: 0 }}>
              {formatRelative(upload.createdAt)}
            </span>
          </div>
        </button>
        {(upload.durationSeconds || upload.fileSizeBytes) && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {upload.durationSeconds && (
              <span style={{ fontSize: "13px", color: "#888888", fontFamily: font }}>
                {formatDuration(upload.durationSeconds)}
              </span>
            )}
            {upload.durationSeconds && upload.fileSizeBytes && (
              <span style={{ color: purple[100], fontSize: "11px" }}>·</span>
            )}
            {upload.fileSizeBytes && (
              <span style={{ fontSize: "13px", color: "#888888", fontFamily: font }}>
                {formatSize(upload.fileSizeBytes)}
              </span>
            )}
          </div>
        )}
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
              border: `1px solid ${purple[100]}`,
              borderRadius: "7px",
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: "11.5px",
              fontWeight: "600",
              color: purple[600],
              fontFamily: font,
              opacity: isRetrying ? 0.5 : 1,
              transition: "border-color 0.15s, background 0.15s, opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = purple[200];
              e.currentTarget.style.background = purple[50];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = purple[100];
              e.currentTarget.style.background = "none";
            }}
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

        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={purple[200]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
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
      marginBottom: "16px",
      flexWrap: "wrap",
    }}>
      {/* Filter pills — matches meetings page exactly */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        {tabs.map((t) => {
          const isActive = filterStatus === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onFilterChange(t.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: isActive ? "600" : "500",
                fontFamily: font,
                border: "1px solid",
                borderColor: isActive ? purple[600] : purple[100],
                background: isActive ? purple[600] : "#ffffff",
                color: isActive ? "#ffffff" : purple[600],
                transition: "all 0.15s",
                boxShadow: isActive ? `0 1px 3px rgba(83,74,183,0.20)` : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = purple[50];
                  e.currentTarget.style.borderColor = purple[200];
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = purple[100];
                }
              }}
            >
              {t.label}
              <span style={{
                fontSize: "11px",
                color: isActive ? "rgba(255,255,255,0.65)" : purple[400],
              }}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={purple[400]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search uploads…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              padding: "9px 12px 9px 34px",
              borderRadius: "10px",
              border: `1px solid ${purple[100]}`,
              fontSize: "13px",
              fontFamily: font,
              color: "#111",
              background: "#ffffff",
              outline: "none",
              width: "170px",
              boxShadow: `0 1px 3px rgba(83,74,183,0.06)`,
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = purple[200])}
            onBlur={(e)  => (e.target.style.borderColor = purple[100])}
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          style={{
            padding: "9px 12px",
            borderRadius: "10px",
            border: `1px solid ${purple[100]}`,
            fontSize: "13px",
            fontFamily: font,
            color: purple[800],
            background: "#ffffff",
            cursor: "pointer",
            outline: "none",
            boxShadow: `0 1px 3px rgba(83,74,183,0.06)`,
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      {[1, 2, 3, 4, 5].map((i, idx, arr) => (
        <div
          key={i}
          style={{
            padding: "16px 20px",
            background: "#ffffff",
            border: `1px solid ${purple[100]}`,
            borderRadius: idx === 0 ? "14px 14px 0 0"
              : idx === arr.length - 1 ? "0 0 14px 14px"
              : "0",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: purple[100], flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: `${120 + i * 40}px`, height: "13px", borderRadius: "6px", background: purple[50], marginBottom: "8px" }} />
            <div style={{ width: `${80 + i * 20}px`, height: "11px", borderRadius: "6px", background: purple[50] }} />
          </div>
          <div style={{ width: "48px", height: "11px", borderRadius: "6px", background: purple[50] }} />
          <div style={{ width: "72px", height: "22px", borderRadius: "20px", background: purple[50] }} />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

function EmptyState({ hasSearch, onImport }: { hasSearch: boolean; onImport: () => void }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "72px 0",
      textAlign: "center",
    }}>
      <div style={{
        width: "48px",
        height: "48px",
        borderRadius: "14px",
        background: purple[50],
        border: `1px solid ${purple[100]}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "16px",
      }}>
        {hasSearch
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
        }
      </div>
      <p style={{ fontSize: "15px", fontWeight: "600", color: "#333", fontFamily: font, margin: "0 0 6px" }}>
        {hasSearch ? "No uploads found" : "No uploads yet"}
      </p>
      <p style={{ fontSize: "13px", color: purple[400], fontFamily: font, margin: "0 0 24px" }}>
        {hasSearch
          ? "Try a different search term or clear filters."
          : "Import an audio or video file to get started."}
      </p>
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
            background: purple[600],
            color: "#ffffff",
            transition: "all 0.15s",
            boxShadow: `0 1px 3px rgba(83,74,183,0.25)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = purple[800];
            e.currentTarget.style.boxShadow = `0 2px 6px rgba(83,74,183,0.35)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = purple[600];
            e.currentTarget.style.boxShadow = `0 1px 3px rgba(83,74,183,0.25)`;
          }}
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

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4fb", fontFamily: font }}>
      <div style={{
        padding: "40px 58px 80px",
        boxSizing: "border-box",
        width: "100%",
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
              fontSize: "22px",
              fontWeight: "700",
              color: "#111111",
              letterSpacing: "-0.025em",
              margin: "0 0 6px",
              fontFamily: font,
            }}>
              Uploads
            </h1>
            <p style={{ fontSize: "14px", color: "#888888", margin: 0, fontFamily: font }}>
              Audio and video files imported for transcription.
            </p>
          </div>

          {/* Import button */}
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
              border: "none",
              background: purple[600],
              color: "#ffffff",
              boxShadow: `0 1px 3px rgba(83,74,183,0.25)`,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = purple[800];
              e.currentTarget.style.boxShadow = `0 2px 6px rgba(83,74,183,0.35)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = purple[600];
              e.currentTarget.style.boxShadow = `0 1px 3px rgba(83,74,183,0.25)`;
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

        {/* ── Privacy badge ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
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

        {/* ── List ── */}
        {isLoading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState
            hasSearch={search.trim().length > 0}
            onImport={() => setShowUploadModal(true)}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {filtered.map((upload: any, idx: number) => (
              <UploadRow
                key={upload.recordingId}
                upload={upload}
                isFirst={idx === 0}
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