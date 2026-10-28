"use client";

import React from "react";
import { useParams } from "next/navigation";
import { format, formatDistanceToNow, isPast } from "date-fns";
import {
  FileText,
  Download,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Calendar,
  Lock,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/feedback/disclaimer-banner";
import { usePublicShare } from "@/features/sharing/api";

const CATEGORY_LABELS: Record<string, string> = {
  lab_result: "Diagnostic Lab Result",
  prescription: "Prescription & Medication",
  imaging: "Radiology / Imaging",
  clinical_report: "Clinical Note / Doctor Report",
  vaccination: "Vaccination & Immunization",
  discharge_summary: "Hospital Discharge Summary",
  other: "Medical Document",
};

export default function PublicSharePage() {
  const params = useParams();
  const token = params?.token as string;

  const { data: document, isLoading, error } = usePublicShare(token);

  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-clinical-100 rounded-lg" />
        <div className="h-44 bg-white rounded-xl border border-clinical-border" />
        <div className="h-64 bg-white rounded-xl border border-clinical-border" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-xl mx-auto my-12 rounded-xl border border-red-200 bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4 border border-red-100">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-clinical-navy mb-2">
          Share Link Expired or Unavailable
        </h2>
        <p className="text-sm text-clinical-slate mb-6 leading-relaxed">
          This secure medical share link has expired, was revoked by the patient, or is invalid. To access this medical record, please contact the patient or sender to request an updated access link.
        </p>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-clinical-slate bg-clinical-50 px-3 py-1.5 rounded-md border border-clinical-border">
          <Lock className="h-3.5 w-3.5 text-clinical-600" />
          <span>Cryptographic Token Security Enforced</span>
        </div>
      </div>
    );
  }

  const categoryName = CATEGORY_LABELS[document.category] || document.category;
  const isLinkExpired = isPast(new Date(document.expiresAt));

  if (isLinkExpired) {
    return (
      <div className="max-w-xl mx-auto my-12 rounded-xl border border-amber-200 bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-4 border border-amber-100">
          <Clock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-clinical-navy mb-2">
          Access Window Expired
        </h2>
        <p className="text-sm text-clinical-slate mb-6 leading-relaxed">
          The time limit for this medical share expired on{" "}
          <span className="font-semibold text-clinical-navy">
            {format(new Date(document.expiresAt), "MMMM d, yyyy 'at' h:mm a")}
          </span>
          . Please ask the document owner to generate a new share link.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Mandatory Non-Diagnostic Medical Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Document Card */}
      <div className="rounded-xl border border-clinical-border bg-white shadow-card overflow-hidden">
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline" className="bg-clinical-50 text-clinical-700 border-clinical-200 text-xs px-2.5 py-1">
              {categoryName}
            </Badge>

            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Clock className="h-3.5 w-3.5" />
              <span>Expires in {formatDistanceToNow(new Date(document.expiresAt))}</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-clinical-navy">
            {document.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-clinical-slate pt-1 border-t border-clinical-border/50">
            {document.documentDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-clinical-600" />
                <span>Document Date: {format(new Date(document.documentDate), "MMMM d, yyyy")}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-clinical-600" />
              <span>Verified Share from MedLab Vault</span>
            </div>
          </div>

          {document.notes && (
            <div className="mt-4 rounded-lg bg-clinical-50/70 p-4 border border-clinical-border text-sm text-clinical-slate">
              <p className="font-medium text-clinical-navy text-xs uppercase tracking-wider mb-1">
                Patient Notes
              </p>
              <p className="whitespace-pre-wrap">{document.notes}</p>
            </div>
          )}
        </div>

        {/* Original File Download Block */}
        {document.includeOriginal && (
          <div className="border-t border-clinical-border bg-clinical-50/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-clinical-600 text-white shadow-xs">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-clinical-navy">
                  {document.originalFilename || "Original Medical Record File"}
                </p>
                <p className="text-xs text-clinical-slate">
                  {formatFileSize(document.fileSizeBytes)} • Direct download available
                </p>
              </div>
            </div>

            {document.downloadUrl ? (
              <a
                href={document.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button className="w-full sm:w-auto bg-clinical-600 hover:bg-clinical-700 text-white gap-2 shadow-xs">
                  <Download className="h-4 w-4" />
                  <span>Download Original Document</span>
                </Button>
              </a>
            ) : (
              <Button disabled variant="outline" size="sm">
                Download Unavailable
              </Button>
            )}
          </div>
        )}
      </div>

      {/* AI Plain-English Summary Block */}
      {document.includeSummary && document.summary && (
        <div className="rounded-xl border border-clinical-border bg-white shadow-card overflow-hidden">
          <div className="p-6 border-b border-clinical-border bg-clinical-50/30">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-clinical-navy">
                  Plain-English AI Medical Explanation
                </h2>
                <p className="text-xs text-clinical-slate">
                  Synthesized for physician review and patient clarity
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="prose prose-sm max-w-none text-clinical-navy leading-relaxed whitespace-pre-wrap">
              {document.summary.summaryText}
            </div>

            {/* Citations section */}
            {document.summary.citations && document.summary.citations.length > 0 && (
              <div className="pt-4 border-t border-clinical-border space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-clinical-slate flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-clinical-600" />
                  Medical References & Citations
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {document.summary.citations.map((c, i) => {
                    const cit = c as { title?: string; source?: string; url?: string };
                    return (
                      <div
                        key={i}
                        className="rounded-lg border border-clinical-border bg-clinical-50/50 p-3 text-xs"
                      >
                        <p className="font-medium text-clinical-navy line-clamp-1">
                          {cit.title || "Clinical Reference"}
                        </p>
                        {cit.source && (
                          <p className="text-clinical-slate text-[11px] mt-0.5">
                            Source: {cit.source}
                          </p>
                        )}
                        {cit.url && (
                          <a
                            href={cit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-clinical-600 hover:text-clinical-700 hover:underline mt-1.5 font-medium"
                          >
                            <span>View Source</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
