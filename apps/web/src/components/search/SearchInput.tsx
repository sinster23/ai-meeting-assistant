// apps/web/components/search/SearchInput.tsx
"use client";

import { useRef, useState } from "react";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

const SUGGESTIONS = [
  "What decisions were made this week?",
  "Which meeting discussed deployment?",
  "Who owns the frontend tasks?",
  "What were the key action items?",
  "Which meetings mentioned authentication?",
];

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchInput({ onSearch, isLoading }: SearchInputProps) {
  const [query, setQuery]     = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function submit(q = query) {
    const trimmed = q.trim();
    if (!trimmed || isLoading) return;
    onSearch(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleSuggestion(s: string) {
    setQuery(s);
    onSearch(s);
  }

  return (
    <div style={{ marginBottom: "32px" }}>
      {/* ── Input box ── */}
      <div style={{
        position: "relative",
        background: "#ffffff",
        border: `1px solid ${focused ? "#aaaaaa" : "#e8e8e8"}`,
        borderRadius: "16px",
        boxShadow: focused
          ? "0 4px 20px rgba(0,0,0,0.08)"
          : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "border-color 0.2s, box-shadow 0.2s",
        overflow: "hidden",
      }}>
        {/* Search icon */}
        <div style={{
          position: "absolute",
          top: "16px",
          left: "18px",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
        }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill="none"
            stroke={focused ? "#111111" : "#bbbbbb"}
            strokeWidth="1.9"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: "stroke 0.2s" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <textarea
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask anything about your meetings…"
          rows={1}
          style={{
            width: "100%",
            padding: "15px 56px 15px 46px",
            fontSize: "14px",
            fontFamily: font,
            color: "#111111",
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            lineHeight: "1.5",
            boxSizing: "border-box",
            display: "block",
            // Grow with content
            minHeight: "52px",
            maxHeight: "140px",
            overflowY: "auto",
          }}
          onInput={(e) => {
            // Auto-height
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = `${Math.min(t.scrollHeight, 140)}px`;
          }}
        />

        {/* Submit button */}
        <button
          onClick={() => submit()}
          disabled={!query.trim() || isLoading}
          style={{
            position: "absolute",
            right: "10px",
            bottom: "10px",
            width: "32px",
            height: "32px",
            borderRadius: "9px",
            border: "none",
            background: query.trim() && !isLoading ? "#111111" : "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: query.trim() && !isLoading ? "pointer" : "default",
            transition: "background 0.2s, opacity 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (query.trim() && !isLoading)
              e.currentTarget.style.opacity = "0.8";
          }}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {isLoading ? (
            <LoadingDots />
          ) : (
            <svg
              width="13" height="13" viewBox="0 0 24 24"
              fill="none"
              stroke={query.trim() ? "#ffffff" : "#cccccc"}
              strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Suggestions ── */}
      <div style={{ marginTop: "14px" }}>
        <div style={{
          fontSize: "11px",
          fontWeight: "600",
          color: "#bbbbbb",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: "8px",
          fontFamily: font,
          textAlign: "center",
        }}>
          Suggested
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", justifyContent: "center" }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              disabled={isLoading}
              style={{
                padding: "6px 13px",
                borderRadius: "20px",
                border: "1px solid #e8e8e8",
                background: "#ffffff",
                color: "#555555",
                fontSize: "12px",
                fontWeight: "500",
                fontFamily: font,
                cursor: isLoading ? "default" : "pointer",
                transition: "border-color 0.15s, color 0.15s, background 0.15s",
                opacity: isLoading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.borderColor = "#aaaaaa";
                  e.currentTarget.style.color = "#111111";
                  e.currentTarget.style.background = "#fafafa";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e8e8e8";
                e.currentTarget.style.color = "#555555";
                e.currentTarget.style.background = "#ffffff";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Inline loading animation ───────────────────────────────────────────────

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: "3px",
            height: "3px",
            borderRadius: "50%",
            background: "#aaaaaa",
            animation: `searchDotBounce 1s ${i * 0.15}s ease-in-out infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes searchDotBounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}