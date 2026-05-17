// apps/web/hooks/upload/useUploadsStats.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { uploadApi } from "@/lib/api";
import type { StorageStats } from "@repo/types"; // single source — @repo/types

export function useUploadsStats() {
  return useQuery<StorageStats>({
    queryKey: ["uploads-stats"],
    queryFn: uploadApi.stats,
    refetchInterval: 30_000,
  });
}