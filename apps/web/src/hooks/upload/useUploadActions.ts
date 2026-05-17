// apps/web/hooks/upload/useUploadActions.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadApi } from "@/lib/api";

export function useDeleteUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      queryClient.invalidateQueries({ queryKey: ["uploads-stats"] });
    },
  });
}

export function useRetryUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadApi.retry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
    },
  });
}