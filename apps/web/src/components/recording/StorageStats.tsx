// apps/web/components/recordings/StorageStats.tsx

"use client";

import type { StorageStats } from "@repo/types";

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

function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  if (hours < 1) return `${Math.round(seconds / 60)} min`;
  return `${hours.toFixed(1)} hrs`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface StorageStatsProps {
  stats: StorageStats | undefined;
  isLoading: boolean;
}

export function StorageStatsCard({ stats, isLoading }: StorageStatsProps) {
  const items = [
    {
      label: "Hours Captured",
      value: isLoading ? "—" : formatHours(stats?.totalDurationSeconds ?? 0),
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Recordings",
      value: isLoading ? "—" : String(stats?.totalRecordings ?? 0),
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
          <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      ),
    },
    {
      label: "Storage Used",
      value: isLoading ? "—" : formatBytes(stats?.totalSizeBytes ?? 0),
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        marginTop: "32px",
        background: "#ffffff",
        border: `1px solid ${purple[100]}`,
        borderRadius: "14px",
        padding: "20px 24px",
        fontFamily: font,
        boxShadow: `0 1px 3px rgba(83,74,183,0.06)`,
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: "600",
          color: purple[400],
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        Storage
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}
      >
        {items.map((item) => (
          <div key={item.label}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "4px",
              }}
            >
              {item.icon}
              <span
                style={{
                  fontSize: "12px",
                  color: purple[400],
                  fontFamily: font,
                }}
              >
                {item.label}
              </span>
            </div>
            <span
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#111111",
                letterSpacing: "-0.03em",
                fontFamily: font,
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}