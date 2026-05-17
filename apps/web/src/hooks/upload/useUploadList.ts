// apps/web/hooks/upload/useUploadsList.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { uploadApi } from "@/lib/api";
import type { RecordingListItem } from "@repo/types"; // single source — @repo/types/recording.ts

export function useUploadsList() {
  return useQuery<RecordingListItem[]>({
    queryKey: ["uploads"],
    queryFn: uploadApi.list,
    placeholderData: [],
    refetchInterval: 15_000,
  });
}