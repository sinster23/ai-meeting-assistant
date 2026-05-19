// apps/web/hooks/meeting/useChat.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/lib/api";
import type { ChatHistoryMessage } from "@repo/types/chat";

// ── useChatHistory — loads persisted history on mount ─────────────────────

export function useChatHistory(meetingId: string) {
  return useQuery({
    queryKey: ["chat-history", meetingId],
    queryFn: () => chatApi.history(meetingId),
    select: (data) => data.history,
    // Only fetch when meetingId is available
    enabled: !!meetingId,
    // History doesn't change between tab switches — stale for 1 min
    staleTime: 60_000,
  });
}

// ── Message shape used in the UI ──────────────────────────────────────────

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// ── useChatSession — manages the live conversation state ──────────────────

export function useChatSession(meetingId: string) {
  const queryClient = useQueryClient();

  // Local optimistic messages for this session
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // Load persisted history once
  const { data: history, isLoading: isHistoryLoading } = useChatHistory(meetingId);

  useEffect(() => {
    if (history && !isHistoryLoaded) {
      const hydrated: UIMessage[] = history.map((m: ChatHistoryMessage, i: number) => ({
        id: `history-${i}`,
        role: m.role,
        content: m.content,
      }));
      setMessages(hydrated);
      setIsHistoryLoaded(true);
    }
  }, [history, isHistoryLoaded]);

  const mutation = useMutation({
    mutationFn: (message: string) => chatApi.send(meetingId, message),
    onMutate: (message: string) => {
      // Optimistically add the user message immediately
      const userMsg: UIMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
      };
      // Add a streaming placeholder for the assistant
      const assistantPlaceholder: UIMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        isStreaming: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    },
    onSuccess: (data) => {
      // Replace the streaming placeholder with the real answer
      setMessages((prev) => {
        const updated = [...prev];
        const placeholderIdx = updated.findLastIndex((m) => m.isStreaming);
        if (placeholderIdx !== -1) {
          updated[placeholderIdx] = {
            id: updated[placeholderIdx].id,
            role: "assistant",
            content: data.answer,
            isStreaming: false,
          };
        }
        return updated;
      });
      // Invalidate history so it stays fresh if tab is revisited
      queryClient.invalidateQueries({ queryKey: ["chat-history", meetingId] });
    },
    onError: (error) => {
      // Replace placeholder with an error message
      setMessages((prev) => {
        const updated = [...prev];
        const placeholderIdx = updated.findLastIndex((m) => m.isStreaming);
        if (placeholderIdx !== -1) {
          updated[placeholderIdx] = {
            id: updated[placeholderIdx].id,
            role: "assistant",
            content: `Sorry, something went wrong: ${error.message}`,
            isStreaming: false,
          };
        }
        return updated;
      });
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim() || mutation.isPending) return;
      mutation.mutate(message.trim());
    },
    [mutation]
  );

  return {
    messages,
    sendMessage,
    isLoading: mutation.isPending,
    isHistoryLoading,
  };
}