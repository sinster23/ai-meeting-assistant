// apps/web/components/integrations/ConnectedBadge.tsx

import type { ProviderStatus } from "@repo/types/integration";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

const purple = {
  50:  "#EEEDFE",
  100: "#CECBF6",
  200: "#AFA9EC",
  400: "#7F77DD",
  600: "#534AB7",
  800: "#3C3489",
};

interface ConnectedBadgeProps {
  status: ProviderStatus;
}

const CONFIG: Record<
  ProviderStatus,
  { label: string; color: string; bg: string; dot: string; pulse: boolean }
> = {
  connected: {
    label: "Connected",
    color: "#15803d",
    bg:    "#dcfce7",
    dot:   "#16a34a",
    pulse: true,
  },
  available: {
    label: "Available",
    color: purple[800],
    bg:    purple[50],
    dot:   purple[400],
    pulse: false,
  },
  coming_soon: {
    label: "Coming Soon",
    color: "#78716c",
    bg:    "#f5f5f4",
    dot:   "#a8a29e",
    pulse: false,
  },
};

export function ConnectedBadge({ status }: ConnectedBadgeProps) {
  const cfg = CONFIG[status];

  return (
    <span
      style={{
        display:     "inline-flex",
        alignItems:  "center",
        gap:         "5px",
        fontSize:    "11px",
        fontWeight:  "600",
        color:       cfg.color,
        background:  cfg.bg,
        padding:     "3px 10px",
        borderRadius: "20px",
        fontFamily:  font,
        flexShrink:  0,
      }}
    >
      <span
        style={{
          width:        "5px",
          height:       "5px",
          borderRadius: "50%",
          background:   cfg.dot,
          display:      "inline-block",
          flexShrink:   0,
          boxShadow:    cfg.pulse ? `0 0 0 0 ${cfg.dot}` : "none",
          animation:    cfg.pulse ? "badgePulse 2s infinite" : "none",
        }}
      />
      {cfg.label}

      <style>{`
        @keyframes badgePulse {
          0%   { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
          70%  { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
          100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
        }
      `}</style>
    </span>
  );
}