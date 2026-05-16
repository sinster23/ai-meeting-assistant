// apps/web/hooks/recording/useStorageStats.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import type { StorageStats } from "@repo/types";

async function getStorageStats(): Promise<StorageStats> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/recordings/stats`
  );
  if (!res.ok) throw new Error("Failed to fetch storage stats");
  return res.json();
}

export function useStorageStats() {
  return useQuery({
    queryKey: ["recordings-stats"],
    queryFn: getStorageStats,
    refetchInterval: 30_000,
  });
}