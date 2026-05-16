"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Delete ────────────────────────────────────────────────────────────────

async function deleteUpload(uploadId: string): Promise<void> {
  const res = await fetch(`${API}/uploads/${uploadId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete upload");
}

export function useDeleteUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      queryClient.invalidateQueries({ queryKey: ["uploads-stats"] });
    },
  });
}

// ── Retry ─────────────────────────────────────────────────────────────────

async function retryUpload(uploadId: string): Promise<void> {
  const res = await fetch(`${API}/uploads/${uploadId}/retry`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to retry upload");
}

export function useRetryUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
    },
  });
}