// apps/web/app/meetings/[meetingId]/page.tsx

"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMeetingStatus } from "@/hooks/meeting/useMeetingStatus";
import type { MeetingStatus, ActionItem } from "@repo/types";

interface Props {
  params: Promise<{ meetingId: string }>;
}

const font = "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

type Tab = "transcribe" | "summary" | "chat";

// ── Markdown renderer ──────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }

    if (/^# /.test(line)) {
      nodes.push(
        <h2 key={i} style={{ fontSize: "16px", fontWeight: "700", color: "#111", fontFamily: font, margin: "0 0 10px", letterSpacing: "-0.01em" }}>
          {inlineMarkdown(line.replace(/^# /, ""))}
        </h2>
      );
      i++; continue;
    }

    if (/^## /.test(line)) {
      nodes.push(
        <h3 key={i} style={{ fontSize: "14px", fontWeight: "700", color: "#222", fontFamily: font, margin: "16px 0 6px" }}>
          {inlineMarkdown(line.replace(/^## /, ""))}
        </h3>
      );
      i++; continue;
    }

    if (/^### /.test(line)) {
      nodes.push(
        <h4 key={i} style={{ fontSize: "13px", fontWeight: "700", color: "#333", fontFamily: font, margin: "14px 0 4px" }}>
          {inlineMarkdown(line.replace(/^### /, ""))}
        </h4>
      );
      i++; continue;
    }

    if (/^[\*\-•] /.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[\*\-•] /.test(lines[i])) {
        listItems.push(lines[i].replace(/^[\*\-•] /, ""));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} style={{ margin: "6px 0 10px", padding: 0, listStyle: "none" }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "14px", color: "#444", lineHeight: 1.75, fontFamily: font, marginBottom: "2px" }}>
              <span style={{ color: "#aaa", flexShrink: 0, marginTop: "1px" }}>•</span>
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} style={{ margin: "6px 0 10px", padding: 0, listStyle: "none" }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "14px", color: "#444", lineHeight: 1.75, fontFamily: font, marginBottom: "2px" }}>
              <span style={{ color: "#aaa", flexShrink: 0, minWidth: "16px", marginTop: "1px", fontSize: "13px" }}>{idx + 1}.</span>
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (/^\*\*[^*]+\*\*:?$/.test(line.trim())) {
      nodes.push(
        <p key={i} style={{ fontSize: "14px", fontWeight: "700", color: "#222", fontFamily: font, margin: "14px 0 4px", lineHeight: 1.6 }}>
          {inlineMarkdown(line.trim())}
        </p>
      );
      i++; continue;
    }

    nodes.push(
      <p key={i} style={{ fontSize: "14px", color: "#444444", lineHeight: 1.8, fontFamily: font, margin: "0 0 10px" }}>
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <>{nodes}</>;
}

function inlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    if (raw.startsWith("**")) {
      parts.push(<strong key={match.index} style={{ fontWeight: "700", color: "#222" }}>{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith("*")) {
      parts.push(<em key={match.index} style={{ fontStyle: "italic" }}>{raw.slice(1, -1)}</em>);
    } else if (raw.startsWith("`")) {
      parts.push(<code key={match.index} style={{ fontFamily: "monospace", fontSize: "12px", background: "#f5f5f5", padding: "1px 5px", borderRadius: "4px", color: "#555" }}>{raw.slice(1, -1)}</code>);
    }
    last = match.index + raw.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function MeetingPage({ params }: Props) {
  const { meetingId } = use(params);
  const router = useRouter();
  const { data, isLoading, isError } = useMeetingStatus(meetingId);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [copied, setCopied] = useState(false);

  function handleCopySummary() {
    if (data?.summary) {
      navigator.clipboard.writeText(data.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (isLoading) {
    return (
      <PageShell onShare={() => {}}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "320px" }}>
          <SpinnerSVG size={24} />
        </div>
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell onShare={() => {}}>
        <p style={{ fontSize: "14px", color: "#dc2626", fontFamily: font, padding: "48px 0" }}>
          Could not load meeting.
        </p>
      </PageShell>
    );
  }

  const isPending = data.status === "uploaded" || data.status === "processing";
  const isCompleted = data.status === "completed";

  const meetingTitle = (data as any).title ?? "Untitled Meeting";
  const meetingDate = (data as any).createdAt
    ? new Date((data as any).createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const meetingTime = (data as any).createdAt
    ? new Date((data as any).createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;
  const durationMin = (data as any).durationSeconds
    ? Math.round((data as any).durationSeconds / 60)
    : null;

  return (
    <PageShell onShare={() => {}}>

      {/* ── Meeting title ── */}
      <h1 style={{
        fontSize: "22px", fontWeight: "700", color: "#111111",
        letterSpacing: "-0.025em", margin: "0 0 10px",
        fontFamily: font, lineHeight: 1.25,
      }}>
        {meetingTitle}
      </h1>

      {/* ── Meta row: status + copy button ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        {meetingDate && (
          <span style={{ fontSize: "13px", color: "#888", fontFamily: font }}>
            {meetingDate}{meetingTime ? ` · ${meetingTime}` : ""}
          </span>
        )}
        {durationMin && (
          <>
            <span style={{ fontSize: "13px", color: "#ccc", fontFamily: font }}>·</span>
            <span style={{ fontSize: "13px", color: "#888", fontFamily: font }}>{durationMin} min</span>
          </>
        )}
        <StatusPill status={data.status} isPending={isPending} />

        {/* Copy button sits right next to status */}
        {isCompleted && (
          <button
            onClick={handleCopySummary}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "3px 10px", borderRadius: "6px", cursor: "pointer",
              fontSize: "12px", fontWeight: "500", fontFamily: font,
              border: "1px solid #e8e8e8", background: "#fff",
              color: copied ? "#16a34a" : "#555",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f5f5f5"; e.currentTarget.style.borderColor = "#d8d8d8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e8e8e8"; }}
          >
            {copied
              ? <><CheckIcon /> Copied!</>
              : <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy
                </>
            }
          </button>
        )}
      </div>

      {/* ── Tabs: pill/box style ── */}
      <div style={{
        display: "inline-flex", alignItems: "center",
        background: "#f3f3f3",
        borderRadius: "10px",
        padding: "3px",
        marginBottom: "28px",
        gap: "2px",
      }}>
        {(["transcribe", "summary", "chat"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 14px",
              background: activeTab === tab ? "#ffffff" : "transparent",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: activeTab === tab ? "600" : "500",
              color: activeTab === tab ? "#111111" : "#888888",
              fontFamily: font,
              boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            <TabIcon tab={tab} active={activeTab === tab} />
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ maxWidth: "620px" }}>
        {activeTab === "summary" && (
          <SummaryTab data={data} isPending={isPending} isCompleted={isCompleted} />
        )}
        {activeTab === "transcribe" && (
          <TranscribeTab transcript={data.transcript ?? null} isPending={isPending} />
        )}
        {activeTab === "chat" && <ChatTab />}
      </div>

    </PageShell>
  );
}

// ── Summary Tab ────────────────────────────────────────────────────────────

function SummaryTab({ data, isPending, isCompleted }: { data: any; isPending: boolean; isCompleted: boolean }) {
  if (isPending) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "40px 0" }}>
        <SpinnerSVG size={16} />
        <p style={{ fontSize: "14px", color: "#888", fontFamily: font, margin: 0 }}>
          Processing your meeting — this usually takes 1–2 minutes…
        </p>
      </div>
    );
  }

  if (data.status === "failed") {
    return (
      <p style={{ fontSize: "14px", color: "#dc2626", fontFamily: font, padding: "40px 0" }}>
        ⚠ Processing failed. The audio may be too short or inaudible.
      </p>
    );
  }

  if (!isCompleted) return null;

  return (
    <div>
      {data.summary && (
        <div style={{ marginBottom: "28px" }}>
          {renderMarkdown(data.summary)}
        </div>
      )}

      {data.keyPoints && data.keyPoints.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#222", fontFamily: font, margin: "0 0 8px" }}>
            Key Discussion Points
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {data.keyPoints.map((point: string, i: number) => (
              <li key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "14px", color: "#444", lineHeight: 1.75, fontFamily: font, marginBottom: "4px" }}>
                <span style={{ color: "#aaa", flexShrink: 0 }}>•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.actionItems && data.actionItems.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#222", fontFamily: font, margin: "0 0 10px" }}>
            Action Items
          </h3>
          {data.actionItems.map((item: ActionItem, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "7px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ width: "15px", height: "15px", borderRadius: "4px", border: "1.5px solid #d0d0d0", background: "#fff", flexShrink: 0, marginTop: "2px", cursor: "pointer" }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "14px", fontWeight: "500", color: "#222", fontFamily: font, lineHeight: 1.6 }}>{item.task}</span>
                {(item.owner || item.deadline) && (
                  <div style={{ display: "flex", gap: "12px", marginTop: "2px" }}>
                    {item.owner && <span style={{ fontSize: "12px", color: "#aaa", fontFamily: font }}>👤 {item.owner}</span>}
                    {item.deadline && <span style={{ fontSize: "12px", color: "#aaa", fontFamily: font }}>📅 {item.deadline}</span>}
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

// ── Transcribe Tab ─────────────────────────────────────────────────────────

function TranscribeTab({ transcript, isPending }: { transcript: string | null; isPending: boolean }) {
  if (isPending) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "40px 0" }}>
        <SpinnerSVG size={16} />
        <p style={{ fontSize: "14px", color: "#888", fontFamily: font, margin: 0 }}>Transcribing…</p>
      </div>
    );
  }
  if (!transcript) {
    return <p style={{ fontSize: "14px", color: "#bbb", fontFamily: font, padding: "40px 0" }}>No transcript available.</p>;
  }
  return (
    <div>
      {transcript.split("\n").filter(Boolean).map((line, i) => (
        <p key={i} style={{ fontSize: "14px", color: "#444444", lineHeight: 1.85, fontFamily: font, margin: "0 0 6px" }}>
          {line}
        </p>
      ))}
    </div>
  );
}

// ── Chat Tab ───────────────────────────────────────────────────────────────

function ChatTab() {
  return (
    <div style={{ padding: "48px 0", textAlign: "center" }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <p style={{ fontSize: "14px", fontWeight: "600", color: "#888", fontFamily: font, margin: "0 0 6px" }}>AI Chat — Coming Soon</p>
      <p style={{ fontSize: "13px", color: "#bbb", fontFamily: font, margin: 0 }}>
        Ask questions like "What did we decide about pricing?" or "Who owns deployment?"
      </p>
    </div>
  );
}

// ── Status pill ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  uploaded:   { label: "Preparing…",  color: "#6366f1", bg: "#eef2ff" },
  processing: { label: "Processing…", color: "#0ea5e9", bg: "#e0f2fe" },
  completed:  { label: "Completed",   color: "#16a34a", bg: "#dcfce7" },
  failed:     { label: "Failed",      color: "#dc2626", bg: "#fee2e2" },
};

function StatusPill({ status, isPending }: { status: string; isPending: boolean }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.completed;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      fontSize: "11px", fontWeight: "600", color: cfg.color,
      background: cfg.bg, padding: "3px 10px", borderRadius: "20px", fontFamily: font,
    }}>
      {isPending
        ? <SpinnerSVG size={10} />
        : <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      }
      {cfg.label}
    </span>
  );
}

// ── Tab icon ───────────────────────────────────────────────────────────────

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const stroke = active ? "#111" : "#aaa";
  if (tab === "transcribe") return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  );
  if (tab === "summary") return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

// ── Page shell — Share button baked in top-right ───────────────────────────

function PageShell({ children, onShare }: { children: React.ReactNode; onShare: () => void }) {
  return (
    <main style={{ minHeight: "100vh", background: "#fafafa", fontFamily: font }}>
      {/* Top-right Share button — fixed to page top */}
      <div style={{
        position: "absolute", top: "20px", right: "32px",
        zIndex: 20,
      }}>
        <button
          onClick={onShare}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 14px", borderRadius: "8px", cursor: "pointer",
            fontSize: "13px", fontWeight: "500", fontFamily: font,
            border: "1px solid #e8e8e8", background: "#ffffff",
            color: "#555555",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f5f5f5"; e.currentTarget.style.borderColor = "#d8d8d8"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e8e8e8"; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share
        </button>
      </div>

      <div style={{
        maxWidth: "860px", margin: "0 auto",
        padding: "36px 48px 80px",
        boxSizing: "border-box",
      }}>
        {children}
      </div>
    </main>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function SpinnerSVG({ size = 16 }: { size?: number }) {
  return (
    <svg style={{ animation: "spin 0.75s linear infinite", display: "block" }}
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}