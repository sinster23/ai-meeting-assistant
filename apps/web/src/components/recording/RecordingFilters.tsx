// apps/web/components/recordings/RecordingFilters.tsx

"use client";

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

export type FilterStatus = "all" | RecordingStatus;
export type SortOption = "newest" | "oldest";

const STATUS_LABELS: Record<RecordingStatus, string> = {
  recorded:   "Recorded",
  processing: "Processing",
  completed:  "Completed",
  failed:     "Failed",
};

interface RecordingFiltersProps {
  filterStatus: FilterStatus;
  onFilterChange: (f: FilterStatus) => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  search: string;
  onSearchChange: (s: string) => void;
  counts: Record<string, number>;
}

export function RecordingFilters({
  filterStatus,
  onFilterChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
  counts,
}: RecordingFiltersProps) {
  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Search + Sort row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={purple[400]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search recordings…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "9px 12px 9px 34px",
              fontSize: "13px",
              fontFamily: font,
              color: "#111",
              background: "#ffffff",
              border: `1px solid ${purple[100]}`,
              borderRadius: "10px",
              outline: "none",
              boxShadow: `0 1px 3px rgba(83,74,183,0.06)`,
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = purple[200])}
            onBlur={(e) => (e.target.style.borderColor = purple[100])}
          />
        </div>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          style={{
            padding: "9px 12px",
            fontSize: "13px",
            fontFamily: font,
            color: purple[800],
            background: "#ffffff",
            border: `1px solid ${purple[100]}`,
            borderRadius: "10px",
            outline: "none",
            cursor: "pointer",
            boxShadow: `0 1px 3px rgba(83,74,183,0.06)`,
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Filter pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexWrap: "wrap",
        }}
      >
        {(
          ["all", "recorded", "processing", "completed", "failed"] as const
        ).map((f) => {
          const isActive = filterStatus === f;
          const count = counts[f] ?? 0;
          return (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
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
                borderColor: isActive ? "#111111" : purple[100],
                background: isActive ? "#111111" : "#ffffff",
                color: isActive ? "#ffffff" : purple[600],
                transition: "all 0.15s",
                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.18)" : "none",
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
              {f === "all" ? "All" : STATUS_LABELS[f as RecordingStatus]}
              <span
                style={{
                  fontSize: "11px",
                  color: isActive ? "rgba(255,255,255,0.65)" : purple[400],
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}