import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { components } from "@medlab/api-contracts";

export type DocumentData = components["schemas"]["DocumentData"];
export type DocumentVersionData = components["schemas"]["DocumentVersionData"];
export type DocumentInitRequest = components["schemas"]["DocumentInitRequest"];
export type DocumentInitResponse = components["schemas"]["DocumentInitResponse"];
export type DocumentCompleteUploadRequest = components["schemas"]["DocumentCompleteUploadRequest"];
export type DocumentUpdateRequest = components["schemas"]["DocumentUpdateRequest"];
export type DocumentResponse = components["schemas"]["DocumentResponse"];
export type DocumentListResponse = components["schemas"]["DocumentListResponse"];
export type DocumentDownloadResponse = components["schemas"]["DocumentDownloadResponse"];

export interface DocumentFilters {
  memberId?: string | null;
  category?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}

export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: ["documents", filters],
    queryFn: async () => {
      const res = await apiClient<DocumentListResponse>("/api/v1/documents", {
        params: {
          memberId: filters.memberId || undefined,
          category: filters.category || undefined,
          search: filters.search || undefined,
          limit: filters.limit ?? 50,
          offset: filters.offset ?? 0,
        },
      });
      return res;
    },
  });
}

export function useDocument(documentId: string | null | undefined) {
  return useQuery({
    queryKey: ["documents", documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const res = await apiClient<DocumentResponse>(`/api/v1/documents/${documentId}`);
      return res.data;
    },
    enabled: !!documentId,
  });
}

export function useInitDocumentUpload() {
  return useMutation({
    mutationFn: async (payload: DocumentInitRequest) => {
      return await apiClient<DocumentInitResponse>("/api/v1/documents", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  });
}

export function useCompleteDocumentUpload(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DocumentCompleteUploadRequest) => {
      const res = await apiClient<DocumentResponse>(`/api/v1/documents/${documentId}/complete-upload`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.setQueryData(["documents", documentId], data);
    },
  });
}

export function useUpdateDocument(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DocumentUpdateRequest) => {
      const res = await apiClient<DocumentResponse>(`/api/v1/documents/${documentId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.setQueryData(["documents", documentId], data);
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      await apiClient<void>(`/api/v1/documents/${documentId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useTrashDocuments() {
  return useQuery({
    queryKey: ["documents", "trash"],
    queryFn: async () => {
      const res = await apiClient<DocumentListResponse>("/api/v1/documents/trash");
      return res.data;
    },
  });
}

export function useRestoreDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      const res = await apiClient<DocumentResponse>(`/api/v1/documents/${documentId}/restore`, {
        method: "POST",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function usePermanentDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      await apiClient<void>(`/api/v1/documents/${documentId}/permanent`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export async function fetchDocumentDownloadUrl(documentId: string): Promise<DocumentDownloadResponse> {
  return await apiClient<DocumentDownloadResponse>(`/api/v1/documents/${documentId}/download`);
}
