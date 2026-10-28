"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/auth/supabase";
import { apiClient } from "@/lib/api/client";
import type { UserProfileResponse } from "@/features/users/api";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient();
        const next = searchParams.get("next") || "/app";

        // Check if there is an active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          try {
            const profileRes = await apiClient<UserProfileResponse>("/api/v1/users/me");
            if (profileRes?.data?.isCompleted) {
              router.replace(next);
            } else {
              router.replace("/onboarding");
            }
          } catch {
            router.replace("/onboarding");
          }
        } else {
          router.replace("/login");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Authentication verification failed.";
        setError(msg);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-card border border-semantic-error-border bg-semantic-error-bg p-6 text-center text-semantic-error-text">
          <p className="font-semibold text-sm">Authentication Error</p>
          <p className="mt-1 text-xs">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 inline-block text-xs font-semibold text-primary underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-text-secondary">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs font-medium">Verifying your credentials...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3 text-text-secondary">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs font-medium">Loading authentication...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
