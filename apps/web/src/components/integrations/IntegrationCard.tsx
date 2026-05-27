// apps/web/components/integrations/IntegrationCard.tsx
"use client";

import { useState } from "react";
import { ConnectedBadge } from "./ConnectedBadge";
import type { ProviderInfo } from "@repo/types/integration";

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

// ─────────────────────────────────────────────────────────────────────────────
// Toggle switch
// ─────────────────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked:   boolean;
  onChange:  (v: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); !disabled && onChange(!checked); }}
      style={{
        width:        "44px",
        height:       "24px",
        borderRadius: "12px",
        border:       "none",
        background:   checked ? purple[600] : "#d1d5db",
        cursor:       disabled ? "not-allowed" : "pointer",
        position:     "relative",
        flexShrink:   0,
        transition:   "background 0.2s",
        opacity:      disabled ? 0.45 : 1,
        padding:      0,
      }}
    >
      <span
        style={{
          position:     "absolute",
          top:          "3px",
          left:         checked ? "23px" : "3px",
          width:        "18px",
          height:       "18px",
          borderRadius: "50%",
          background:   "#fff",
          boxShadow:    "0 1px 3px rgba(0,0,0,0.2)",
          transition:   "left 0.2s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback favicon-based provider icon
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER_LOGOS: Record<string, string> = {
  google:  "https://www.google.com/s2/favicons?domain=calendar.google.com&sz=64",
  slack:   "https://www.google.com/s2/favicons?domain=slack.com&sz=64",
  zoom:    "https://www.google.com/s2/favicons?domain=zoom.us&sz=64",
  notion:  "https://www.google.com/s2/favicons?domain=notion.so&sz=64",
  email:   "https://www.google.com/s2/favicons?domain=gmail.com&sz=64",
  hubspot: "https://www.google.com/s2/favicons?domain=hubspot.com&sz=64",
  zapier:  "https://www.google.com/s2/favicons?domain=zapier.com&sz=64",
  linear:  "https://www.google.com/s2/favicons?domain=linear.app&sz=64",
};

function ProviderIcon({ provider }: { provider: string }) {
  const [errored, setErrored] = useState(false);
  const src = PROVIDER_LOGOS[provider.toLowerCase()];

  if (!src || errored) {
    return (
      <div style={{
        width:          "28px",
        height:         "28px",
        borderRadius:   "8px",
        background:     purple[100],
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       "13px",
        fontWeight:     "700",
        color:          purple[800],
        fontFamily:     font,
        textTransform:  "uppercase",
      }}>
        {provider[0]}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={provider}
      width={28}
      height={28}
      style={{ objectFit: "contain", display: "block" }}
      onError={() => setErrored(true)}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IntegrationCard
// ─────────────────────────────────────────────────────────────────────────────

interface IntegrationCardProps {
  info:             ProviderInfo;
  onConnect:        () => void;
  onDisconnect:     () => void;
  isDisconnecting:  boolean;
  /** Optional JSX icon to render instead of the default favicon-based icon. */
  iconOverride?:    React.ReactNode;
}

export function IntegrationCard({
  info,
  onConnect,
  onDisconnect,
  isDisconnecting,
  iconOverride,
}: IntegrationCardProps) {
  const [hovered, setHovered] = useState(false);

  const isConnected  = info.status === "connected";
  const isComingSoon = info.status === "coming_soon";

  function handleToggle(v: boolean) {
    if (isComingSoon) return;
    if (v) onConnect();
    else onDisconnect();
  }

  const cardBorder = isConnected
    ? "1px solid #bbf7d0"
    : hovered && !isComingSoon
    ? `1px solid ${purple[200]}`
    : `1px solid ${purple[100]}`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:    "#ffffff",
        border:        cardBorder,
        borderRadius:  "14px",
        padding:       "20px 20px 18px",
        display:       "flex",
        flexDirection: "column",
        gap:           "10px",
        transition:    "border-color 0.15s, box-shadow 0.15s",
        boxShadow:     isConnected
          ? "0 2px 8px rgba(22,163,74,0.07)"
          : hovered && !isComingSoon
          ? `0 2px 12px rgba(83,74,183,0.09)`
          : "0 1px 3px rgba(83,74,183,0.05)",
        opacity:  isComingSoon ? 0.65 : 1,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Connected top-strip */}
      {isConnected && (
        <div style={{
          position:     "absolute",
          top:          0, left: 0, right: 0,
          height:       "3px",
          background:   "linear-gradient(90deg, #22c55e, #16a34a)",
          borderRadius: "14px 14px 0 0",
        }} />
      )}

      {/* Header row: icon + toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Icon container — renders iconOverride when provided, falls back to favicon */}
        <div style={{
          width:          "44px",
          height:         "44px",
          borderRadius:   "12px",
          // Transparent background when using a custom icon (it has its own bg/shape)
          background:     iconOverride
            ? "transparent"
            : isComingSoon
            ? "#f8f8f8"
            : "#fff",
          border:         iconOverride
            ? "none"
            : `1px solid ${isComingSoon ? "#e8e8e8" : purple[100]}`,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
          filter:         isComingSoon ? "grayscale(0.5) opacity(0.7)" : "none",
          overflow:       "hidden",
        }}>
          {iconOverride
            ? iconOverride
            : <ProviderIcon provider={info.provider} />
          }
        </div>

        {isComingSoon ? (
          <span style={{
            fontSize:     "10px",
            fontWeight:   "500",
            color:        "#aaa",
            background:   "#f5f5f5",
            border:       "1px solid #e8e8e8",
            borderRadius: "20px",
            padding:      "2px 8px",
            fontFamily:   font,
          }}>
            Coming soon
          </span>
        ) : (
          <Toggle
            checked={isConnected}
            onChange={handleToggle}
            disabled={isDisconnecting}
          />
        )}
      </div>

      {/* Name */}
      <p style={{
        fontSize:      "14px",
        fontWeight:    "600",
        color:         isComingSoon ? "#666" : "#111",
        fontFamily:    font,
        margin:        "0 0 1px",
        letterSpacing: "-0.01em",
      }}>
        {info.name}
      </p>

      {/* Description */}
      <p style={{
        fontSize:   "12px",
        color:      "#999",
        fontFamily: font,
        margin:     0,
        lineHeight: 1.5,
      }}>
        {info.description}
      </p>

      {/* Feature pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" }}>
        {info.features.map((f) => (
          <span
            key={f}
            style={{
              fontSize:     "10px",
              fontWeight:   "500",
              color:        isComingSoon ? "#aaa" : purple[600],
              background:   isComingSoon ? "#f5f5f5" : purple[50],
              border:       `1px solid ${isComingSoon ? "#ebebeb" : purple[100]}`,
              borderRadius: "20px",
              padding:      "2px 8px",
              fontFamily:   font,
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* View integration link */}
      {!isComingSoon && (
        <div style={{ marginTop: "4px" }}>
          <span style={{
            fontSize:   "12px",
            fontWeight: "500",
            color:      isConnected ? "#16a34a" : purple[600],
            fontFamily: font,
            cursor:     "pointer",
          }}>
            View integration →
          </span>
        </div>
      )}
    </div>
  );
}