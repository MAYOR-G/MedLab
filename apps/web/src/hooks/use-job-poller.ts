"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { components } from "@medlab/api-contracts";

export type ProcessingJobData = components["schemas"]["ProcessingJobData"];
export type ProcessingJobResponse = components["schemas"]["ProcessingJobResponse"];

export function useJobPoller(jobId: string | null | undefined) {
  return useQuery({
    queryKey: ["processing-jobs", jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await apiClient<ProcessingJobResponse>(`/api/v1/processing-jobs/${jobId}`);
      return res.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling when terminal state is reached
      if (status === "succeeded" || status === "failed" || status === "cancelled") {
        return false;
      }
      return 2000; // Poll every 2 seconds while queued or running
    },
  });
}
