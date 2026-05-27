// apps/web/app/integrations/page.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { IntegrationCard }  from "@/components/integrations/IntegrationCard";
import { AutomationRow }    from "@/components/integrations/AutomationCard";
import {
  useIntegrationStatus,
  useConnectGoogle,
  useDisconnectProvider,
  useUpdateAutomation,
  useCalendarEvents,
} from "@/hooks/integrations/useIntegrations";
import type { AutomationSettings, CalendarEvent } from "@repo/types/integration";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────

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
// Google Calendar SVG icon (official multicolour)
// ─────────────────────────────────────────────────────────────────────────────

export function GoogleCalendarIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* White base */}
      <rect x="6" y="6" width="36" height="36" rx="3" fill="#fff" />

      {/* Top blue header bar */}
      <rect x="6" y="6" width="36" height="10" rx="3" fill="#1A73E8" />
      <rect x="6" y="12" width="36" height="4" fill="#1A73E8" />

      {/* Corner fold squares (Google Calendar style) */}
      <rect x="6"  y="6" width="6" height="6" rx="3" fill="#1967D2" />
      <rect x="36" y="6" width="6" height="6" rx="3" fill="#1967D2" />

      {/* Ring posts */}
      <rect x="15" y="3" width="4" height="8" rx="2" fill="#1A73E8" />
      <rect x="29" y="3" width="4" height="8" rx="2" fill="#1A73E8" />

      {/* Calendar grid lines */}
      <line x1="6"  y1="26" x2="42" y2="26" stroke="#E0E0E0" strokeWidth="1" />
      <line x1="6"  y1="34" x2="42" y2="34" stroke="#E0E0E0" strokeWidth="1" />
      <line x1="18" y1="16" x2="18" y2="42" stroke="#E0E0E0" strokeWidth="1" />
      <line x1="30" y1="16" x2="30" y2="42" stroke="#E0E0E0" strokeWidth="1" />

      {/* "31" date number — Google Calendar signature */}
      <text
        x="24"
        y="38"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fontFamily="'Google Sans', sans-serif"
        fill="#1A73E8"
      >
        31
      </text>

      {/* Outer border */}
      <rect x="6" y="6" width="36" height="36" rx="3" fill="none" stroke="#DADCE0" strokeWidth="1" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Meeting platform icon — detects Google Meet, Zoom, Teams, generic
// ─────────────────────────────────────────────────────────────────────────────

function MeetingPlatformIcon({ meetLink }: { meetLink: string | null }) {
  const size = 18;

  if (!meetLink) {
    // Generic calendar dot icon
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke={purple[400]} strokeWidth="1.8" />
        <line x1="16" y1="2" x2="16" y2="6" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="8"  y1="2" x2="8"  y2="6" stroke={purple[400]} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="3"  y1="10" x2="21" y2="10" stroke={purple[400]} strokeWidth="1.8" />
        <circle cx="12" cy="16" r="2" fill={purple[400]} />
      </svg>
    );
  }

  const url = meetLink.toLowerCase();

  // Google Meet
  if (url.includes("meet.google") || url.includes("meet.google.com")) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path d="M28 24L38 14v20L28 24z" fill="#00832D" />
        <rect x="6" y="14" width="22" height="20" rx="3" fill="#00897B" />
        <rect x="6" y="14" width="22" height="20" rx="3" fill="#0F9D58" />
        <path d="M28 24L38 14v20L28 24z" fill="#00832D" />
        <rect x="8"  y="16" width="18" height="16" rx="2" fill="#fff" opacity="0.15" />
        {/* Simplified Meet camera icon */}
        <rect x="7"  y="15" width="20" height="18" rx="2.5" fill="#1E8E3E" />
        <path d="M27 20l8-4v16l-8-4V20z" fill="#34A853" />
        <rect x="9"  y="17" width="16" height="14" rx="2" fill="#fff" opacity="0.9" />
        <circle cx="17" cy="24" r="4" fill="#1E8E3E" />
        <circle cx="17" cy="24" r="2.2" fill="#fff" />
      </svg>
    );
  }

  // Zoom
  if (url.includes("zoom.us") || url.includes("zoom.com")) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="10" fill="#2D8CFF" />
        <path d="M8 16h20a4 4 0 014 4v8a4 4 0 01-4 4H8a4 4 0 01-4-4v-8a4 4 0 014-4z" fill="#fff" />
        <path d="M32 20l12-6v20l-12-6V20z" fill="#fff" />
      </svg>
    );
  }

  // Microsoft Teams
  if (url.includes("teams.microsoft") || url.includes("teams.live")) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="10" fill="#6264A7" />
        <text x="8" y="34" fontSize="26" fontWeight="800" fontFamily="sans-serif" fill="#fff">T</text>
        <circle cx="34" cy="16" r="7" fill="#fff" opacity="0.9" />
        <circle cx="34" cy="16" r="4" fill="#6264A7" />
      </svg>
    );
  }

  // Generic video link
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="15" height="10" rx="2" fill={purple[600]} />
      <path d="M17 10l5-3v10l-5-3V10z" fill={purple[400]} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Automation metadata
// ─────────────────────────────────────────────────────────────────────────────

type AutomationKey = keyof AutomationSettings;

interface AutomationMeta {
  key:             AutomationKey;
  label:           string;
  description:     string;
  tag?:            string;
  icon:            React.ReactNode;
  requiresGoogle?: boolean;
  comingSoon?:     boolean;
}

const AUTOMATION_META: AutomationMeta[] = [
  {
    key:         "autoSummarize",
    label:       "Auto-create summaries",
    description: "Generate a summary automatically when a meeting finishes processing.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={purple[600]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    key:            "autoImportCalendar",
    label:          "Auto-import calendar meetings",
    description:    "Pull upcoming Google Calendar events into Meetnote automatically.",
    tag:            "Requires Google",
    requiresGoogle: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={purple[600]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8"  y1="2" x2="8"  y2="6"/>
        <line x1="3"  y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    key:         "autoEmailSummary",
    label:       "Auto-send summary by email",
    description: "Email the meeting summary to attendees after processing completes.",
    tag:         "Requires Email",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={purple[600]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  {
    key:        "autoStartRecording",
    label:      "Auto-start recording",
    description:"Automatically begin recording when a calendar event starts.",
    tag:        "Coming soon",
    comingSoon: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="3" fill="#bbb"/>
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h2 style={{
        fontSize:      "15px",
        fontWeight:    "700",
        color:         "#111",
        fontFamily:    font,
        margin:        "0 0 3px",
        letterSpacing: "-0.02em",
      }}>
        {label}
      </h2>
      {sub && (
        <p style={{ fontSize: "12px", color: "#999", fontFamily: font, margin: 0 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background:    "#fff",
      border:        `1px solid ${purple[100]}`,
      borderRadius:  "14px",
      padding:       "20px",
      display:       "flex",
      flexDirection: "column",
      gap:           "12px",
    }}>
      {[44, 14, 12, 10, 32].map((h, i) => (
        <div key={i} style={{
          height:         h,
          width:          i === 4 ? "100%" : ["44px", "60%", "85%", "70%", "100%"][i],
          borderRadius:   "8px",
          background:     purple[50],
          animation:      "skPulse 1.4s ease-in-out infinite",
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
      <style>{`@keyframes skPulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar events panel
// ─────────────────────────────────────────────────────────────────────────────

function formatEventTime(iso: string): string {
  const d        = new Date(iso);
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday    = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time       = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (isToday)    return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + ` · ${time}`;
}

function CalendarPanel({ events, isLoading }: { events?: CalendarEvent[]; isLoading: boolean }) {
  if (isLoading) return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      gap:           "1px",
      background:    purple[50],
      borderRadius:  "12px",
      overflow:      "hidden",
    }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height:       "60px",
          background:   "#fff",
          borderBottom: `1px solid ${purple[50]}`,
        }} />
      ))}
    </div>
  );

  if (!events || events.length === 0) return (
    <div style={{
      padding:      "32px 24px",
      textAlign:    "center",
      background:   "#fff",
      border:       `1px solid ${purple[100]}`,
      borderRadius: "14px",
    }}>
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>📅</div>
      <p style={{ fontSize: "13px", fontWeight: "600", color: "#333", fontFamily: font, margin: "0 0 4px" }}>
        No upcoming meetings
      </p>
      <p style={{ fontSize: "12px", color: "#bbb", fontFamily: font, margin: 0 }}>
        Your next 7 days are clear.
      </p>
    </div>
  );

  return (
    <div style={{
      background:   "#fff",
      border:       `1px solid ${purple[100]}`,
      borderRadius: "14px",
      overflow:     "hidden",
    }}>
      {events.map((event, i) => (
        <div
          key={event.id}
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "12px",
            padding:      "12px 16px",
            borderBottom: i < events.length - 1 ? `1px solid ${purple[50]}` : "none",
          }}
        >

          {/* Platform icon */}
          <div style={{
            width:          "32px",
            height:         "32px",
            borderRadius:   "8px",
            background:     purple[50],
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
            overflow:       "hidden",
          }}>
            <MeetingPlatformIcon meetLink={event.meetLink} />
          </div>

          {/* Title + time */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize:      "13px",
              fontWeight:    "600",
              color:         "#111",
              fontFamily:    font,
              margin:        "0 0 2px",
              whiteSpace:    "nowrap",
              overflow:      "hidden",
              textOverflow:  "ellipsis",
              letterSpacing: "-0.01em",
            }}>
              {event.title}
            </p>
            <p style={{ fontSize: "11px", color: "#999", fontFamily: font, margin: 0 }}>
              {formatEventTime(event.startAt)}
              {event.attendees.length > 0 && ` · ${event.attendees.length} attendee${event.attendees.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Join button — purple, squared */}
          {event.meetLink && (
            <a
              href={event.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display:        "inline-flex",
                alignItems:     "center",
                justifyContent: "center",
                gap:            "5px",
                fontSize:       "11px",
                fontWeight:     "600",
                color:          "#fff",
                background:     purple[600],
                border:         "none",
                borderRadius:   "6px",
                padding:        "5px 12px",
                textDecoration: "none",
                flexShrink:     0,
                fontFamily:     font,
                letterSpacing:  "0.01em",
                cursor:         "pointer",
                transition:     "background 0.15s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = purple[800])}
              onMouseLeave={e => (e.currentTarget.style.background = purple[600])}
            >
              {/* Small video camera icon inside button */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="7" width="14" height="10" rx="2" fill="rgba(255,255,255,0.9)" />
                <path d="M16 10l6-3.5v11L16 14V10z" fill="rgba(255,255,255,0.7)" />
              </svg>
              Join
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────

function ConnectToast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div style={{
      position:     "fixed",
      top:          "20px",
      right:        "20px",
      zIndex:       100,
      display:      "flex",
      alignItems:   "center",
      gap:          "10px",
      padding:      "12px 18px",
      borderRadius: "12px",
      background:   type === "success" ? "#dcfce7" : "#fee2e2",
      border:       `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
      boxShadow:    "0 4px 20px rgba(0,0,0,0.10)",
      fontFamily:   font,
      fontSize:     "13px",
      fontWeight:   "500",
      color:        type === "success" ? "#15803d" : "#dc2626",
      animation:    "toastIn 0.3s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {type === "success" ? "✓" : "⚠"} {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const connected    = searchParams.get("connected");
  const error        = searchParams.get("error");

  const { data, isLoading }         = useIntegrationStatus();
  const { connect: connectGoogle }  = useConnectGoogle();
  const disconnect                  = useDisconnectProvider();
  const updateAuto                  = useUpdateAutomation();

  const providers       = data?.providers ?? [];
  const automation      = data?.automation;
  const googleInfo      = providers.find(p => p.provider === "google");
  const googleConnected = googleInfo?.status === "connected";

  const { data: calendarEvents, isLoading: calendarLoading } = useCalendarEvents(googleConnected);

  useEffect(() => {
    if (!connected && !error) return;
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }, 3500);
    return () => clearTimeout(t);
  }, [connected, error]);

  function handleConnect(provider: string) {
    if (provider === "google") connectGoogle();
  }

  function handleDisconnect(provider: string) {
    disconnect.mutate(provider);
  }

  function handleAutomationChange(key: AutomationKey, value: boolean) {
    updateAuto.mutate({ [key]: value });
  }

  return (
    <div style={{
      minHeight:  "100vh",
      background: "#f5f4fb",
      fontFamily: font,
    }}>
      {/* Toasts */}
      {connected === "google" && (
        <ConnectToast message="Google Calendar connected successfully." type="success" />
      )}
      {error === "google_denied" && (
        <ConnectToast message="Google access was denied." type="error" />
      )}
      {error === "google_invalid_callback" && (
        <ConnectToast message="Something went wrong with Google sign-in." type="error" />
      )}

      <div style={{
        padding:   "40px 58px 80px",
        boxSizing: "border-box",
        width:     "100%",
      }}>

        {/* Page header */}
        <div style={{
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          marginBottom:   "32px",
          gap:            "16px",
        }}>
          <div>
            <h1 style={{
              fontSize:      "22px",
              fontWeight:    "700",
              color:         "#111111",
              letterSpacing: "-0.025em",
              margin:        "0 0 6px",
              fontFamily:    font,
            }}>
              Integrations
            </h1>
            <p style={{ fontSize: "14px", color: "#888888", margin: 0, fontFamily: font }}>
              Connect your workflow tools and automate meeting actions.
            </p>
          </div>
        </div>

        {/* Section 1: Provider grid */}
        <div style={{ marginBottom: "40px" }}>
          <SectionHeader
            label="Connect your tools"
            sub="Google Calendar is live. More integrations coming soon."
          />

          {isLoading ? (
            <div style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap:                 "14px",
            }}>
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap:                 "14px",
            }}>
              {providers.map(provider => (
                <IntegrationCard
                  key={provider.provider}
                  info={provider}
                  // Pass the Google Calendar icon override for the google provider
                  iconOverride={
                    provider.provider === "google"
                      ? <GoogleCalendarIcon size={40} />
                      : undefined
                  }
                  onConnect={()    => handleConnect(provider.provider)}
                  onDisconnect={()  => handleDisconnect(provider.provider)}
                  isDisconnecting={
                    disconnect.isPending &&
                    disconnect.variables === provider.provider
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Automation */}
        <div style={{ marginBottom: "40px" }}>
          <SectionHeader
            label="Automation"
            sub="Configure what happens automatically after each meeting."
          />

          <div style={{
            background:   "#fff",
            border:       `1px solid ${purple[100]}`,
            borderRadius: "14px",
            overflow:     "hidden",
            boxShadow:    `0 1px 4px rgba(83,74,183,0.05)`,
          }}>
            {isLoading
              ? [1, 2, 3, 4].map((i, idx) => (
                  <div key={i} style={{
                    height:       "62px",
                    borderBottom: idx < 3 ? `1px solid ${purple[50]}` : "none",
                    background:   "#fff",
                    animation:    "skPulse 1.4s ease-in-out infinite",
                  }} />
                ))
              : AUTOMATION_META.map((meta, idx) => {
                  const isGoogleRequired = meta.requiresGoogle && !googleConnected;
                  const isComingSoon     = meta.comingSoon;
                  const isDisabled       = isGoogleRequired || isComingSoon;
                  const tag = isGoogleRequired
                    ? "Connect Google first"
                    : isComingSoon
                    ? "Coming soon"
                    : meta.tag;

                  return (
                    <AutomationRow
                      key={meta.key}
                      icon={meta.icon}
                      label={meta.label}
                      description={meta.description}
                      tag={tag}
                      checked={!isDisabled && (automation?.[meta.key] ?? false)}
                      onChange={(v) => !isDisabled && handleAutomationChange(meta.key, v)}
                      disabled={isDisabled}
                      isLast={idx === AUTOMATION_META.length - 1}
                    />
                  );
                })
            }
          </div>
        </div>

        {/* Section 3: Upcoming calendar events */}
        {(googleConnected || calendarLoading) && (
          <div style={{ marginBottom: "40px" }}>
            <SectionHeader
              label="Upcoming meetings"
              sub="Next 7 days from your Google Calendar."
            />
            <CalendarPanel events={calendarEvents} isLoading={calendarLoading} />
          </div>
        )}

        {/* Section 4: AI Workflows teaser */}
        <div style={{
          background:   `linear-gradient(135deg, ${purple[900]} 0%, #1a1040 100%)`,
          border:       `1px solid ${purple[800]}`,
          borderRadius: "14px",
          padding:      "24px 28px",
          display:      "flex",
          alignItems:   "center",
          gap:          "20px",
        }}>
          <div style={{
            width:          "44px",
            height:         "44px",
            borderRadius:   "12px",
            background:     "rgba(255,255,255,0.08)",
            border:         "1px solid rgba(255,255,255,0.12)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize:      "13px",
              fontWeight:    "600",
              color:         "#fff",
              fontFamily:    font,
              margin:        "0 0 4px",
              letterSpacing: "-0.01em",
            }}>
              AI Workflows — coming soon
            </p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontFamily: font, margin: 0, lineHeight: 1.5 }}>
              Action items → Slack. Meeting ended → email summary. Calendar event → auto-record.
              Set it once, Meetnote handles the rest.
            </p>
          </div>
          <div style={{
            fontSize:      "11px",
            fontWeight:    "600",
            color:         purple[400],
            fontFamily:    font,
            flexShrink:    0,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            Soon →
          </div>
        </div>

      </div>
    </div>
  );
}