// apps/web/components/dashboard/StatsCards.tsx
"use client";

interface StatsCardsProps {
  totalMeetings: number;
  completedMeetings: number;
  totalActionItems: number;
}

export function StatsCards({ totalMeetings, completedMeetings, totalActionItems }: StatsCardsProps) {
  const stats = [
    {
      label: "Meetings Recorded",
      value: totalMeetings,
      valueLabel: null,
      subLabel: totalMeetings === 1 ? "1 session captured" : `${totalMeetings} sessions captured`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: "Transcribed",
      value: completedMeetings,
      valueLabel: null,
      subLabel: completedMeetings === 0
        ? "none yet"
        : `${completedMeetings} of ${totalMeetings} complete`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
    },
    {
      label: "Action Items",
      value: totalActionItems,
      valueLabel: null,
      subLabel: totalActionItems === 0 ? "none extracted yet" : `across all meetings`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ marginBottom: "28px", marginTop: "28px" }}>
      {/* Local storage privacy badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "14px",
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span style={{
          fontSize: "12px",
          fontWeight: "500",
          color: "#555555",
          fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
        }}>
          Everything stored locally — your data never leaves your device
        </span>
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "14px",
      }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#ffffff",
              border: "1px solid #e8e8e8",
              borderRadius: "14px",
              padding: "18px 20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            {/* Icon area */}
            <div style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "#f4f4f4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              {stat.icon}
            </div>

            <div>
              <div style={{
                fontSize: "11px",
                fontWeight: "500",
                color: "#999999",
                letterSpacing: "0.01em",
                marginBottom: "2px",
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "#111111",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}>
                {stat.valueLabel ?? stat.value}
              </div>
              {stat.subLabel && (
                <div style={{ fontSize: "11px", color: "#bbbbbb", marginTop: "2px" }}>
                  {stat.subLabel}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}