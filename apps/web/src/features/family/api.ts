import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { components } from "@medlab/api-contracts";

export type FamilyMemberData = components["schemas"]["FamilyMemberData"];
export type FamilyMemberListResponse = components["schemas"]["FamilyMemberListResponse"];
export type FamilyMemberResponse = components["schemas"]["FamilyMemberResponse"];
export type FamilyMemberCreateRequest = components["schemas"]["FamilyMemberCreateRequest"];
export type FamilyMemberUpdateRequest = components["schemas"]["FamilyMemberUpdateRequest"];

export function useFamilyMembers(search?: string) {
  return useQuery({
    queryKey: ["family-members", { search }],
    queryFn: async () => {
      const res = await apiClient<FamilyMemberListResponse>("/api/v1/family-members", {
        params: { search: search || undefined, limit: 100 },
      });
      return res.data || [];
    },
  });
}

export function useFamilyMember(memberId: string | null | undefined) {
  return useQuery({
    queryKey: ["family-members", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const res = await apiClient<FamilyMemberResponse>(`/api/v1/family-members/${memberId}`);
      return res.data;
    },
    enabled: !!memberId,
  });
}

export function useCreateFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FamilyMemberCreateRequest) => {
      const res = await apiClient<FamilyMemberResponse>("/api/v1/family-members", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
    },
  });
}

export function useUpdateFamilyMember(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FamilyMemberUpdateRequest) => {
      const res = await apiClient<FamilyMemberResponse>(`/api/v1/family-members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
      queryClient.setQueryData(["family-members", memberId], data);
    },
  });
}

export function useDeleteFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      await apiClient<void>(`/api/v1/family-members/${memberId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
    },
  });
}
