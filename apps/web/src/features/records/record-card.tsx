"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  FileText,
  Calendar,
  Download,
  Trash2,
  ArrowRight,
  Loader2,
  Activity,
  Pill,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useDeleteDocument,
  fetchDocumentDownloadUrl,
  type DocumentData,
} from "@/features/records/api";
import { cn } from "@/lib/utils";

const CATEGORY_MAP: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  lab_result: {
    label: "Diagnostic Lab",
    icon: Activity,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  prescription: {
    label: "Prescription",
    icon: Pill,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  imaging: {
    label: "Radiology",
    icon: ImageIcon,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  clinical_report: {
    label: "Clinical Note",
    icon: FileText,
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
  vaccination: {
    label: "Vaccination",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  discharge_summary: {
    label: "Discharge",
    icon: FileText,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  other: {
    label: "Medical Doc",
    icon: FileText,
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
};

export function RecordCard({ document }: { document: DocumentData }) {
  const [showDelete, setShowDelete] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const deleteMutation = useDeleteDocument();
  const categoryConfig =
    CATEGORY_MAP[document.category] || {
      label: document.category,
      icon: FileText,
      color: "text-primary",
      bg: "bg-blue-50",
    };
  const Icon = categoryConfig.icon;

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsDownloading(true);
      const res = await fetchDocumentDownloadUrl(document.id);
      window.open(res.downloadUrl, "_blank");
    } catch (err) {
      console.error("Failed to download document:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(document.id);
    setShowDelete(false);
  };

  const formattedDate = document.documentDate
    ? format(new Date(document.documentDate), "MMM d, yyyy")
    : null;

  return (
    <>
      {/* Pill-Shaped Streamlined Row Item */}
      <div className="group rounded-2xl sm:rounded-full border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xs transition-all duration-200 p-3.5 sm:px-5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        {/* Left Side: Category Icon + Title + Member & Doctor details */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105",
              categoryConfig.bg,
              categoryConfig.color
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/app/records/${document.id}`}
                className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors truncate block"
              >
                {document.title}
              </Link>

              {/* Status Pill Badge */}
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ready</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 truncate flex-wrap">
              {document.familyMemberName && (
                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                  {document.familyMemberName}
                </span>
              )}
              {formattedDate && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <span>{formattedDate}</span>
                </span>
              )}
              {document.notes && (
                <span className="truncate max-w-[200px] text-[11px] text-slate-400 hidden lg:inline">
                  • {document.notes.split("•")[0].trim()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle/Right Side: Pill Tags & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60 uppercase tracking-wider">
              {categoryConfig.label}
            </span>
            {document.currentVersion && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-200/60 uppercase">
                {document.currentVersion.mimeType.includes("pdf") ? "PDF" : "IMG"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-slate-400 hover:text-primary hover:bg-blue-50"
              onClick={handleDownload}
              disabled={isDownloading}
              title="Download original file"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => setShowDelete(true)}
              title="Move to trash"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            <Link href={`/app/records/${document.id}`}>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full px-3 text-xs font-semibold text-primary border-blue-200 hover:bg-primary hover:text-white transition-all gap-1 ml-1"
              >
                <span>View Details</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Medical Record</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to remove &quot;{document.title}&quot;? The file will be moved to
              recoverable trash, and all active share links for this document will be immediately revoked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDelete(false)}
              disabled={deleteMutation.isPending}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
              className="rounded-xl"
            >
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
