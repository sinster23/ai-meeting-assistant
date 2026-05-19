// apps/web/components/meeting/ChatInput.tsx
"use client";

import { useState, useRef, KeyboardEvent } from "react";

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

interface Props {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export function ChatInput({ onSend, isLoading, disabled, disabledReason }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setValue("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  const isDisabled = disabled || isLoading;
  const placeholder = disabledReason ?? "Ask something about this meeting…";

  return (
    <div
      style={{
        borderTop: "1px solid #f0f0f0",
        padding: "12px 16px",
        background: "#fff",
        borderRadius: "0 0 12px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          background: isDisabled ? "#fafafa" : "#f8f8f8",
          border: `1px solid ${isDisabled ? "#f0f0f0" : "#e8e8e8"}`,
          borderRadius: "10px",
          padding: "8px 8px 8px 12px",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onFocus={() => {}}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={1}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: "14px",
            fontFamily: font,
            color: isDisabled ? "#bbb" : "#222",
            lineHeight: 1.6,
            resize: "none",
            padding: 0,
            letterSpacing: "-0.005em",
            cursor: isDisabled ? "not-allowed" : "text",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || isDisabled}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "7px",
            border: "none",
            cursor: !value.trim() || isDisabled ? "not-allowed" : "pointer",
            background: !value.trim() || isDisabled ? "#e8e8e8" : "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s, transform 0.1s",
          }}
          onMouseEnter={(e) => {
            if (!(!value.trim() || isDisabled)) {
              e.currentTarget.style.background = "#333";
            }
          }}
          onMouseLeave={(e) => {
            if (!(!value.trim() || isDisabled)) {
              e.currentTarget.style.background = "#111";
            }
          }}
          onMouseDown={(e) => {
            if (!(!value.trim() || isDisabled)) {
              e.currentTarget.style.transform = "scale(0.92)";
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {isLoading ? (
            <svg
              style={{ animation: "spin 0.75s linear infinite" }}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#999"
              strokeWidth="2.5"
            >
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={!value.trim() || isDisabled ? "#aaa" : "#fff"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
      <p
        style={{
          fontSize: "11px",
          color: "#ccc",
          fontFamily: font,
          margin: "6px 0 0",
          textAlign: "center",
        }}
      >
        Answers are grounded in this meeting's transcript only
      </p>
    </div>
  );
}