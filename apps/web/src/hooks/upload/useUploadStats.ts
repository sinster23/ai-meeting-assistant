"use client";

import { useQuery } from "@tanstack/react-query";
import type { StorageStats } from "@repo/types";

async function getUploadsStats(): Promise<StorageStats> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/uploads/stats`
  );
  if (!res.ok) throw new Error("Failed to fetch uploads stats");
  return res.json();
}

export function useUploadsStats() {
  return useQuery({
    queryKey: ["uploads-stats"],
    queryFn: getUploadsStats,
    refetchInterval: 30_000,
  });
}