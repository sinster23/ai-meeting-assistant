// apps/web/components/dashboard/GreetingHeader.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

export function GreetingHeader() {
  const router = useRouter();

  const { greeting, sub } = useMemo(() => {
    const hour = new Date().getHours();
    const g = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
    return {
      greeting: g,
      sub: "Ideas & conversations stay local, private, and in your control.",
    };
  }, []);

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginBottom: "28px",
    }}>
      <div>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "#111111",
          letterSpacing: "-0.03em",
          margin: "0 0 5px",
          fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        }}>
          {greeting}, Moe.
        </h1>
        <p style={{
          fontSize: "13px",
          color: "#888888",
          margin: 0,
          fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
          letterSpacing: "-0.01em",
        }}>
          {sub}
        </p>
      </div>
    </div>
  );
}