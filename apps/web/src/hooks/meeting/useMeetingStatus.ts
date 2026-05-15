// apps/web/hooks/meeting/useMeetingStatus.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { getMeeting } from "@/lib/api";
import type { MeetingStatusResponse, MeetingStatus } from "@repo/types";

const TERMINAL_STATUSES = new Set<MeetingStatus>(["completed", "failed"]);
const POLL_INTERVAL_MS = 3000;

export function useMeetingStatus(meetingId: string | null) {
  return useQuery<MeetingStatusResponse>({
    queryKey: ["meeting", meetingId],
    queryFn: () => getMeeting(meetingId!),
    enabled: !!meetingId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling once we reach a terminal state
      if (status && TERMINAL_STATUSES.has(status)) return false;
      return POLL_INTERVAL_MS;
    },
    staleTime: 0,
  });
}