"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { UploadWizard } from "@/features/uploads/upload-wizard";

function UploadContent() {
  const searchParams = useSearchParams();
  const initialMemberId = searchParams.get("memberId") || undefined;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link
        href="/app/records"
        className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-medium"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Medical Records</span>
      </Link>

      <UploadWizard initialMemberId={initialMemberId} />
    </div>
  );
}

export default function DocumentUploadPage() {
  return (
    <div>
      <Header
        title="Upload Medical Record"
        subtitle="Add a new test, report, or doctor summary to your family's vault."
      />
      <Suspense
        fallback={
          <div className="flex justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        }
      >
        <UploadContent />
      </Suspense>
    </div>
  );
}
