// apps/web/components/integrations/AutomationCard.tsx
"use client";

import { useState } from "react";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

const purple = {
  50:  "#EEEDFE",
  100: "#CECBF6",
  200: "#AFA9EC",
  400: "#7F77DD",
  600: "#534AB7",
  800: "#3C3489",
};

// ─────────────────────────────────────────────────────────────────────────────
// Toggle switch
// ─────────────────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked:  boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
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
// AutomationRow
// ─────────────────────────────────────────────────────────────────────────────

interface AutomationRowProps {
  icon:        React.ReactNode;
  label:       string;
  description: string;
  checked:     boolean;
  onChange:    (v: boolean) => void;
  disabled?:   boolean;
  tag?:        string;
  isLast?:     boolean;
}

export function AutomationRow({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  tag,
  isLast = false,
}: AutomationRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          "14px",
        padding:      "14px 18px",
        borderBottom: isLast ? "none" : `1px solid ${purple[50]}`,
        background:   hovered && !disabled ? "#fdfcff" : "#fff",
        transition:   "background 0.1s",
        cursor:       disabled ? "default" : "pointer",
      }}
      onClick={() => !disabled && onChange(!checked)}
    >
      {/* Icon bubble */}
      <div style={{
        width:          "34px",
        height:         "34px",
        borderRadius:   "10px",
        background:     checked ? purple[50] : "#f5f5f5",
        border:         `1px solid ${checked ? purple[100] : "#ebebeb"}`,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
        transition:     "all 0.2s",
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
          <span style={{
            fontSize:      "13px",
            fontWeight:    "600",
            color:         disabled ? "#aaa" : "#111",
            fontFamily:    font,
            letterSpacing: "-0.01em",
          }}>
            {label}
          </span>
          {tag && (
            <span style={{
              fontSize:     "10px",
              fontWeight:   "500",
              color:        checked ? purple[600] : "#aaa",
              background:   checked ? purple[50] : "#f5f5f5",
              border:       `1px solid ${checked ? purple[100] : "#e8e8e8"}`,
              borderRadius: "20px",
              padding:      "1px 7px",
              fontFamily:   font,
              transition:   "all 0.2s",
            }}>
              {tag}
            </span>
          )}
        </div>
        <p style={{
          fontSize:   "12px",
          color:      disabled ? "#ccc" : "#999",
          fontFamily: font,
          margin:     0,
          lineHeight: 1.4,
        }}>
          {description}
        </p>
      </div>

      {/* Toggle */}
      <div onClick={e => e.stopPropagation()}>
        <Toggle checked={checked} onChange={onChange} disabled={disabled} />
      </div>
    </div>
  );
}