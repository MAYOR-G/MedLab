import React from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisclaimerBannerProps {
  className?: string;
  variant?: "ai" | "caution";
}

export function DisclaimerBanner({ className, variant = "ai" }: DisclaimerBannerProps) {
  if (variant === "caution") {
    return (
      <div
        className={cn(
          "rounded-card border border-semantic-warning-border bg-semantic-warning-bg p-3.5 flex items-start gap-3 text-xs text-semantic-warning-text leading-relaxed",
          className
        )}
      >
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
        <div>
          <span className="font-semibold text-amber-900">Clinical Precaution:</span> If you are experiencing chest pain, difficulty breathing, or acute physical distress, do not rely on digital summaries. Please seek immediate medical attention or call emergency services.
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-card border border-ai-border bg-ai-bg/70 p-3.5 flex items-start gap-3 text-xs text-text-primary leading-relaxed shadow-2xs",
        className
      )}
    >
      <Sparkles className="h-4 w-4 text-ai-label shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-ai-label">Educational Medical Guidance:</span> AI summaries translate technical laboratory terminology into plain English. They do not constitute a confirmed clinical diagnosis or recommendation to alter prescribed medications. Always discuss your laboratory results directly with your physician.
      </div>
    </div>
  );
}
