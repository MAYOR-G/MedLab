"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Sparkles, User } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { ChatInterface } from "@/features/assistant/chat-interface";
import { useFamilyMember } from "@/features/family/api";

export default function MemberAssistantPage() {
  const params = useParams();
  const memberId = params?.memberId as string;
  const { data: member, isLoading } = useFamilyMember(memberId);

  return (
    <div>
      <Header
        title={member ? `Health Assistant: ${member.fullName}` : "Family Member Assistant"}
        subtitle="Ask questions synthesized across this member's medical history"
      />

      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href={`/app/family/${memberId}`}
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to member profile</span>
          </Link>

          {member && (
            <Badge variant="outline" className="text-xs gap-1.5">
              <User className="h-3 w-3 text-text-tertiary" />
              <span>{member.relationship}</span>
            </Badge>
          )}
        </div>

        <ChatInterface
          familyMemberId={memberId}
          contextTitle={member ? `Medical History: ${member.fullName}` : "Member Health Assistant"}
          placeholder={`Ask about ${member ? member.fullName + "'s" : "this member's"} recent lab trends or records...`}
          suggestedPrompts={[
            `Summarize ${member ? member.fullName + "'s" : "this member's"} recent lab test history`,
            "Are there any recurring abnormal biomarkers across past records?",
            "What follow-up discussions are recommended for the next doctor visit?",
          ]}
        />
      </div>
    </div>
  );
}
