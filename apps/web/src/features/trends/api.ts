import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { components } from "@medlab/api-contracts";

export type MeasurementData = components["schemas"]["MeasurementData"];
export type MeasurementListResponse = components["schemas"]["MeasurementListResponse"];
export type MeasurementTrendSeries = components["schemas"]["MeasurementTrendSeries"];
export type MeasurementTrendPoint = components["schemas"]["MeasurementTrendPoint"];
export type AnalyteOption = components["schemas"]["AnalyteOption"];
export type AnalyteListResponse = components["schemas"]["AnalyteListResponse"];

export function useMemberMeasurements(
  memberId: string | null | undefined,
  testKey?: string | null
) {
  return useQuery({
    queryKey: ["members", memberId, "measurements", testKey],
    queryFn: async () => {
      if (!memberId) return [];
      const query = testKey ? `?test_key=${encodeURIComponent(testKey)}` : "";
      const res = await apiClient<MeasurementListResponse>(
        `/api/v1/family-members/${memberId}/measurements${query}`
      );
      return res.items || [];
    },
    enabled: !!memberId,
  });
}

export function useMemberAnalytes(memberId: string | null | undefined) {
  return useQuery({
    queryKey: ["members", memberId, "analytes"],
    queryFn: async () => {
      if (!memberId) return [];
      const res = await apiClient<AnalyteListResponse>(
        `/api/v1/family-members/${memberId}/analytes`
      );
      return res.items || [];
    },
    enabled: !!memberId,
  });
}

export function useMemberTrends(
  memberId: string | null | undefined,
  testKey: string | null | undefined
) {
  return useQuery({
    queryKey: ["members", memberId, "trends", testKey],
    queryFn: async () => {
      if (!memberId || !testKey) return null;
      return await apiClient<MeasurementTrendSeries>(
        `/api/v1/family-members/${memberId}/trends?test_key=${encodeURIComponent(testKey)}`
      );
    },
    enabled: !!memberId && !!testKey,
  });
}

export function useDocumentMeasurements(documentId: string | null | undefined) {
  return useQuery({
    queryKey: ["documents", documentId, "measurements"],
    queryFn: async () => {
      if (!documentId) return [];
      const res = await apiClient<MeasurementListResponse>(
        `/api/v1/documents/${documentId}/measurements`
      );
      return res.items || [];
    },
    enabled: !!documentId,
  });
}
