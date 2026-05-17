// apps/web/hooks/meeting/useMeetingsList.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { meetingApi, type MeetingListItem } from "@/lib/api";

export function useMeetingsList() {
  return useQuery<MeetingListItem[]>({
    queryKey: ["meetings"],
    queryFn: meetingApi.list,
    placeholderData: [], // renders empty list instantly — no blank screen on first load
    refetchInterval: 30_000,
  });
}