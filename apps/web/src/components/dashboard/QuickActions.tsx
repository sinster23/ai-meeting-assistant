// apps/web/components/dashboard/QuickActions.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadModal } from "@/components/upload/UploadModal";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "11px",
      fontWeight: "600",
      color: "#999999",
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      marginBottom: "12px",
      fontFamily: font,
    }}>
      {children}
    </div>
  );
}

interface QuickActionsProps {
  recordingBarVisible: boolean;
  onToggleRecordingBar: () => void;
}

export function QuickActions({ recordingBarVisible, onToggleRecordingBar }: QuickActionsProps) {
  const router = useRouter();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const ACTIONS = [
    {
      id: "start-now",
      label: "Start Now",
      desc: "Capture conversations anywhere",
      href: "/dashboard/record",
      badge: null,
      disabled: false,
      shortcut: "⌘ ↗",
      isToggle: true,
      onClick: () => onToggleRecordingBar(),
      icon: (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
        </div>
      ),
      iconActive: (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
        </div>
      ),
    },
    {
      id: "import",
      label: "Import",
      desc: "Audio, video, or recordings.",
      href: null,
      badge: null,
      disabled: false,
      shortcut: null,
      isToggle: false,
      onClick: () => setShowUploadModal(true),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      ),
      iconActive: null,
    },
    {
      id: "autostart",
      label: "Autostart",
      desc: "Connect your calendar",
      href: "/dashboard/integrations",
      disabled: true,
      badge: "Soon",
      shortcut: null,
      isToggle: false,
      onClick: () => {},
      icon: (
        <span style={{ fontSize: "22px", lineHeight: 1 }}>🚀</span>
      ),
      iconActive: null,
      extra: (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "4px" }}>
          <div style={{
            width: "18px", height: "18px", borderRadius: "4px",
            background: "#0078d4", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div style={{
            width: "18px", height: "18px", borderRadius: "4px",
            background: "#ffffff", border: "1px solid #e5e5e5",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "500" }}>Connect Calendar</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: "36px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
          width: "100%",
        }}>
          {ACTIONS.map((action) => {
            const isActive = action.id === "start-now" && recordingBarVisible;

            return (
              <button
                key={action.id}
                onClick={() => {
                  if (action.disabled) return;
                  action.onClick();
                }}
                disabled={action.disabled}
                style={{
                  background: isActive ? "#111111" : "#ffffff",
                  border: isActive ? "1px solid #111111" : "1px solid #e8e8e8",
                  borderRadius: "14px",
                  padding: "22px 22px 20px",
                  cursor: action.disabled ? "not-allowed" : "pointer",
                  textAlign: "left",
                  opacity: action.disabled ? 0.6 : 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  boxShadow: isActive
                    ? "0 4px 20px rgba(0,0,0,0.18)"
                    : "0 1px 3px rgba(0,0,0,0.05)",
                  position: "relative",
                  overflow: "hidden",
                  fontFamily: font,
                  width: "100%",
                  boxSizing: "border-box",
                  transition: "box-shadow 0.2s, border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!action.disabled && !isActive) {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.10)";
                    e.currentTarget.style.borderColor = "#d0d0d0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                    e.currentTarget.style.borderColor = "#e8e8e8";
                  }
                }}
              >
                {action.badge && (
                  <div style={{
                    position: "absolute", top: "12px", right: "12px",
                    fontSize: "10px", fontWeight: "600",
                    color: isActive ? "#aaaaaa" : "#555555",
                    background: isActive ? "#2a2a2a" : "#f0f0f0",
                    padding: "2px 9px", borderRadius: "20px",
                    letterSpacing: "0.03em",
                  }}>
                    {action.badge}
                  </div>
                )}
                {action.shortcut && (
                  <div style={{
                    position: "absolute", top: "14px", right: "14px",
                    fontSize: "10px", fontWeight: "500",
                    color: isActive ? "#666666" : "#bbbbbb",
                    background: isActive ? "#1e1e1e" : "#f5f5f5",
                    padding: "2px 7px", borderRadius: "6px",
                    letterSpacing: "0.02em",
                    border: isActive ? "1px solid #333333" : "1px solid #e8e8e8",
                  }}>
                    {action.shortcut}
                  </div>
                )}

                <span style={{ display: "flex", alignItems: "center" }}>
                  {isActive && action.iconActive ? action.iconActive : action.icon}
                </span>

                <div>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: isActive ? "#ffffff" : "#111111",
                    marginBottom: "4px",
                    letterSpacing: "-0.01em",
                  }}>
                    {action.label}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: isActive ? "#888888" : "#999999",
                    lineHeight: 1.45,
                  }}>
                    {action.desc}
                  </div>
                </div>

                {(action as any).extra && (action as any).extra}
              </button>
            );
          })}
        </div>
      </div>

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </>
  );
}