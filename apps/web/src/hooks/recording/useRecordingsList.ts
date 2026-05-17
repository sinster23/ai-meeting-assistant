// apps/web/hooks/recording/useRecordingsList.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { recordingApi } from "@/lib/api";
import type { RecordingListItem } from "@repo/types"; // single source — @repo/types/recording.ts

export function useRecordingsList() {
  return useQuery<RecordingListItem[]>({
    queryKey: ["recordings"],
    queryFn: recordingApi.list,
    placeholderData: [],
    refetchInterval: 15_000,
  });
}