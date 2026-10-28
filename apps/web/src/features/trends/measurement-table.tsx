"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { FileText, ArrowUpRight, ArrowDownRight, Check, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MeasurementData } from "./api";

interface MeasurementTableProps {
  measurements: MeasurementData[];
  showDocumentLink?: boolean;
}

export function MeasurementTable({
  measurements,
  showDocumentLink = true,
}: MeasurementTableProps) {
  if (measurements.length === 0) {
    return (
      <div className="text-center py-8 p-4 rounded-card border border-border bg-surface-subtle text-xs text-text-secondary">
        <Activity className="h-6 w-6 text-text-tertiary mx-auto mb-2" />
        <p className="font-medium text-text-primary">No structured measurements recorded</p>
        <p className="text-[11px] text-text-secondary mt-0.5">
          Measurements will appear here once medical lab documents are uploaded and processed.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-2xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-border bg-surface-subtle/80 text-[11px] text-text-secondary font-medium">
            <th className="py-3 px-4 font-semibold">Test / Biomarker</th>
            <th className="py-3 px-4 font-semibold">Observation Date</th>
            <th className="py-3 px-4 font-semibold">Value</th>
            <th className="py-3 px-4 font-semibold">Reference Range</th>
            <th className="py-3 px-4 font-semibold text-center">Status</th>
            {showDocumentLink && <th className="py-3 px-4 font-semibold text-right">Source</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {measurements.map((m) => {
            const hasNum = m.valueNumeric !== null && m.valueNumeric !== undefined;
            const displayVal = hasNum ? `${m.valueNumeric} ${m.unit || ""}` : m.valueText || "—";
            const dateStr = m.measuredOn
              ? format(new Date(m.measuredOn), "MMM d, yyyy")
              : format(new Date(m.createdAt), "MMM d, yyyy");

            const hasRef =
              m.referenceLow !== null &&
              m.referenceLow !== undefined &&
              m.referenceHigh !== null &&
              m.referenceHigh !== undefined;

            return (
              <tr key={m.id} className="hover:bg-surface-subtle/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-text-primary">{m.testName}</div>
                  {m.specimen && (
                    <span className="text-[10px] text-text-tertiary">Specimen: {m.specimen}</span>
                  )}
                </td>

                <td className="py-3 px-4 text-text-secondary whitespace-nowrap">{dateStr}</td>

                <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                  {displayVal}
                </td>

                <td className="py-3 px-4 text-text-secondary whitespace-nowrap font-mono text-[11px]">
                  {hasRef ? `${m.referenceLow} – ${m.referenceHigh} ${m.unit || ""}` : "Standard range"}
                </td>

                <td className="py-3 px-4 text-center whitespace-nowrap">
                  {m.flag ? (
                    <Badge
                      variant={
                        m.flag === "normal"
                          ? "success"
                          : m.flag === "high"
                          ? "destructive"
                          : "warning"
                      }
                      className="text-[10px] uppercase font-semibold gap-1 inline-flex items-center"
                    >
                      {m.flag === "high" && <ArrowUpRight className="h-3 w-3" />}
                      {m.flag === "low" && <ArrowDownRight className="h-3 w-3" />}
                      {m.flag === "normal" && <Check className="h-3 w-3" />}
                      <span>{m.flag}</span>
                    </Badge>
                  ) : (
                    <span className="text-text-tertiary text-[11px]">Recorded</span>
                  )}
                </td>

                {showDocumentLink && (
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <Link
                      href={`/app/records/${m.documentId}`}
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{m.documentTitle}</span>
                    </Link>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
