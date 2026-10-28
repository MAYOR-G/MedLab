import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { components } from "@medlab/api-contracts";

export type AISummaryData = components["schemas"]["AISummaryData"];
export type AISummaryResponse = components["schemas"]["AISummaryResponse"];
export type AISummaryListResponse = components["schemas"]["AISummaryListResponse"];
export type AssistantQuestionRequest = components["schemas"]["AssistantQuestionRequest"];
export type AssistantQuestionResponse = components["schemas"]["AssistantQuestionResponse"];

export function useDocumentSummaries(documentId: string | null | undefined) {
  return useQuery({
    queryKey: ["documents", documentId, "summaries"],
    queryFn: async () => {
      if (!documentId) return [];
      const res = await apiClient<AISummaryListResponse>(`/api/v1/documents/${documentId}/summaries`);
      return res.data || [];
    },
    enabled: !!documentId,
  });
}

export function useRequestDocumentSummary(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient<AISummaryResponse>(`/api/v1/documents/${documentId}/summaries`, {
        method: "POST",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", documentId, "summaries"] });
    },
  });
}

export function useAskAssistantQuestion() {
  return useMutation({
    mutationFn: async (payload: AssistantQuestionRequest) => {
      return await apiClient<AssistantQuestionResponse>("/api/v1/assistant/questions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  });
}
