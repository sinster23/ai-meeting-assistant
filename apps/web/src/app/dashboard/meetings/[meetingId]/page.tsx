// apps/web/app/meetings/[meetingId]/page.tsx
"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useMeetingStatus } from "@/hooks/meeting/useMeetingStatus";
import { useChatSession } from "@/hooks/meeting/useChat";
import type { ActionItem } from "@repo/types";

interface Props {
  params: Promise<{ meetingId: string }>;
}

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

type Tab = "transcribe" | "summary";

const SIDEBAR_W = 360;

// ── Theme tokens ───────────────────────────────────────────────────────────
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
// Markdown helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    if (/^# /.test(line)) {
      nodes.push(<h2 key={i} style={{ fontSize: "16px", fontWeight: "700", color: "#111", fontFamily: font, margin: "0 0 10px", letterSpacing: "-0.01em" }}>{inlineMarkdown(line.replace(/^# /, ""))}</h2>);
      i++; continue;
    }
    if (/^## /.test(line)) {
      nodes.push(<h3 key={i} style={{ fontSize: "14px", fontWeight: "700", color: "#222", fontFamily: font, margin: "16px 0 6px" }}>{inlineMarkdown(line.replace(/^## /, ""))}</h3>);
      i++; continue;
    }
    if (/^### /.test(line)) {
      nodes.push(<h4 key={i} style={{ fontSize: "13px", fontWeight: "700", color: "#333", fontFamily: font, margin: "14px 0 4px" }}>{inlineMarkdown(line.replace(/^### /, ""))}</h4>);
      i++; continue;
    }
    if (/^[\*\-•] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\*\-•] /.test(lines[i])) { items.push(lines[i].replace(/^[\*\-•] /, "")); i++; }
      nodes.push(
        <ul key={`ul-${i}`} style={{ margin: "6px 0 10px", padding: 0, listStyle: "none" }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "14px", color: "#444", lineHeight: 1.75, fontFamily: font, marginBottom: "2px" }}>
              <span style={{ color: purple[400], flexShrink: 0, marginTop: "1px" }}>•</span>
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, "")); i++; }
      nodes.push(
        <ol key={`ol-${i}`} style={{ margin: "6px 0 10px", padding: 0, listStyle: "none" }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "14px", color: "#444", lineHeight: 1.75, fontFamily: font, marginBottom: "2px" }}>
              <span style={{ color: purple[400], flexShrink: 0, minWidth: "16px", marginTop: "1px", fontSize: "13px" }}>{idx + 1}.</span>
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }
    nodes.push(<p key={i} style={{ fontSize: "14px", color: "#444444", lineHeight: 1.8, fontFamily: font, margin: "0 0 10px" }}>{inlineMarkdown(line)}</p>);
    i++;
  }
  return <>{nodes}</>;
}

function inlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0; let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    if (raw.startsWith("**")) parts.push(<strong key={match.index} style={{ fontWeight: "700", color: "#222" }}>{raw.slice(2, -2)}</strong>);
    else if (raw.startsWith("*")) parts.push(<em key={match.index} style={{ fontStyle: "italic" }}>{raw.slice(1, -1)}</em>);
    else if (raw.startsWith("`")) parts.push(<code key={match.index} style={{ fontFamily: "monospace", fontSize: "12px", background: purple[50], padding: "1px 5px", borderRadius: "4px", color: purple[800] }}>{raw.slice(1, -1)}</code>);
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function MeetingPage({ params }: Props) {
  const { meetingId } = use(params);
  const { data, isLoading, isError } = useMeetingStatus(meetingId);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [chatOpen, setChatOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  function handleCopySummary() {
    if (data?.summary) {
      navigator.clipboard.writeText(data.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (isLoading) return (
    <PageShell chatOpen={chatOpen}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "320px" }}>
        <SpinnerSVG size={24} />
      </div>
    </PageShell>
  );

  if (isError || !data) return (
    <PageShell chatOpen={chatOpen}>
      <p style={{ fontSize: "14px", color: "#dc2626", fontFamily: font, padding: "48px 0" }}>Could not load meeting.</p>
    </PageShell>
  );

  const isPending = data.status === "uploaded" || data.status === "processing";
  const isCompleted = data.status === "completed";
  const meetingTitle = (data as any).originalFileName ?? "Untitled Meeting";
  const meetingDate = (data as any).createdAt
    ? new Date((data as any).createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const meetingTime = (data as any).createdAt
    ? new Date((data as any).createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;
  const durationMin = (data as any).durationSeconds ? Math.round((data as any).durationSeconds / 60) : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f4fb", fontFamily: font, position: "relative" }}>

      {/* ── Main content area ── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        transition: "padding-right 0.3s cubic-bezier(0.4,0,0.2,1)",
        paddingRight: chatOpen ? `${SIDEBAR_W + 16}px` : "0",
      }}>
        <div style={{ maxWidth: "780px", margin: "0 auto", padding: "36px 48px 80px", boxSizing: "border-box" }}>

          {/* ── Header row ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#111111", letterSpacing: "-0.025em", margin: 0, fontFamily: font, lineHeight: 1.25, flex: 1, marginRight: "16px" }}>
              {meetingTitle}
            </h1>
            <button
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "8px", cursor: "pointer",
                fontSize: "13px", fontWeight: "500", fontFamily: font,
                border: `1px solid ${purple[100]}`, background: "#ffffff",
                color: purple[600], boxShadow: `0 1px 3px rgba(83,74,183,0.08)`,
                transition: "all 0.15s", flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = purple[50]; e.currentTarget.style.borderColor = purple[200]; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = purple[100]; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share
            </button>
          </div>

          {/* ── Meta row ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
            {meetingDate && (
              <span style={{ fontSize: "13px", color: "#888", fontFamily: font }}>
                {meetingDate}{meetingTime ? ` · ${meetingTime}` : ""}
              </span>
            )}
            {durationMin && (
              <>
                <span style={{ fontSize: "13px", color: "#ccc" }}>·</span>
                <span style={{ fontSize: "13px", color: "#888", fontFamily: font }}>{durationMin} min</span>
              </>
            )}
            <StatusPill status={data.status} isPending={isPending} />
            {isCompleted && (
              <button
                onClick={handleCopySummary}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "3px 10px", borderRadius: "6px", cursor: "pointer",
                  fontSize: "12px", fontWeight: "500", fontFamily: font,
                  border: `1px solid ${purple[100]}`, background: "#fff",
                  color: copied ? "#16a34a" : purple[600], transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = purple[50]; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
              >
                {copied ? <><CheckIcon /> Copied!</> : <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy
                </>}
              </button>
            )}
          </div>

          {/* ── Tabs ── */}
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "#edeaf8", borderRadius: "10px",
            padding: "3px", marginBottom: "28px", gap: "2px",
          }}>
            {(["transcribe", "summary"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 14px",
                  background: activeTab === tab ? "#ffffff" : "transparent",
                  border: "none", borderRadius: "8px", cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: activeTab === tab ? "600" : "500",
                  color: activeTab === tab ? purple[800] : "#888888",
                  fontFamily: font,
                  boxShadow: activeTab === tab ? `0 1px 3px rgba(83,74,183,0.12)` : "none",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                }}
              >
                <TabIcon tab={tab} active={activeTab === tab} />
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}

            {/* Chat toggle button */}
            <button
              onClick={() => setChatOpen((o) => !o)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px",
                background: chatOpen ? "#111111" : "transparent",
                border: "none", borderRadius: "8px", cursor: "pointer",
                fontSize: "13px",
                fontWeight: chatOpen ? "600" : "500",
                color: chatOpen ? "#ffffff" : "#888888",
                fontFamily: font,
                boxShadow: chatOpen ? "0 1px 3px rgba(0,0,0,0.20)" : "none",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke={chatOpen ? "#fff" : "#aaa"} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Chat
            </button>
          </div>

          {/* ── Tab content ── */}
          <div style={{ maxWidth: "620px" }}>
            {activeTab === "summary" && (
              <SummaryTab data={data} isPending={isPending} isCompleted={isCompleted} />
            )}
            {activeTab === "transcribe" && (
              <TranscribeTab transcript={data.transcript ?? null} isPending={isPending} />
            )}
          </div>

        </div>
      </div>

      {/* ── AI Chat sidebar ── */}
      <ChatSidebar
        meetingId={meetingId}
        meetingStatus={data.status}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat Sidebar
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTED = [
  "What were the main decisions?",
  "Who is responsible for what?",
  "Were any deadlines mentioned?",
  "What problems were discussed?",
];

function ChatSidebar({
  meetingId,
  meetingStatus,
  open,
  onClose,
}: {
  meetingId: string;
  meetingStatus: string;
  open: boolean;
  onClose: () => void;
}) {
  const { messages, sendMessage, isLoading } = useChatSession(meetingId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isPending = meetingStatus === "uploaded" || meetingStatus === "processing";
  const isFailed  = meetingStatus === "failed";
  const isReady   = meetingStatus === "completed";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const msg = input.trim();
    if (!msg || isLoading || !isReady) return;
    sendMessage(msg);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: `${SIDEBAR_W}px`,
      height: "100vh",
      background: "#ffffff",
      borderLeft: `1px solid ${purple[100]}`,
      boxShadow: open ? `-4px 0 24px rgba(83,74,183,0.08)` : "none",
      display: "flex",
      flexDirection: "column",
      zIndex: 40,
      transform: open ? "translateX(0)" : `translateX(${SIDEBAR_W}px)`,
      transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s",
      pointerEvents: open ? "auto" : "none",
    }}>

      {/* ── Sidebar header ── */}
      <div style={{
        padding: "16px 16px 14px",
        borderBottom: `1px solid ${purple[50]}`,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
        background: "#fff",
      }}>
        {/* Purple/black split icon */}
        <div style={{
          width: "30px", height: "30px", borderRadius: "8px",
          background: "linear-gradient(135deg, #111 50%, #534AB7 50%)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
            <circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "13px", fontWeight: "600", color: "#111", fontFamily: font, margin: 0, letterSpacing: "-0.01em" }}>
            AI Chat
          </p>
          <p style={{ fontSize: "11px", color: purple[400], fontFamily: font, margin: 0 }}>
            {isPending ? "Available after processing" : "Grounded in this meeting"}
          </p>
        </div>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: "28px", height: "28px", borderRadius: "7px",
            border: `1px solid ${purple[100]}`, background: purple[50],
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "background 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = purple[100]; }}
          onMouseLeave={e => { e.currentTarget.style.background = purple[50]; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={purple[600]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        background: "#fdfcff",
      }}>
        {messages.length === 0 ? (
          <ChatEmptyState
            isReady={isReady}
            isPending={isPending}
            isFailed={isFailed}
            onSuggest={sendMessage}
          />
        ) : (
          <>
            {messages.map((msg) => (
              <SidebarMessage key={msg.id} role={msg.role} content={msg.content} isStreaming={msg.isStreaming} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* ── Input ── */}
      <div style={{
        borderTop: `1px solid ${purple[50]}`,
        padding: "12px",
        background: "#fff",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: "8px",
          background: isReady ? "#f8f7fe" : "#fafafa",
          border: `1px solid ${isReady ? purple[100] : "#e8e8e8"}`,
          borderRadius: "10px",
          padding: "8px 8px 8px 12px",
          transition: "border-color 0.15s",
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={() => {
              const el = textareaRef.current;
              if (!el) return;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
            placeholder={
              isPending ? "Meeting is still being analyzed…" :
              isFailed  ? "Processing failed" :
              "Ask anything about this meeting…"
            }
            disabled={!isReady || isLoading}
            rows={1}
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent",
              fontSize: "13px", fontFamily: font,
              color: isReady ? "#222" : "#bbb",
              lineHeight: 1.6, resize: "none", padding: 0,
              letterSpacing: "-0.005em",
              cursor: !isReady ? "not-allowed" : "text",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isReady || isLoading}
            style={{
              width: "30px", height: "30px", borderRadius: "7px", border: "none",
              cursor: !input.trim() || !isReady || isLoading ? "not-allowed" : "pointer",
              background: !input.trim() || !isReady || isLoading ? "#e8e8e8" : "#111",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.15s",
            }}
            onMouseEnter={e => { if (input.trim() && isReady && !isLoading) e.currentTarget.style.background = purple[600]; }}
            onMouseLeave={e => { if (input.trim() && isReady && !isLoading) e.currentTarget.style.background = "#111"; }}
          >
            {isLoading ? (
              <svg style={{ animation: "spin 0.75s linear infinite" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5">
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={!input.trim() || !isReady ? "#aaa" : "#fff"}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
        <p style={{ fontSize: "11px", color: purple[200], fontFamily: font, margin: "6px 0 0", textAlign: "center" }}>
          Answers grounded in this meeting only
        </p>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────────────────────

function SidebarMessage({ role, content, isStreaming }: { role: string; content: string; isStreaming?: boolean }) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
        <div style={{
          maxWidth: "82%",
          background: "#111",
          color: "#fff",
          borderRadius: "14px 14px 4px 14px",
          padding: "9px 13px",
          fontSize: "13px", lineHeight: 1.6, fontFamily: font,
          letterSpacing: "-0.005em",
        }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "14px" }}>
      {/* AI avatar */}
      <div style={{
        width: "22px", height: "22px", borderRadius: "6px",
        background: purple[50], border: `1px solid ${purple[100]}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: "2px",
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={purple[600]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
          <circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>
        </svg>
      </div>
      <div style={{
        maxWidth: "84%",
        background: "#f8f7fe",
        border: `1px solid ${purple[100]}`,
        borderRadius: "4px 14px 14px 14px",
        padding: "9px 13px",
        fontSize: "13px", lineHeight: 1.75, fontFamily: font,
        color: "#333", letterSpacing: "-0.005em",
      }}>
        {isStreaming ? (
          <div style={{ display: "flex", gap: "4px", alignItems: "center", height: "18px" }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: "5px", height: "5px", borderRadius: "50%", background: purple[400],
                display: "inline-block",
                animation: "chatDot 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}/>
            ))}
            <style>{`@keyframes chatDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}`}</style>
          </div>
        ) : content}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat empty state
// ─────────────────────────────────────────────────────────────────────────────

function ChatEmptyState({ isReady, isPending, isFailed, onSuggest }: {
  isReady: boolean; isPending: boolean; isFailed: boolean; onSuggest: (q: string) => void;
}) {
  if (isFailed) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "24px 0" }}>
      <span style={{ fontSize: "20px" }}>⚠️</span>
      <p style={{ fontSize: "13px", color: "#dc2626", fontFamily: font, margin: 0, textAlign: "center" }}>Processing failed — chat unavailable</p>
    </div>
  );

  if (isPending) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "24px 0" }}>
      <svg style={{ animation: "spin 0.75s linear infinite" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="2">
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <p style={{ fontSize: "13px", color: "#aaa", fontFamily: font, margin: 0, textAlign: "center", lineHeight: 1.5 }}>
        Chat will be ready once processing completes
      </p>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", paddingTop: "16px" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "13px", fontWeight: "600", color: "#333", fontFamily: font, margin: "0 0 3px", letterSpacing: "-0.01em" }}>
          Ask anything about this meeting
        </p>
        <p style={{ fontSize: "12px", color: "#bbb", fontFamily: font, margin: 0 }}>Try a suggestion to get started</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
        {SUGGESTED.map(q => (
          <button
            key={q}
            onClick={() => onSuggest(q)}
            style={{
              background: purple[50], border: `1px solid ${purple[100]}`,
              borderRadius: "8px", padding: "9px 11px",
              cursor: "pointer", fontSize: "12px", color: purple[800],
              fontFamily: font, textAlign: "left",
              transition: "all 0.15s", letterSpacing: "-0.005em",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = purple[100]; e.currentTarget.style.color = purple[900]; e.currentTarget.style.borderColor = purple[200]; }}
            onMouseLeave={e => { e.currentTarget.style.background = purple[50]; e.currentTarget.style.color = purple[800]; e.currentTarget.style.borderColor = purple[100]; }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary + Transcript tabs
// ─────────────────────────────────────────────────────────────────────────────

function SummaryTab({ data, isPending, isCompleted }: { data: any; isPending: boolean; isCompleted: boolean }) {
  if (isPending) return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "40px 0" }}>
      <SpinnerSVG size={16} />
      <p style={{ fontSize: "14px", color: "#888", fontFamily: font, margin: 0 }}>Processing your meeting — this usually takes 1–2 minutes…</p>
    </div>
  );
  if (data.status === "failed") return (
    <p style={{ fontSize: "14px", color: "#dc2626", fontFamily: font, padding: "40px 0" }}>⚠ Processing failed. The audio may be too short or inaudible.</p>
  );
  if (!isCompleted) return null;
  return (
    <div>
      {data.summary && <div style={{ marginBottom: "28px" }}>{renderMarkdown(data.summary)}</div>}
      {data.keyPoints?.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#222", fontFamily: font, margin: "0 0 8px" }}>Key Discussion Points</h3>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {data.keyPoints.map((point: string, i: number) => (
              <li key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "14px", color: "#444", lineHeight: 1.75, fontFamily: font, marginBottom: "4px" }}>
                <span style={{ color: purple[400], flexShrink: 0 }}>•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.actionItems?.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#222", fontFamily: font, margin: "0 0 10px" }}>Action Items</h3>
          {data.actionItems.map((item: ActionItem, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "7px 0", borderBottom: `1px solid ${purple[50]}` }}>
              <div style={{ width: "15px", height: "15px", borderRadius: "4px", border: `1.5px solid ${purple[200]}`, background: "#fff", flexShrink: 0, marginTop: "2px", cursor: "pointer" }}/>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "14px", fontWeight: "500", color: "#222", fontFamily: font, lineHeight: 1.6 }}>{item.task}</span>
                {(item.owner || item.deadline) && (
                  <div style={{ display: "flex", gap: "12px", marginTop: "2px" }}>
                    {item.owner && <span style={{ fontSize: "12px", color: purple[400], fontFamily: font }}>👤 {item.owner}</span>}
                    {item.deadline && <span style={{ fontSize: "12px", color: purple[400], fontFamily: font }}>📅 {item.deadline}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TranscribeTab({ transcript, isPending }: { transcript: string | null; isPending: boolean }) {
  if (isPending) return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "40px 0" }}>
      <SpinnerSVG size={16} />
      <p style={{ fontSize: "14px", color: "#888", fontFamily: font, margin: 0 }}>Transcribing…</p>
    </div>
  );
  if (!transcript) return <p style={{ fontSize: "14px", color: "#bbb", fontFamily: font, padding: "40px 0" }}>No transcript available.</p>;
  return (
    <div>
      {transcript.split("\n").filter(Boolean).map((line, i) => (
        <p key={i} style={{ fontSize: "14px", color: "#444444", lineHeight: 1.85, fontFamily: font, margin: "0 0 6px" }}>{line}</p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small shared components
// ─────────────────────────────────────────────────────────────────────────────

function PageShell({ children, chatOpen }: { children: React.ReactNode; chatOpen: boolean }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f4fb" }}>
      <div style={{ flex: 1, minWidth: 0, transition: "padding-right 0.3s cubic-bezier(0.4,0,0.2,1)", paddingRight: chatOpen ? `${SIDEBAR_W + 16}px` : "0" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto", padding: "36px 48px 80px", boxSizing: "border-box" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  uploaded:   { label: "Preparing…",  color: purple[800], bg: purple[50],  dot: purple[600] },
  processing: { label: "Processing…", color: "#0369a1",   bg: "#e0f2fe",   dot: "#0ea5e9"   },
  completed:  { label: "Completed",   color: "#15803d",   bg: "#dcfce7",   dot: "#16a34a"   },
  failed:     { label: "Failed",      color: "#dc2626",   bg: "#fee2e2",   dot: "#dc2626"   },
};

function StatusPill({ status, isPending }: { status: string; isPending: boolean }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.completed;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: "600", color: cfg.color, background: cfg.bg, padding: "3px 10px", borderRadius: "20px", fontFamily: font }}>
      {isPending ? <SpinnerSVG size={10} /> : <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }}/>}
      {cfg.label}
    </span>
  );
}

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const stroke = active ? purple[800] : "#aaa";
  if (tab === "transcribe") return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  );
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function SpinnerSVG({ size = 16 }: { size?: number }) {
  return (
    <svg style={{ animation: "spin 0.75s linear infinite", display: "block" }} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={purple[400]} strokeWidth="2.5">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}