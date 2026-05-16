// apps/web/hooks/recording/useRecordingsList.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import type { RecordingListItem } from "@repo/types";

async function getRecordingsList(): Promise<RecordingListItem[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/recordings`
  );
  if (!res.ok) throw new Error("Failed to fetch recordings");
  return res.json();
}

export function useRecordingsList() {
  return useQuery({
    queryKey: ["recordings"],
    queryFn: getRecordingsList,
    refetchInterval: 10_000,
  });
}