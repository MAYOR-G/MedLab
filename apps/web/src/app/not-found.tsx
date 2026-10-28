import React from "react";
import Link from "next/link";
import { FileQuestion, Home, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-clinical-50/50 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-clinical-border bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-clinical-50 text-clinical-600 mb-5 border border-clinical-100">
          <FileQuestion className="h-7 w-7" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-clinical-navy mb-2">
          Page or Record Not Found
        </h1>

        <p className="text-sm text-clinical-slate mb-6 leading-relaxed">
          The requested medical page, report, or link does not exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/app" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-clinical-600 hover:bg-clinical-700 text-white gap-2">
              <Home className="h-4 w-4" />
              <span>Vault Home</span>
            </Button>
          </Link>

          <Link href="/app/records" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-clinical-border text-clinical-navy hover:bg-clinical-50 gap-2"
            >
              <FileText className="h-4 w-4" />
              <span>All Records</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
