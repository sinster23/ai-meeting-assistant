// apps/web/components/recordings/RecordingCard.tsx

"use client";

import type { RecordingListItem, RecordingStatus } from "@repo/types";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

const STATUS_CONFIG: Record<
  RecordingStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  recorded: {
    label: "Recorded",
    color: "#6366f1",
    bg: "#eef2ff",
    dot: "#6366f1",
  },
  processing: {
    label: "Processing…",
    color: "#0ea5e9",
    bg: "#e0f2fe",
    dot: "#0ea5e9",
  },
  completed: {
    label: "Completed",
    color: "#16a34a",
    bg: "#dcfce7",
    dot: "#16a34a",
  },
  failed: { label: "Failed", color: "#dc2626", bg: "#fee2e2", dot: "#dc2626" },
};

const SOURCE_LABELS: Record<string, string> = {
  recording: "Browser Recording",
  upload: "Uploaded File",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / 86400000
  );
  if (diffDays === 0)
    return `Today · ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  if (diffDays === 1)
    return `Yesterday · ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m} min` : `${m}m ${s}s`;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface RecordingCardProps {
  recording: RecordingListItem;
  isFirst: boolean;
  isLast: boolean;
  onOpen: () => void;
  onRetry: () => void;
  onDelete: () => void;
  isRetrying: boolean;
  isDeleting: boolean;
}

export function RecordingCard({
  recording,
  isFirst,
  isLast,
  onOpen,
  onRetry,
  onDelete,
  isRetrying,
  isDeleting,
}: RecordingCardProps) {
  const cfg = STATUS_CONFIG[recording.status];
  const isPending =
    recording.status === "recorded" || recording.status === "processing";
  const isFailed = recording.status === "failed";
  const isCompleted = recording.status === "completed";

  const displayName =
    recording.originalFileName ?? SOURCE_LABELS[recording.source] ?? "Recording";

  const borderRadius = isFirst && isLast
    ? "14px"
    : isFirst
    ? "14px 14px 0 0"
    : isLast
    ? "0 0 14px 14px"
    : "0";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        background: "#ffffff",
        borderLeft: "1px solid #e8e8e8",
        borderRight: "1px solid #e8e8e8",
        borderTop: "1px solid #e8e8e8",
        borderBottom: isLast ? "1px solid #e8e8e8" : "none",
        borderRadius,
        boxSizing: "border-box",
        fontFamily: font,
      }}
    >
      {/* Status indicator */}
      <div
        style={{
          flexShrink: 0,
          width: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isPending ? (
          <SpinnerSVG size={12} color={cfg.dot} />
        ) : (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: cfg.dot,
              display: "inline-block",
            }}
          />
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#111111",
              fontFamily: font,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "280px",
            }}
          >
            {displayName}
          </span>
          <span
            style={{
              fontSize: "12px",
              color: "#bbb",
              fontFamily: font,
              flexShrink: 0,
            }}
          >
            {formatDate(recording.createdAt)}
          </span>
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {recording.durationSeconds !== null && (
            <MetaChip
              icon={
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              }
              label={formatDuration(recording.durationSeconds)}
            />
          )}
          {recording.fileSizeBytes !== null && (
            <MetaChip
              icon={
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              }
              label={formatBytes(recording.fileSizeBytes)}
            />
          )}
          <MetaChip
            icon={
              recording.source === "recording" ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              )
            }
            label={SOURCE_LABELS[recording.source] ?? recording.source}
          />
        </div>
      </div>

      {/* Status pill */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          fontSize: "11px",
          fontWeight: "600",
          color: cfg.color,
          background: cfg.bg,
          padding: "3px 10px",
          borderRadius: "20px",
          fontFamily: font,
          flexShrink: 0,
        }}
      >
        {cfg.label}
      </span>

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isCompleted && (
          <ActionButton
            onClick={onOpen}
            title="Open meeting"
            color="#111111"
            bgColor="#f5f5f5"
          >
            Open
          </ActionButton>
        )}
        {isFailed && (
          <ActionButton
            onClick={onRetry}
            title="Retry processing"
            color="#0ea5e9"
            bgColor="#e0f2fe"
            disabled={isRetrying}
          >
            {isRetrying ? "…" : "Retry"}
          </ActionButton>
        )}
        <ActionButton
          onClick={onDelete}
          title="Delete recording"
          color="#dc2626"
          bgColor="#fee2e2"
          disabled={isDeleting}
        >
          {isDeleting ? "…" : "Delete"}
        </ActionButton>
      </div>
    </div>
  );
}

function MetaChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "12px",
        color: "#aaaaaa",
        fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      {icon}
      {label}
    </span>
  );
}

function ActionButton({
  onClick,
  title,
  color,
  bgColor,
  disabled,
  children,
}: {
  onClick: () => void;
  title: string;
  color: string;
  bgColor: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        padding: "4px 10px",
        borderRadius: "7px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "12px",
        fontWeight: "600",
        fontFamily:
          "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
        border: "none",
        background: bgColor,
        color: color,
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.opacity = "0.75";
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.opacity = "1";
      }}
    >
      {children}
    </button>
  );
}

function SpinnerSVG({
  size = 12,
  color = "#999",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      style={{
        animation: "spin 0.75s linear infinite",
        display: "block",
      }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}