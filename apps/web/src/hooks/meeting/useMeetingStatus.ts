// apps/web/hooks/meeting/useMeetingStatus.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { meetingApi } from "@/lib/api";
import type { MeetingStatusResponse, MeetingStatus } from "@repo/types";

const TERMINAL: Set<MeetingStatus> = new Set(["completed", "failed"]);
const POLL_MS = 3_000;

export function useMeetingStatus(meetingId: string | null) {
  return useQuery<MeetingStatusResponse>({
    queryKey: ["meeting", meetingId],
    queryFn: () => meetingApi.get(meetingId!),
    enabled: !!meetingId,
    staleTime: 0, // always re-fetch — status can change at any time
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling once processing is done — no point hitting the server
      return status && TERMINAL.has(status) ? false : POLL_MS;
    },
  });
}