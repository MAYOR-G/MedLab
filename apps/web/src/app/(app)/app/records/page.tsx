"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { RecordCard } from "@/features/records/record-card";
import { DocumentFilterBar } from "@/features/records/document-filter-bar";
import { useDocuments } from "@/features/records/api";
import { useActiveMember } from "@/features/family/active-member-context";

export default function RecordsPage() {
  const { activeMemberId, selectedMember } = useActiveMember();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [memberFilter, setMemberFilter] = useState<string | null>(activeMemberId);

  const { data, isLoading } = useDocuments({
    memberId: memberFilter,
    category: category === "all" ? undefined : category,
    search: search || undefined,
  });

  const documents = data?.data || [];
  const totalCount = data?.meta?.totalCount || 0;

  const handleReset = () => {
    setSearch("");
    setCategory("all");
    setMemberFilter(activeMemberId);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Medical Records"
        subtitle={
          selectedMember
            ? `Encrypted records and lab reports for ${selectedMember.fullName}`
            : "End-to-end encrypted medical files, lab tests, and clinical notes."
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Filter bar */}
        <DocumentFilterBar
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          memberId={memberFilter}
          onMemberIdChange={setMemberFilter}
          onReset={handleReset}
        />

        {/* Pill-Shaped Records Stream */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-full border border-slate-200/80 bg-white animate-pulse"
              />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
            <FileText className="mx-auto h-11 w-11 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-900">
              {search || category !== "all" || memberFilter
                ? "No matching medical records found"
                : "No medical documents stored yet"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              {search || category !== "all" || memberFilter
                ? "Try clearing your filters or searching with a different test name."
                : "Upload diagnostic lab panels, doctor notes, or imaging scans to track biomarkers and generate plain-English summaries."}
            </p>
            {search || category !== "all" || memberFilter ? (
              <Button onClick={handleReset} variant="outline" className="mt-4 rounded-xl text-xs font-semibold" size="sm">
                Clear Filters
              </Button>
            ) : (
              <Link href="/app/records/upload" className="inline-block mt-4">
                <Button className="gap-2 rounded-xl text-xs font-semibold shadow-xs" size="sm">
                  <Plus className="h-4 w-4" />
                  <span>Upload First Document</span>
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Showing {documents.length} of {totalCount} records</span>
            </div>

            {/* Clean Pill-shaped row items */}
            <div className="space-y-3">
              {documents.map((doc) => (
                <RecordCard key={doc.id} document={doc} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
