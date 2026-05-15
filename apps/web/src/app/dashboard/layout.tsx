// apps/web/app/dashboard/layout.tsx
"use client";

import { Sidebar } from "@/components/sidebar/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#faf9ff", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
    </div>
  );
}