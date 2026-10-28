"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  Calendar,
  FileHeart,
  Home,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/auth/supabase";
import { useMyProfile, useOnboarding } from "@/features/users/api";

function OnboardingContent() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [notes, setNotes] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading: isProfileLoading } = useMyProfile();
  const onboardingMutation = useOnboarding();

  // Verify authentication and profile status
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        // Pre-fill full name from Supabase user metadata if available
        const metaName = session.user.user_metadata?.full_name;
        if (metaName && !fullName) {
          setFullName(metaName);
        }

        setIsVerifying(false);
      } catch {
        router.replace("/login");
      }
    };

    checkAuthStatus();
  }, [router]);

  // If user profile is already completed, go straight to dashboard
  useEffect(() => {
    if (profile?.isCompleted) {
      router.replace("/app");
    }
  }, [profile, router]);

  // Auto focus input on step change
  useEffect(() => {
    if (!isVerifying && !isProfileLoading) {
      inputRef.current?.focus();
    }
  }, [step, isVerifying, isProfileLoading]);

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (step === 1) {
      if (!fullName.trim()) {
        setErrorMsg("Please enter your full legal name to continue.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleFinish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setStep(1);
      setErrorMsg("Full legal name is required.");
      return;
    }

    try {
      await onboardingMutation.mutateAsync({
        fullName: trimmedName,
        dateOfBirth: dateOfBirth ? dateOfBirth : null,
        notes: notes.trim() || null,
        workspaceName: workspaceName.trim() || null,
      });

      router.replace("/app");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to complete onboarding. Please verify your details and retry.";
      setErrorMsg(msg);
    }
  };

  if (isVerifying || isProfileLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-xs font-semibold">Accessing Vault Credentials...</p>
        </div>
      </div>
    );
  }

  const defaultVaultName = fullName.trim()
    ? `${fullName.trim().split(" ")[0]}'s Family Vault`
    : "My Family Vault";

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-200/80 p-6 sm:p-8 space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header & Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-bold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Vault Owner Onboarding</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Step {step} of 4
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Pop-Out Step 1: Legal Name */}
      {step === 1 && (
        <form onSubmit={handleNextStep} className="space-y-5">
          <div className="space-y-1.5">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mb-2">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              What is your legal full name?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Your name establishes your primary medical profile. You will be able to add other family members once inside.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-xs font-bold text-slate-700">
              Full Legal Name *
            </Label>
            <Input
              id="fullName"
              ref={inputRef}
              type="text"
              required
              placeholder="e.g. Mayowa Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 rounded-xl text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={!fullName.trim()}
              className="h-11 px-6 rounded-xl font-bold gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Pop-Out Step 2: Date of Birth */}
      {step === 2 && (
        <form onSubmit={handleNextStep} className="space-y-5">
          <div className="space-y-1.5">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              When were you born?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              MedLab uses your birth date to calibrate clinical reference ranges and longitudinal analyte trends for your age group.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="text-xs font-bold text-slate-700">
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              ref={inputRef}
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="h-12 rounded-xl text-sm"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="h-11 px-4 rounded-xl font-semibold gap-1.5 text-slate-600"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <Button
              type="submit"
              className="h-11 px-6 rounded-xl font-bold gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
            >
              <span>{dateOfBirth ? "Continue" : "Skip for now"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Pop-Out Step 3: Clinical Health Notes */}
      {step === 3 && (
        <form onSubmit={handleNextStep} className="space-y-5">
          <div className="space-y-1.5">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mb-2">
              <FileHeart className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Any medical notes or allergies?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Optional emergency references like drug allergies, blood type, or chronic conditions.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-bold text-slate-700">
              Clinical Notes (Optional)
            </Label>
            <Input
              id="notes"
              ref={inputRef}
              type="text"
              placeholder="e.g. Allergies: Penicillin, Blood Type: O+, Mild Asthma"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-12 rounded-xl text-sm"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="h-11 px-4 rounded-xl font-semibold gap-1.5 text-slate-600"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <Button
              type="submit"
              className="h-11 px-6 rounded-xl font-bold gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
            >
              <span>{notes.trim() ? "Continue" : "Skip"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Pop-Out Step 4: Vault Name & Finish */}
      {step === 4 && (
        <form onSubmit={handleFinish} className="space-y-5">
          <div className="space-y-1.5">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mb-2">
              <Home className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Name your family vault
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              A private, encrypted repository for all household medical documents, test panels, and family member records.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspaceName" className="text-xs font-bold text-slate-700">
              Family Vault Name
            </Label>
            <Input
              id="workspaceName"
              ref={inputRef}
              type="text"
              placeholder={defaultVaultName}
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="h-12 rounded-xl text-sm"
              disabled={onboardingMutation.isPending}
            />
            <p className="text-[11px] text-slate-400">
              Leave blank to use default &ldquo;{defaultVaultName}&rdquo;.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={onboardingMutation.isPending}
              className="h-11 px-4 rounded-xl font-semibold gap-1.5 text-slate-600"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <Button
              type="submit"
              isLoading={onboardingMutation.isPending}
              className="h-11 px-6 rounded-xl font-bold gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
            >
              <span>Finish & Enter Vault</span>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs font-semibold">Loading profile setup...</p>
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
