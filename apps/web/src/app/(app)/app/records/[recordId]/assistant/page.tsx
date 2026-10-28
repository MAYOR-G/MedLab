"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Sparkles, FileText } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatInterface } from "@/features/assistant/chat-interface";
import { useDocument } from "@/features/records/api";

export default function DocumentAssistantPage() {
  const params = useParams();
  const recordId = params?.recordId as string;
  const { data: document, isLoading } = useDocument(recordId);

  return (
    <div>
      <Header
        title={document ? `Ask AI: ${document.title}` : "Record Assistant"}
        subtitle="Ask questions grounded strictly in this medical record"
      />

      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href={`/app/records/${recordId}`}
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to record</span>
          </Link>

          {document && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1">
                <FileText className="h-3 w-3 text-text-tertiary" />
                <span>{document.familyMemberName}</span>
              </Badge>
            </div>
          )}
        </div>

        <ChatInterface
          documentId={recordId}
          contextTitle={document ? `Consulting: ${document.title}` : "Medical Document Assistant"}
          placeholder="Ask a question about this specific lab result or document..."
          suggestedPrompts={[
            "What do these test results indicate?",
            "Are there any abnormal values or flags in this report?",
            "What questions should I ask my doctor about these findings?",
          ]}
        />
      </div>
    </div>
  );
}
