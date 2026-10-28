"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/auth/supabase";
import { apiClient } from "@/lib/api/client";
import type { UserProfileResponse } from "@/features/users/api";

interface AuthFormProps {
  mode: "login" | "signup" | "forgot-password";
}

function AuthFormInner({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams?.get("error");
    if (errorParam === "session_expired") {
      setErrorMsg("Your session has expired. Please sign in again.");
    }
  }, [searchParams]);

  // Google OAuth sign-in handler
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMsg(null);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/app`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate Google authentication.";
      setErrorMsg(msg);
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        // Verify owner onboarding and profile status
        try {
          const profileRes = await apiClient<UserProfileResponse>("/api/v1/users/me");
          if (profileRes?.data?.isCompleted) {
            router.push("/app");
          } else {
            router.push("/onboarding");
          }
        } catch {
          router.push("/onboarding");
        }
        router.refresh();
      } else if (mode === "signup") {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        if (error) throw error;

        // If session was returned immediately (auto-confirm enabled)
        if (signUpData.session) {
          router.push("/onboarding");
          router.refresh();
          return;
        }

        setSuccessMsg(
          "Account created successfully! Check your email to confirm or sign in directly to finish your vault profile."
        );
      } else if (mode === "forgot-password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?next=/app/settings`,
        });
        if (error) throw error;
        setSuccessMsg("Password reset email sent! Please check your inbox.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected authentication error occurred.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/60 space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Form Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-primary uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Patient Vault Portal</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          {mode === "login" && "Sign In"}
          {mode === "signup" && "Create Your Vault"}
          {mode === "forgot-password" && "Reset Password"}
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          {mode === "login" && "Sign in to access your household's encrypted records and AI translations."}
          {mode === "signup" && "Register a new zero-knowledge family health vault. Free, private, and secure."}
          {mode === "forgot-password" && "Enter your email address to receive a secure password recovery link."}
        </p>
      </div>

      {/* Error / Success Alerts */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-3.5 border border-red-200 text-xs text-red-700 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{successMsg}</p>
        </div>
      )}

      {/* Google OAuth Button */}
      {mode !== "forgot-password" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full h-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-3 active:scale-[0.99] hover:border-slate-300 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>
              {isGoogleLoading
                ? "Connecting to Google..."
                : mode === "login"
                ? "Continue with Google"
                : "Sign up with Google"}
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              or continue with email
            </span>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="fullName" required className="text-xs font-bold text-slate-700">
              Account Holder Full Name
            </Label>
            <div className="relative">
              <User className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <Input
                id="fullName"
                type="text"
                placeholder="e.g. Jane Doe"
                className="pl-10 h-11 rounded-2xl border-slate-200 text-xs bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" required className="text-xs font-bold text-slate-700">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="pl-10 h-11 rounded-2xl border-slate-200 text-xs bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {mode !== "forgot-password" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required className="text-xs font-bold text-slate-700">
                Password
              </Label>
              {mode === "login" && (
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                className="pl-10 pr-10 h-11 rounded-2xl border-slate-200 text-xs bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 rounded-2xl font-bold gap-2 shadow-md shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm mt-2 transition-all active:scale-[0.99]"
          isLoading={isLoading}
        >
          <span>
            {mode === "login" && "Sign In to Vault"}
            {mode === "signup" && "Create Encrypted Vault"}
            {mode === "forgot-password" && "Send Password Reset Link"}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {/* Switch Form Action Link */}
      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        {mode === "login" && (
          <p>
            Don&apos;t have a vault yet?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline">
              Create an account
            </Link>
          </p>
        )}
        {mode === "signup" && (
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        )}
        {mode === "forgot-password" && (
          <p>
            Remembered your password?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export function AuthForm(props: AuthFormProps) {
  return (
    <React.Suspense
      fallback={
        <div className="w-full h-80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <span className="text-xs font-medium">Loading form...</span>
          </div>
        </div>
      }
    >
      <AuthFormInner {...props} />
    </React.Suspense>
  );
}
