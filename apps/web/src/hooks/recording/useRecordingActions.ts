// apps/web/hooks/recording/useRecordingActions.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordingApi } from "@/lib/api";

export function useDeleteRecording() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recordingApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
      queryClient.invalidateQueries({ queryKey: ["recordings-stats"] });
    },
  });
}

export function useRetryRecording() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recordingApi.retry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
    },
  });
}