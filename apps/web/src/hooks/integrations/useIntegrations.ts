// apps/web/hooks/integrations/useIntegrations.ts
"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationApi } from "@/lib/api";
import type { AutomationSettings } from "@repo/types/integration";

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────

export const integrationKeys = {
  status:   ["integrations", "status"]   as const,
  calendar: ["integrations", "calendar"] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// useIntegrationStatus
// Fetches the full provider catalogue + automation settings.
// If the URL contains ?connected=google we immediately invalidate the cache
// so the status refetch reflects the freshly-saved token, not stale data.
// ─────────────────────────────────────────────────────────────────────────────

export function useIntegrationStatus() {
  const queryClient = useQueryClient();

  // On mount: if we just came back from the OAuth redirect, bust the cache
  // so the query re-fetches with the newly-connected status.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "google") {
      queryClient.invalidateQueries({ queryKey: integrationKeys.status });
    }
  }, [queryClient]);

  return useQuery({
    queryKey: integrationKeys.status,
    queryFn:  integrationApi.status,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useConnectGoogle
// ─────────────────────────────────────────────────────────────────────────────

export function useConnectGoogle() {
  function connect() {
    window.location.href = integrationApi.googleConnectUrl();
  }
  return { connect };
}

// ─────────────────────────────────────────────────────────────────────────────
// useDisconnectProvider
// ─────────────────────────────────────────────────────────────────────────────

export function useDisconnectProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: string) => integrationApi.disconnect(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.status });
      queryClient.invalidateQueries({ queryKey: integrationKeys.calendar });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateAutomation
// ─────────────────────────────────────────────────────────────────────────────

export function useUpdateAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<AutomationSettings>) =>
      integrationApi.updateAutomation(updates),

    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: integrationKeys.status });
      const previous = queryClient.getQueryData(integrationKeys.status);
      queryClient.setQueryData(integrationKeys.status, (old: any) => {
        if (!old) return old;
        return { ...old, automation: { ...old.automation, ...updates } };
      });
      return { previous };
    },

    onError: (_err, _vars, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(integrationKeys.status, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.status });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useCalendarEvents
// Only enabled when Google is confirmed connected AND status fetch is settled.
// Uses `select` to surface only the events array.
// ─────────────────────────────────────────────────────────────────────────────

export function useCalendarEvents(googleConnected: boolean) {
  return useQuery({
    queryKey: integrationKeys.calendar,
    queryFn:  () => integrationApi.calendarEvents(7),
    // Extra guard: only fire when explicitly true, not undefined/falsy
    enabled:  googleConnected === true,
    staleTime: 5 * 60_000,
    // Don't retry on 403 — it means Google isn't actually connected yet.
    // Retrying would just spam the backend during the post-OAuth status refetch race.
    retry: (failureCount, error: any) => {
      if (error?.message?.includes("403") || error?.message?.includes("not connected")) {
        return false;
      }
      return failureCount < 2;
    },
    select: (data) => data.events,
  });
}