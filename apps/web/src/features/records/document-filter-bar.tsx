"use client";

import React from "react";
import Link from "next/link";
import { Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useActiveMember } from "@/features/family/active-member-context";

interface DocumentFilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  memberId: string | null;
  onMemberIdChange: (memberId: string | null) => void;
  onReset: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "lab_result", label: "Lab Results" },
  { value: "prescription", label: "Prescriptions" },
  { value: "imaging", label: "Imaging & Radiology" },
  { value: "clinical_report", label: "Doctor Notes" },
  { value: "vaccination", label: "Vaccinations" },
  { value: "discharge_summary", label: "Discharge Summaries" },
  { value: "other", label: "Other Documents" },
];

export function DocumentFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  memberId,
  onMemberIdChange,
  onReset,
}: DocumentFilterBarProps) {
  const { members } = useActiveMember();
  const hasActiveFilters = !!search || category !== "all" || memberId !== null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search records by title or notes..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10 rounded-xl border-slate-200/90 text-xs bg-white"
          />
        </div>

        {/* Member filter */}
        <select
          value={memberId || "all"}
          onChange={(e) => onMemberIdChange(e.target.value === "all" ? null : e.target.value)}
          className="h-10 rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]"
        >
          <option value="all">All Family Members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-10 rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-10 px-2.5 gap-1 text-xs text-slate-500 hover:text-slate-800"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      <Link href="/app/records/upload" className="w-full sm:w-auto">
        <Button size="sm" className="gap-2 font-semibold shadow-xs whitespace-nowrap w-full sm:w-auto h-10">
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </Button>
      </Link>
    </div>
  );
}
