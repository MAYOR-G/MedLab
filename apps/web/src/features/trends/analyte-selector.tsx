"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AnalyteOption } from "./api";

interface AnalyteSelectorProps {
  analytes: AnalyteOption[];
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
}

export function AnalyteSelector({
  analytes,
  selectedKey,
  onSelectKey,
}: AnalyteSelectorProps) {
  if (analytes.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
      {analytes.map((item) => {
        const isSelected = selectedKey === item.normalizedTestKey;

        return (
          <button
            key={item.normalizedTestKey}
            type="button"
            onClick={() => onSelectKey(item.normalizedTestKey)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-card text-xs font-medium border transition-all text-left whitespace-nowrap shrink-0",
              isSelected
                ? "bg-primary text-white border-primary shadow-xs"
                : "bg-surface hover:bg-surface-subtle text-text-primary border-border"
            )}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{item.displayName}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                    isSelected ? "bg-white/20 text-white" : "bg-surface-subtle text-text-secondary"
                  )}
                >
                  {item.count}
                </span>
              </div>
              {item.latestValue !== null && item.latestValue !== undefined && (
                <div
                  className={cn(
                    "text-[10px] mt-0.5",
                    isSelected ? "text-white/80" : "text-text-secondary"
                  )}
                >
                  Latest: {item.latestValue} {item.latestUnit}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
