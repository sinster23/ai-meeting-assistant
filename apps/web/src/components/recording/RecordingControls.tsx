// apps/web/components/recordings/RecordingControls.tsx

"use client";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

interface RecordingControlsProps {
  recordingBarVisible: boolean;
  onToggleRecordingBar: () => void;
}

export function RecordingControls({
  recordingBarVisible,
  onToggleRecordingBar,
}: RecordingControlsProps) {
  return (
    <div
      style={{
        background: recordingBarVisible ? "#111111" : "#ffffff",
        border: `1px solid ${recordingBarVisible ? "#111111" : "#e8e8e8"}`,
        borderRadius: "16px",
        padding: "28px 32px",
        marginBottom: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        boxShadow: recordingBarVisible
          ? "0 8px 32px rgba(0,0,0,0.22)"
          : "0 1px 4px rgba(0,0,0,0.05)",
        transition: "all 0.2s ease",
        fontFamily: font,
      }}
    >
      {/* Left: text */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "6px",
          }}
        >
          {/* Animated mic dot */}
          {recordingBarVisible ? (
            <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "#ef4444",
                  opacity: 0.7,
                  animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite",
                }}
              />
              <span
                style={{
                  position: "relative",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "inline-block",
                }}
              />
              <style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0}}`}</style>
            </span>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
          <span
            style={{
              fontSize: "15px",
              fontWeight: "700",
              color: recordingBarVisible ? "#ffffff" : "#111111",
              letterSpacing: "-0.02em",
              fontFamily: font,
            }}
          >
            Recording Agent
          </span>
        </div>
        <p
          style={{
            fontSize: "13px",
            color: recordingBarVisible ? "#888888" : "#999999",
            margin: 0,
            fontFamily: font,
            lineHeight: 1.5,
          }}
        >
          {recordingBarVisible
            ? `Pick your meeting tab and enable "Share tab audio".`
            : "Capture system audio from any meeting — Google Meet, Zoom, Teams."}
        </p>
      </div>

      {/* Right: button */}
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={onToggleRecordingBar}
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
            background: recordingBarVisible ? "#ef4444" : "#111111",
            color: "#ffffff",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          {recordingBarVisible ? (
            <>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
              Hide Recording
            </>
          ) : (
            <>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
              Enable Recording
            </>
          )}
        </button>
      </div>
    </div>
  );
}