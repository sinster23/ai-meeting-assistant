// apps/web/hooks/recording/useRecordingActions.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Delete ────────────────────────────────────────────────────────────────

async function deleteRecording(recordingId: string): Promise<void> {
  const res = await fetch(`${API}/recordings/${recordingId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete recording");
}

export function useDeleteRecording() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecording,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
      queryClient.invalidateQueries({ queryKey: ["recordings-stats"] });
    },
  });
}

// ── Retry ─────────────────────────────────────────────────────────────────

async function retryRecording(
  recordingId: string
): Promise<{ recordingId: string; status: string }> {
  const res = await fetch(`${API}/recordings/${recordingId}/retry`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to retry recording");
  return res.json();
}

export function useRetryRecording() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryRecording,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
    },
  });
}