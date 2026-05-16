// apps/web/hooks/search/useSearch.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import type { SearchRequest, SearchResponse } from "@repo/types";

async function postSearchQuery(payload: SearchRequest): Promise<SearchResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/search/query`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Search failed");
  }
  return res.json();
}

export function useSearch() {
  return useMutation<SearchResponse, Error, SearchRequest>({
    mutationFn: postSearchQuery,
  });
}