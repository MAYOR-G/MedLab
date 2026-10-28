"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/auth/supabase";
import { useMyProfile } from "@/features/users/api";
import { APIClientError } from "@/lib/api/errors";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useMyProfile();

  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (mounted) {
            setIsAuthenticated(false);
            router.replace("/login");
          }
          return;
        }

        if (mounted) {
          setIsAuthenticated(true);
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
          router.replace("/login");
        }
      }
    };

    checkSession();
    return () => {
      mounted = false;
    };
  }, [router]);

  // Handle session expiry or profile completion redirect
  useEffect(() => {
    if (isAuthenticated === false) return;

    if (profileError) {
      if (profileError instanceof APIClientError && profileError.status === 401) {
        const supabase = createClient();
        supabase.auth.signOut().finally(() => {
          router.replace("/login?error=session_expired");
        });
        return;
      }
    }

    if (profile && !isProfileLoading) {
      if (!profile.isCompleted) {
        router.replace("/onboarding");
      }
    }
  }, [profile, isProfileLoading, profileError, isAuthenticated, router]);

  // Display loader while authenticating or redirecting incomplete users
  if (isAuthenticated === null || isProfileLoading || (profile && !profile.isCompleted)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-xs font-semibold">Accessing Encrypted Vault...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

