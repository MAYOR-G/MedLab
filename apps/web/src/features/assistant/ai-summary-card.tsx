"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Sparkles,
  ExternalLink,
  BookOpen,
  HelpCircle,
  FileCheck2,
  RefreshCw,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/feedback/disclaimer-banner";
import {
  useDocumentSummaries,
  useRequestDocumentSummary,
  type AISummaryData,
} from "@/features/assistant/api";

interface AISummaryCardProps {
  documentId: string;
}

export function AISummaryCard({ documentId }: AISummaryCardProps) {
  const { data: summaries = [], isLoading } = useDocumentSummaries(documentId);
  const generateMutation = useRequestDocumentSummary(documentId);

  const activeSummary: AISummaryData | null = summaries.length > 0 ? summaries[0] : null;

  const handleGenerate = async () => {
    await generateMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <Card className="border-ai-border bg-surface animate-pulse p-6">
        <div className="h-40 rounded-card bg-surface-subtle" />
      </Card>
    );
  }

  if (!activeSummary) {
    return (
      <Card className="border-ai-border bg-gradient-to-b from-ai-bg/60 to-surface shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="ai" className="gap-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Health Explanation</span>
            </Badge>
          </div>
          <CardTitle className="text-lg mt-2">Translate Into Plain English</CardTitle>
          <CardDescription className="text-xs">
            Demystify medical abbreviations, explain reference ranges, and generate focused questions for your doctor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-text-secondary leading-relaxed bg-surface p-4 rounded-card border border-border">
            Ready to analyze this record. Our medical translation model will review extracted markers and generate a plain-English explanation grounded strictly in this document.
          </p>
        </CardContent>
        <CardFooter className="pt-0">
          <Button
            onClick={handleGenerate}
            isLoading={generateMutation.isPending}
            className="gap-2 text-xs shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-white" />
            <span>Generate Plain-English Explanation</span>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const citations = (activeSummary.citations || []) as Array<{
    title?: string;
    source?: string;
    url?: string;
  }>;

  return (
    <Card className="border-ai-border bg-gradient-to-b from-ai-bg/40 to-surface shadow-xs">
      <CardHeader className="pb-4 border-b border-ai-border/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="ai" className="gap-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-Generated Medical Explanation</span>
            </Badge>
            <span className="text-[11px] text-text-tertiary">
              Generated {format(new Date(activeSummary.createdAt), "MMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/app/records/${documentId}/assistant`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span>Ask AI About This Record</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              isLoading={generateMutation.isPending}
              className="h-8 text-xs text-text-secondary hover:text-text-primary gap-1"
              title="Regenerate summary"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Re-analyze</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* Rendered Summary Sections */}
        <div className="prose prose-sm max-w-none text-text-primary text-xs leading-relaxed space-y-3 whitespace-pre-wrap bg-surface p-5 rounded-card border border-border/80 shadow-2xs">
          {activeSummary.summaryText}
        </div>

        {/* Trusted Medical Reference Citations */}
        {citations.length > 0 && (
          <div className="rounded-card border border-border bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Authoritative Clinical References</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {citations.map((cite, idx: number) => (
                <a
                  key={idx}
                  href={cite.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-button border border-border hover:border-primary/50 hover:bg-surface-subtle transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-medium text-text-primary group-hover:text-primary truncate">
                      {cite.title || "Clinical Source"}
                    </div>
                    <div className="text-[10px] text-text-secondary truncate">{cite.source || "Medical Guideline"}</div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-text-tertiary group-hover:text-primary shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Disclaimer */}
        <DisclaimerBanner />
      </CardContent>
    </Card>
  );
}
