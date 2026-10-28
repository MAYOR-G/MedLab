import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { components } from "@medlab/api-contracts";

export type CreateShareLinkRequest = components["schemas"]["CreateShareLinkRequest"];
export type ShareLinkCreatedResponse = components["schemas"]["ShareLinkCreatedResponse"];
export type ShareLinkItem = components["schemas"]["ShareLinkItem"];
export type ShareLinkListResponse = components["schemas"]["ShareLinkListResponse"];
export type PublicShareDocumentResponse = components["schemas"]["PublicShareDocumentResponse"];

export function useDocumentShares(documentId: string | null | undefined) {
  return useQuery({
    queryKey: ["documents", documentId, "shares"],
    queryFn: async () => {
      if (!documentId) return [];
      const res = await apiClient<ShareLinkListResponse>(`/api/v1/documents/${documentId}/shares`);
      return res.items || [];
    },
    enabled: !!documentId,
  });
}

export function useWorkspaceShares() {
  return useQuery({
    queryKey: ["shares"],
    queryFn: async () => {
      const res = await apiClient<ShareLinkListResponse>("/api/v1/shares");
      return res.items || [];
    },
  });
}

export function useCreateShareLink(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateShareLinkRequest) => {
      return await apiClient<ShareLinkCreatedResponse>(`/api/v1/documents/${documentId}/shares`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", documentId, "shares"] });
      queryClient.invalidateQueries({ queryKey: ["shares"] });
    },
  });
}

export function useRevokeShareLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shareLinkId: string) => {
      return await apiClient<ShareLinkItem>(`/api/v1/shares/${shareLinkId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function usePublicShare(token: string | null | undefined) {
  return useQuery({
    queryKey: ["public", "shares", token],
    queryFn: async () => {
      if (!token) return null;
      return await apiClient<PublicShareDocumentResponse>(`/api/v1/public/shares/${token}`);
    },
    enabled: !!token,
    retry: false,
  });
}
