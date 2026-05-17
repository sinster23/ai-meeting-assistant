// apps/web/hooks/search/useSearch.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { searchApi } from "@/lib/api";
import type { SearchRequest, SearchResponse } from "@repo/types";

export function useSearch() {
  return useMutation<SearchResponse, Error, SearchRequest>({
    mutationFn: searchApi.query,
  });
}