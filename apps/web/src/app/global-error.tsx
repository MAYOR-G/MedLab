"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected critical error with sanitized telemetry
    console.error("Global critical application error:", error.message);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen flex items-center justify-center p-6 text-slate-900 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-5">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Critical Application Encounter
          </h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            MedLab encountered an unexpected system error. Your personal health records
            remain securely encrypted in storage.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Link href="/" className="w-full">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                Return to Safe Home
              </Button>
            </Link>
          </div>

          {error.digest && (
            <p className="mt-6 text-xs text-slate-400 font-mono">
              Reference Code: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
