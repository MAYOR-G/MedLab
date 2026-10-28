"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  Share2,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  ChevronRight,
  Upload,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveMember } from "@/features/family/active-member-context";
import { useWorkspace } from "@/features/users/api";
import { useDocuments } from "@/features/records/api";
import { useWorkspaceShares } from "@/features/sharing/api";
import { useMemberAnalytes } from "@/features/trends/api";

export default function DashboardPage() {
  const { data: workspace } = useWorkspace();
  const { activeMemberId, selectedMember } = useActiveMember();
  const { data: docsData, isLoading: docsLoading } = useDocuments({ memberId: activeMemberId });
  const { data: shareLinks = [] } = useWorkspaceShares();
  const { data: analytes = [] } = useMemberAnalytes(activeMemberId);

  const documents = docsData?.data || [];
  const activeShares = shareLinks.filter((s) => !s.isRevoked);
  const aiExplanationCount = documents.filter((d) => d.currentVersion?.isCurrent).length;

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const activeName = selectedMember
    ? selectedMember.fullName.split(" ")[0]
    : "Profile";

  return (
    <div className="min-h-screen">
      <Header
        title="Health Overview"
        subtitle={
          selectedMember
            ? `Active records & trends for ${selectedMember.fullName}`
            : workspace?.name
            ? `${workspace.name} — Encrypted Vault`
            : undefined
        }
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Minimalist Welcome & Primary Action Header */}
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <span>{todayFormatted}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Zero-Knowledge Encrypted
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {getGreeting()}, {activeName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              {selectedMember
                ? `Viewing authorized health records, lab panels, and biomarker trends for ${selectedMember.fullName}.`
                : "Review your individual medical documents, AI summaries, and longitudinal biomarker curves."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/app/records?action=upload">
              <Button size="sm" className="font-semibold gap-1.5 shadow-xs rounded-xl">
                <Plus className="h-4 w-4" />
                <span>Upload Record</span>
              </Button>
            </Link>
            <Link href="/app/trends">
              <Button size="sm" variant="outline" className="font-medium gap-1.5 text-slate-700 rounded-xl">
                <Activity className="h-3.5 w-3.5 text-slate-500" />
                <span>Trends</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* 3 Minimalist Clean Stat Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Medical Records
              </span>
              <div className="h-7 w-7 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
                <FileText className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {documents.length}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Stored files
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                AI Analyses
              </span>
              <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {aiExplanationCount}
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                Plain English
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Biomarkers Tracked
              </span>
              <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {analytes.length}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Active indicators
              </span>
            </div>
          </div>
        </section>

        {/* Fast-Track Biomarkers Strip (Dynamic Real Data) */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Biomarker Health Fast-Track
              </h3>
            </div>
            <Link
              href="/app/trends"
              className="text-xs font-semibold text-primary hover:text-blue-800 flex items-center gap-1 group"
            >
              <span>View Longitudinal Trends</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {analytes.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
              <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No laboratory biomarkers extracted yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                Upload a diagnostic metabolic panel or lipid report to automatically plot glucose, cholesterol, and vital indicators.
              </p>
              <Link href="/app/records/upload" className="inline-block mt-3">
                <Button size="sm" variant="outline" className="h-8 text-xs font-semibold gap-1.5 rounded-full">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Lab Report</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {analytes.slice(0, 4).map((a) => (
                <div key={a.normalizedTestKey} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60">
                  <div className="text-[11px] font-semibold text-slate-500 truncate">{a.displayName}</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-slate-900">
                      {a.latestValue ?? "—"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {a.latestUnit || ""}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                        a.latestFlag === "high" || a.latestFlag === "low"
                          ? "text-amber-700 bg-amber-50"
                          : "text-emerald-700 bg-emerald-50"
                      }`}
                    >
                      {a.latestFlag ? a.latestFlag.toUpperCase() : "NORMAL"}
                    </span>
                    <span className="text-[10px] text-slate-400">{a.latestMeasuredOn || "Recent"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Medical Documents (Spacious, Clean Full-Width Section) */}
        <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recent Medical Documents
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedMember
                  ? `Records for ${selectedMember.fullName}`
                  : "Latest files uploaded to vault"}
              </p>
            </div>
            <Link
              href="/app/records"
              className="text-xs font-semibold text-primary hover:text-blue-800 flex items-center gap-1 group"
            >
              <span>View All Records</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="mx-auto h-9 w-9 text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-900">No medical records on file</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Upload lab panels, hospital discharge summaries, or imaging reports.
              </p>
              <Link href="/app/records?action=upload" className="inline-block mt-4">
                <Button size="sm" className="gap-1.5 font-semibold rounded-xl">
                  <Plus className="h-4 w-4" />
                  <span>Upload First Document</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.slice(0, 4).map((doc) => (
                <Link
                  key={doc.id}
                  href={`/app/records/${doc.id}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                        {doc.title}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-semibold text-slate-700">
                          {doc.familyMemberName || "Profile"}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-xs text-slate-400">
                          {doc.notes ? doc.notes.split("•")[0].trim() : "Diagnostic Lab"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline-flex rounded-full"
                    >
                      {doc.category.replace("_", " ")}
                    </Badge>

                    <span className="text-xs font-medium text-slate-400">
                      {doc.documentDate || "Recent"}
                    </span>

                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Minimalist Active Share Link Banner */}
        {activeShares.length > 0 && (
          <section className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Share2 className="h-4 w-4 text-purple-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-900">
                  {activeShares.length} Active Share Link{activeShares.length > 1 ? "s" : ""}
                </span>
                <span className="text-slate-500 ml-1.5 hidden sm:inline">
                  • Time-limited physician access enabled with instant revocation.
                </span>
              </div>
            </div>
            <Link
              href="/app/shares"
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 group shrink-0"
            >
              <span>Manage Shared Links</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
