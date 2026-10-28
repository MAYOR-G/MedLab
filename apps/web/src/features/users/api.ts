import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { components } from "@medlab/api-contracts";

export type UserProfileData = components["schemas"]["UserProfileData"];
export type UserProfileResponse = components["schemas"]["UserProfileResponse"];
export type UserProfileUpdateRequest = components["schemas"]["UserProfileUpdateRequest"];
export type OnboardingRequest = components["schemas"]["OnboardingRequest"];
export type WorkspaceData = components["schemas"]["WorkspaceData"];
export type WorkspaceResponse = components["schemas"]["WorkspaceResponse"];
export type WorkspaceUpdateRequest = components["schemas"]["WorkspaceUpdateRequest"];

export function useMyProfile() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: async () => {
      const res = await apiClient<UserProfileResponse>("/api/v1/users/me");
      return res.data;
    },
  });
}

export function useOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OnboardingRequest) => {
      const res = await apiClient<UserProfileResponse>("/api/v1/users/onboarding", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["users", "me"], data);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
    },
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UserProfileUpdateRequest) => {
      const res = await apiClient<UserProfileResponse>("/api/v1/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["users", "me"], data);
    },
  });
}

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: async () => {
      const res = await apiClient<WorkspaceResponse>("/api/v1/workspace");
      return res.data;
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: WorkspaceUpdateRequest) => {
      const res = await apiClient<WorkspaceResponse>("/api/v1/workspace", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["workspace"], data);
    },
  });
}
