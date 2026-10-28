"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Download,
  Edit,
  Trash2,
  Share2,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProcessingStatusBadge } from "@/features/records/processing-status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useDocument,
  useDeleteDocument,
  fetchDocumentDownloadUrl,
} from "@/features/records/api";
import { AISummaryCard } from "@/features/assistant/ai-summary-card";
import { useDocumentMeasurements } from "@/features/trends/api";
import { MeasurementTable } from "@/features/trends/measurement-table";
import { ShareModal } from "@/features/sharing/share-modal";
import { Activity } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  lab_result: "Diagnostic Lab Result",
  prescription: "Prescription & Medication",
  imaging: "Radiology / Imaging",
  clinical_report: "Clinical Note / Doctor Report",
  vaccination: "Vaccination & Immunization",
  discharge_summary: "Hospital Discharge Summary",
  other: "Medical Document",
};

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params?.recordId as string;

  const { data: document, isLoading, error } = useDocument(recordId);
  const { data: measurements = [] } = useDocumentMeasurements(recordId);
  const deleteMutation = useDeleteDocument();

  const [showDelete, setShowDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await fetchDocumentDownloadUrl(recordId);
      window.open(res.downloadUrl, "_blank");
    } catch (err) {
      console.error("Failed to download file:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(recordId);
    setShowDelete(false);
    router.push("/app/records");
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Medical Record" />
        <div className="p-6 max-w-5xl mx-auto space-y-4">
          <div className="h-64 rounded-card border border-border bg-surface animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div>
        <Header title="Document Not Found" />
        <div className="p-6 max-w-lg mx-auto text-center py-16">
          <AlertCircle className="mx-auto h-12 w-12 text-semantic-error-text mb-3" />
          <h2 className="text-base font-semibold text-text-primary">Medical Document Not Found</h2>
          <p className="text-xs text-text-secondary mt-1">
            This record may have been deleted or does not belong to your workspace.
          </p>
          <Link href="/app/records" className="inline-block mt-4">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Records</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = CATEGORY_LABELS[document.category] || document.category;

  return (
    <div>
      <Header
        title={document.title}
        subtitle={`${categoryName} for ${document.familyMemberName}`}
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/app/records"
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to all records</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Download Original</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShare(true)}
              className="gap-2 text-clinical-600 border-clinical-border hover:bg-clinical-50"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>

            <Link href={`/app/records/${recordId}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                <span>Edit Metadata</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-text-secondary hover:text-semantic-error-text"
              onClick={() => setShowDelete(true)}
              title="Delete record"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Hero Metadata Card */}
        <Card className="p-6 border-border shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <Badge variant="primary" className="text-xs">
                  {categoryName}
                </Badge>
                <ProcessingStatusBadge status={document.currentVersion?.isCurrent ? "succeeded" : "queued"} />
                {document.documentDate && (
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
                    <span>Tested {format(new Date(document.documentDate), "MMMM d, yyyy")}</span>
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-text-primary">
                {document.title}
              </h2>
            </div>

            <Link
              href={`/app/family/${document.familyMemberId}`}
              className="flex items-center gap-3 p-2.5 rounded-card bg-surface-subtle hover:bg-surface border border-border transition-colors"
            >
              <Avatar name={document.familyMemberName} size="md" />
              <div className="text-left">
                <div className="text-xs font-semibold text-text-primary">
                  {document.familyMemberName}
                </div>
                <div className="text-[10px] text-text-secondary">View Profile</div>
              </div>
            </Link>
          </div>

          {document.notes && (
            <div className="mt-5 pt-4 border-t border-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary block mb-1">
                Clinical Context & Notes
              </span>
              <p className="text-xs text-text-primary leading-relaxed bg-surface-subtle p-3 rounded-card border border-border">
                {document.notes}
              </p>
            </div>
          )}

          {/* Technical File Metadata */}
          {document.currentVersion && (
            <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center gap-6 text-xs text-text-secondary">
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase font-semibold">
                  Original File
                </span>
                <span className="font-medium text-text-primary">
                  {document.currentVersion.originalFilename}
                </span>
              </div>
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase font-semibold">
                  File Size
                </span>
                <span>{formatFileSize(document.currentVersion.fileSizeBytes)}</span>
              </div>
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase font-semibold">
                  SHA-256 Digest
                </span>
                <span className="font-mono text-[11px] text-text-secondary">
                  {document.currentVersion.sha256.substring(0, 16)}...
                </span>
              </div>
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase font-semibold">
                  Vault Storage
                </span>
                <span className="text-semantic-success-text font-medium flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Encrypted</span>
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Structured Medical Lab Measurements (Phase 7 Integration) */}
        {measurements && measurements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">
                  Extracted Lab Biomarkers ({measurements.length})
                </h3>
              </div>
              <Link
                href="/app/trends"
                className="text-xs text-primary hover:underline font-medium"
              >
                View Longitudinal Trends &rarr;
              </Link>
            </div>
            <MeasurementTable measurements={measurements} showDocumentLink={false} />
          </div>
        )}

        {/* AI Plain-English Health Analysis Banner (Phase 6 Integration) */}
        <AISummaryCard documentId={recordId} />
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Medical Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{document.title}&quot;? The file will be moved to
              recoverable trash, and all active share links will be immediately revoked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareModal
        open={showShare}
        onOpenChange={setShowShare}
        documentId={recordId}
        documentTitle={document.title}
      />
    </div>
  );
}
