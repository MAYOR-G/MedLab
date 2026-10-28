"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected errors securely without sensitive PHI
    console.error("Application error boundary triggered:", error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-clinical-50/50 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-clinical-border bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-5 border border-red-100">
          <AlertCircle className="h-7 w-7" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-clinical-navy mb-2">
          An Unexpected Error Occurred
        </h1>

        <p className="text-sm text-clinical-slate mb-6 leading-relaxed">
          We encountered an issue loading this section. Your medical documents, private keys, and health data remain safe, encrypted, and isolated.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-clinical-600 hover:bg-clinical-700 text-white gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Link href="/app" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-clinical-border text-clinical-navy hover:bg-clinical-50 gap-2"
            >
              <Home className="h-4 w-4" />
              <span>Vault Home</span>
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-5 border-t border-clinical-border flex items-center justify-center gap-2 text-xs text-clinical-slate">
          <ShieldCheck className="h-4 w-4 text-clinical-600" />
          <span>MedLab Security & Encryption Guarantee</span>
        </div>
      </div>
    </div>
  );
}
