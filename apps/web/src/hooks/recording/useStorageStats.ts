// apps/web/hooks/recording/useStorageStats.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { recordingApi } from "@/lib/api";
import type { StorageStats } from "@repo/types"; // single source — @repo/types

export function useStorageStats() {
  return useQuery<StorageStats>({
    queryKey: ["recordings-stats"],
    queryFn: recordingApi.stats,
    refetchInterval: 30_000,
  });
}