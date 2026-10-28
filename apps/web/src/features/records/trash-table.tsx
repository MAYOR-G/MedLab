"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useTrashDocuments,
  useRestoreDocument,
  usePermanentDeleteDocument,
  type DocumentData,
} from "./api";

const CATEGORY_LABELS: Record<string, string> = {
  lab_result: "Diagnostic Lab",
  prescription: "Prescription",
  imaging: "Radiology",
  clinical_report: "Doctor Report",
  vaccination: "Vaccination",
  discharge_summary: "Discharge Summary",
  other: "Medical Doc",
};

export function TrashTable() {
  const { data: documents = [], isLoading } = useTrashDocuments();
  const restoreMutation = useRestoreDocument();
  const permanentDeleteMutation = usePermanentDeleteDocument();

  const [docToPurge, setDocToPurge] = useState<DocumentData | null>(null);

  const handleRestore = async (docId: string) => {
    try {
      await restoreMutation.mutateAsync(docId);
    } catch (err) {
      console.error("Failed to restore document:", err);
    }
  };

  const handlePermanentDelete = async () => {
    if (!docToPurge) return;
    try {
      await permanentDeleteMutation.mutateAsync(docToPurge.id);
      setDocToPurge(null);
    } catch (err) {
      console.error("Failed to permanently delete document:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs animate-pulse">
        <div className="mx-auto h-8 w-8 rounded-full bg-slate-100 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading recoverable trash...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-3">
          <Trash2 className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Recoverable Trash is Empty
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
          When you delete medical documents or reports, they are preserved here for 30 days before being permanently purged.
        </p>
        <Link href="/app/records">
          <Button variant="outline" size="sm" className="font-semibold text-slate-700">
            View Active Records
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 pl-6">Document</th>
                <th className="py-3 px-4">Member & Category</th>
                <th className="py-3 px-4">Deleted When</th>
                <th className="py-3 px-4">Retention Window</th>
                <th className="py-3 px-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const categoryLabel = CATEGORY_LABELS[doc.category] || doc.category;
                const daysRemaining = doc.purgeAfter
                  ? Math.max(0, differenceInDays(new Date(doc.purgeAfter), new Date()))
                  : 30;

                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-100">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate max-w-xs">
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {doc.currentVersion?.originalFilename || "Medical file"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">
                          {doc.familyMemberName}
                        </p>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] mt-0.5">
                          {categoryLabel}
                        </Badge>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {doc.deletedAt ? (
                        <>
                          <p className="font-semibold text-slate-800">
                            {format(new Date(doc.deletedAt), "MMM d, yyyy")}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(doc.deletedAt), { addSuffix: true })}
                          </p>
                        </>
                      ) : (
                        "Recently deleted"
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <span>{daysRemaining} {daysRemaining === 1 ? "day" : "days"} left</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(doc.id)}
                          disabled={restoreMutation.isPending}
                          className="h-7 px-2.5 gap-1.5 text-xs text-primary border-slate-200 hover:bg-blue-50 font-semibold"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Restore</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDocToPurge(doc)}
                          disabled={permanentDeleteMutation.isPending}
                          className="h-7 px-2 gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permanent Deletion Confirmation Modal */}
      <Dialog open={!!docToPurge} onOpenChange={(open) => !open && setDocToPurge(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base text-slate-900">
                  Permanently Delete Medical Document?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  This action cannot be undone. All clinical extractions and files will be erased forever.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {docToPurge && (
            <div className="my-2 rounded-xl border border-red-200 bg-red-50/60 p-3 text-xs text-red-900">
              <p className="font-bold text-slate-900">{docToPurge.title}</p>
              <p className="text-slate-500 mt-0.5">
                Owner: {docToPurge.familyMemberName} • {docToPurge.currentVersion?.originalFilename}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDocToPurge(null)}
              disabled={permanentDeleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handlePermanentDelete}
              disabled={permanentDeleteMutation.isPending}
              className="gap-1.5"
            >
              {permanentDeleteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Erase Permanently</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
