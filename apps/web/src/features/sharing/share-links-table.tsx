"use client";

import React from "react";
import Link from "next/link";
import { formatDistanceToNow, isPast } from "date-fns";
import {
  Share2,
  FileText,
  Sparkles,
  Clock,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useWorkspaceShares,
  useRevokeShareLink,
  type ShareLinkItem,
} from "./api";

interface ShareLinksTableProps {
  shares?: ShareLinkItem[];
  isLoading?: boolean;
}

export function ShareLinksTable({
  shares: propShares,
  isLoading: propLoading,
}: ShareLinksTableProps) {
  const { data: queryShares, isLoading: queryLoading } = useWorkspaceShares();
  const revokeMutation = useRevokeShareLink();

  const shares = propShares !== undefined ? propShares : queryShares;
  const isLoading = propLoading !== undefined ? propLoading : queryLoading;

  const handleRevoke = async (shareId: string) => {
    if (confirm("Are you sure you want to immediately revoke access to this share link?")) {
      await revokeMutation.mutateAsync(shareId);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs animate-pulse">
        <div className="mx-auto h-8 w-8 rounded-full bg-slate-100 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading secure share links...</p>
      </div>
    );
  }

  if (!shares || shares.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary mb-3">
          <Share2 className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          No Active Share Links
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
          When you generate a secure share link for a physician or specialist, its active security status, permissions, and expiration timer will appear here.
        </p>
        <Link href="/app/records">
          <Button variant="outline" size="sm" className="font-semibold text-slate-700">
            Browse Records
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4 pl-6">Document</th>
              <th className="py-3 px-4">Shared Inclusions</th>
              <th className="py-3 px-4">Status & Expiration</th>
              <th className="py-3 px-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shares.map((share) => {
              const expired = share.isExpired || isPast(new Date(share.expiresAt));
              const isRevoked = share.isRevoked;
              const isActive = !expired && !isRevoked;

              return (
                <tr
                  key={share.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-3.5 px-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/app/records/${share.documentId}`}
                          className="font-bold text-slate-900 hover:text-primary transition-colors hover:underline truncate block max-w-xs"
                        >
                          {share.documentTitle || "Medical Document"}
                        </Link>
                        <p className="text-[11px] text-slate-400">
                          Created {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {share.includeOriginal && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200/70">
                          <FileText className="h-3 w-3" />
                          File
                        </span>
                      )}
                      {share.includeSummary && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-primary border border-blue-200/70">
                          <Sparkles className="h-3 w-3" />
                          AI Summary
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      {isRevoked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <Ban className="h-3 w-3" />
                          Revoked
                        </span>
                      ) : expired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="h-3 w-3" />
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      )}

                      <span className="text-[11px] text-slate-500">
                        {isRevoked
                          ? "Access revoked"
                          : expired
                          ? "Link expired"
                          : `Expires in ${formatDistanceToNow(new Date(share.expiresAt))}`}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(share.id)}
                          disabled={revokeMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2.5 text-xs font-semibold"
                          title="Revoke Link Access"
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Revoke
                        </Button>
                      )}
                      {!isActive && (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
