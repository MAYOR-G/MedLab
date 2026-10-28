"use client";

import React from "react";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ProcessingStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

interface ProcessingStatusBadgeProps {
  status: ProcessingStatus | string;
  className?: string;
}

export function ProcessingStatusBadge({ status, className }: ProcessingStatusBadgeProps) {
  switch (status) {
    case "running":
      return (
        <Badge variant="ai" className={`gap-1.5 text-[11px] animate-pulse ${className || ""}`}>
          <Loader2 className="h-3 w-3 animate-spin text-ai-label" />
          <span>Extracting Text...</span>
        </Badge>
      );
    case "queued":
      return (
        <Badge variant="default" className={`gap-1.5 text-[11px] ${className || ""}`}>
          <Clock className="h-3 w-3 text-text-tertiary" />
          <span>Extraction Queued</span>
        </Badge>
      );
    case "succeeded":
      return (
        <Badge variant="success" className={`gap-1.5 text-[11px] ${className || ""}`}>
          <CheckCircle2 className="h-3 w-3 text-semantic-success-text" />
          <span>Extracted & Ready</span>
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className={`gap-1.5 text-[11px] ${className || ""}`}>
          <AlertCircle className="h-3 w-3 text-semantic-error-text" />
          <span>Extraction Failed</span>
        </Badge>
      );
    default:
      return null;
  }
}
