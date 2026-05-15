// apps/web/hooks/meeting/useMeetingsList.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { MeetingStatus } from "@repo/types";

interface MeetingListItem {
  meetingId: string;
  status: MeetingStatus;
  createdAt: string;
  summary: string | null;
}

async function getMeetingsList(): Promise<MeetingListItem[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/meetings`
  );
  if (!res.ok) throw new Error("Failed to fetch meetings");
  return res.json();
}

export function useMeetingsList() {
  return useQuery({
    queryKey: ["meetings"],
    queryFn: getMeetingsList,
    refetchInterval: 10_000, // re-poll every 10s to catch status updates
  });
}