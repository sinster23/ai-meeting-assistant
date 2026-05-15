// apps/web/components/sidebar/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    exact: true,
    label: "Home",
    sub: "Overview & quick actions",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/meetings",
    label: "Meetings",
    sub: "All recordings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/recordings",
    label: "Recordings",
    sub: "Local captures",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/uploads",
    label: "Uploads",
    sub: "Import audio files",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/search",
    label: "Search",
    sub: "AI-powered search",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/integrations",
    label: "Integrations",
    sub: "Calendar, Slack & more",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="9" height="9" rx="1"/>
        <rect x="13" y="2" width="9" height="9" rx="1"/>
        <rect x="2" y="13" width="9" height="9" rx="1"/>
        <rect x="13" y="13" width="9" height="9" rx="1"/>
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside style={{
      width: "260px",
      minWidth: "240px",
      height: "100vh",
      background: "#ffffff",
      borderRight: "1px solid #e8e8e8",
      display: "flex",
      flexDirection: "column",
      fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            background: "#111111",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#111111", letterSpacing: "-0.02em" }}>
              Meetnote
            </div>
            <div style={{ fontSize: "11px", color: "#999999", marginTop: "1px" }}>
              AI Meeting Assistant
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px", overflowY: "auto" }}>
        <div style={{
          fontSize: "10px",
          fontWeight: "600",
          color: "#bbbbbb",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "8px 8px 6px",
        }}>
          Workspace
        </div>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                marginBottom: "1px",
                background: active ? "#f4f4f4" : "transparent",
                textDecoration: "none",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "#f9f9f9";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{
                color: active ? "#111111" : "#aaaaaa",
                flexShrink: 0,
                display: "flex",
              }}>
                {item.icon}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: "13px",
                  fontWeight: active ? "600" : "500",
                  color: active ? "#111111" : "#666666",
                  lineHeight: 1.3,
                  letterSpacing: "-0.01em",
                }}>
                  {item.label}
                </div>
                {item.sub && (
                  <div style={{
                    fontSize: "11px",
                    color: active ? "#888888" : "#cccccc",
                    marginTop: "1px",
                  }}>
                    {item.sub}
                  </div>
                )}
              </div>
              {active && (
                <div style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#111111",
                  flexShrink: 0,
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "8px 8px 14px", borderTop: "1px solid #f0f0f0" }}>
        <Link
          href="/dashboard/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 10px",
            borderRadius: "8px",
            marginBottom: "6px",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ color: "#aaaaaa", display: "flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </span>
          <span style={{ fontSize: "13px", fontWeight: "500", color: "#666666", letterSpacing: "-0.01em" }}>
            Settings
          </span>
        </Link>

        {/* User row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 10px",
          borderRadius: "10px",
          background: "#f9f9f9",
          border: "1px solid #f0f0f0",
        }}>
          <div style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: "#111111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "700",
            color: "#ffffff",
            flexShrink: 0,
          }}>
            U
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#111111", letterSpacing: "-0.01em" }}>
              Upayan
            </div>
            <div style={{ fontSize: "11px", color: "#999999" }}>Free plan</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cccccc" strokeWidth="2">
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </div>
        </div>
      </div>
    </aside>
  );
}