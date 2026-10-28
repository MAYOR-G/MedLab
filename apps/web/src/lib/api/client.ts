/**
 * Centralized typed HTTP API client for FastAPI backend.
 */

import { env } from "@/lib/env";
import { APIClientError, APIErrorPayload } from "@/lib/api/errors";
import { createClient } from "@/lib/auth/supabase";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Construct URL with query parameters (preventing duplicate /api/v1 prefix)
  const rawBase = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const baseUrl = cleanEndpoint.startsWith("/api/v1")
    ? rawBase.replace(/\/api\/v1$/, "")
    : rawBase;
  const url = new URL(`${baseUrl}${cleanEndpoint}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  // Inject Bearer token if user is authenticated
  if (session?.access_token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  // Inject content-type if body is provided and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Inject correlation request ID if not provided
  if (!headers.has("X-Request-ID") && typeof crypto !== "undefined" && crypto.randomUUID) {
    headers.set("X-Request-ID", crypto.randomUUID());
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorPayload: APIErrorPayload;
    try {
      errorPayload = await response.json();
    } catch {
      errorPayload = {
        error: {
          code: "HTTP_ERROR",
          message: `Request failed with status ${response.status}`,
        },
      };
    }
    throw new APIClientError(response.status, errorPayload);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
