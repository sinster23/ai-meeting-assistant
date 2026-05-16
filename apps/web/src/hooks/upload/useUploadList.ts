"use client";

import { useQuery } from "@tanstack/react-query";
import type { RecordingListItem } from "@repo/types";

async function getUploadsList(): Promise<RecordingListItem[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/uploads`
  );
  if (!res.ok) throw new Error("Failed to fetch uploads");
  return res.json();
}

export function useUploadsList() {
  return useQuery({
    queryKey: ["uploads"],
    queryFn: getUploadsList,
    refetchInterval: 10_000,
  });
}