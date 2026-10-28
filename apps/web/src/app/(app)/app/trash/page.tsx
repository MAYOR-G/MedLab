"use client";

import React from "react";
import Link from "next/link";
import {
  Trash2,
  ShieldAlert,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { TrashTable } from "@/features/records/trash-table";

export default function TrashPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Recoverable Trash"
        subtitle="Review, restore, or permanently purge medical documents within your 30-day retention window."
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Trash Bin Contents
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Items remain restorable for 30 days before being irreversibly shredded.
            </p>
          </div>
          <Link href="/app/records">
            <Button variant="outline" size="sm" className="font-semibold text-slate-700 gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Active Records</span>
            </Button>
          </Link>
        </div>

        {/* Retention Policy Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  30-Day Retention & Immediate Share Revocation
                </h3>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  When a document is moved to trash, all active external share links are revoked immediately. Restoring a document recovers its clinical extractions and trends, but past share links remain safely revoked.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-xl shrink-0">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Auto-Purge after 30 days</span>
            </div>
          </div>
        </div>

        {/* Trash Content Table */}
        <section className="space-y-3">
          <TrashTable />
        </section>
      </main>
    </div>
  );
}
