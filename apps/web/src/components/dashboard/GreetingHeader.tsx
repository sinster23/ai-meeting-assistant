// apps/web/components/dashboard/GreetingHeader.tsx
"use client";

import { useMemo } from "react";
import { useSession } from "@/hooks/auth/useSession";

const purple = {
  400: "#7F77DD",
};

export function GreetingHeader() {
  const { data: session } = useSession();

  const { greeting } = useMemo(() => {
    const hour = new Date().getHours();
    const g = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
    return { greeting: g };
  }, []);

  // Pull first name only — "John Doe" → "John"
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

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
          {greeting}, {firstName}.
        </h1>
        <p style={{
          fontSize: "13px",
          color: purple[400],
          margin: 0,
          fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
          letterSpacing: "-0.01em",
        }}>
          Ideas & conversations stay local, private, and in your control.
        </p>
      </div>
    </div>
  );
}