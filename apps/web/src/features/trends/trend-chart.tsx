"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, TrendingUp, FileText, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MeasurementTrendSeries, MeasurementTrendPoint } from "./api";

interface TrendChartProps {
  series: MeasurementTrendSeries;
  height?: number;
}

export function TrendChart({ series, height = 280 }: TrendChartProps) {
  const [activePoint, setActivePoint] = useState<MeasurementTrendPoint | null>(null);

  const points = series.points || [];
  const numericPoints = points.filter((p) => p.value !== null && p.value !== undefined);

  if (numericPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-card border border-border bg-surface-subtle text-center text-text-secondary">
        <TrendingUp className="h-8 w-8 text-text-tertiary mb-2" />
        <p className="text-xs font-medium text-text-primary">No numeric trend data available</p>
        <p className="text-[11px] text-text-secondary mt-1">
          Measurements for {series.displayName} were recorded with text qualifiers only.
        </p>
      </div>
    );
  }

  // Calculate chart boundaries
  const values = numericPoints.map((p) => p.value as number);
  const refLows = numericPoints.map((p) => p.referenceLow).filter((v): v is number => v !== null && v !== undefined);
  const refHighs = numericPoints.map((p) => p.referenceHigh).filter((v): v is number => v !== null && v !== undefined);

  const allBoundValues = [...values, ...refLows, ...refHighs];
  const minVal = Math.min(...allBoundValues);
  const maxVal = Math.max(...allBoundValues);

  // Buffer margins
  const buffer = (maxVal - minVal) * 0.15 || 5;
  const yMin = Math.max(0, minVal - buffer);
  const yMax = maxVal + buffer;

  const width = 650;
  const padding = { top: 25, right: 35, bottom: 40, left: 45 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const getX = (idx: number) => {
    if (numericPoints.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (idx / (numericPoints.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - ((val - yMin) / (yMax - yMin)) * innerHeight;
  };

  // Reference range band bounds
  const avgRefLow = refLows.length > 0 ? refLows[refLows.length - 1] : null;
  const avgRefHigh = refHighs.length > 0 ? refHighs[refHighs.length - 1] : null;

  // Path coordinates
  const pathD = numericPoints
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx)} ${getY(p.value as number)}`)
    .join(" ");

  return (
    <div className="space-y-3">
      {/* Non-comparable unit banner if detected */}
      {!series.isComparable && (
        <div className="flex items-start gap-2.5 p-3 rounded-card bg-semantic-warning-bg border border-semantic-warning-border text-semantic-warning-text text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Inconsistent measurement units</span>
            <span>
              Values for this biomarker were reported across different laboratory units (e.g. mg/dL vs mmol/L). Numerical trend curve may not be directly comparable.
            </span>
          </div>
        </div>
      )}

      {/* SVG Canvas Container */}
      <div className="relative w-full rounded-card border border-border bg-surface p-4 shadow-2xs">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Reference range shaded background band */}
          {avgRefLow !== null && avgRefHigh !== null && (
            <rect
              x={padding.left}
              y={getY(avgRefHigh)}
              width={innerWidth}
              height={Math.max(2, getY(avgRefLow) - getY(avgRefHigh))}
              fill="#EBF3FB"
              opacity={0.7}
              rx={4}
            />
          )}

          {/* Reference limit dashed lines */}
          {avgRefHigh !== null && (
            <g>
              <line
                x1={padding.left}
                y1={getY(avgRefHigh)}
                x2={padding.left + innerWidth}
                y2={getY(avgRefHigh)}
                stroke="#94A3B8"
                strokeDasharray="4 3"
                strokeWidth={1}
              />
              <text
                x={padding.left + innerWidth - 4}
                y={getY(avgRefHigh) - 4}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono"
              >
                High Ref: {avgRefHigh} {series.unit}
              </text>
            </g>
          )}

          {avgRefLow !== null && (
            <g>
              <line
                x1={padding.left}
                y1={getY(avgRefLow)}
                x2={padding.left + innerWidth}
                y2={getY(avgRefLow)}
                stroke="#94A3B8"
                strokeDasharray="4 3"
                strokeWidth={1}
              />
              <text
                x={padding.left + innerWidth - 4}
                y={getY(avgRefLow) + 12}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono"
              >
                Low Ref: {avgRefLow} {series.unit}
              </text>
            </g>
          )}

          {/* Trend Line Path */}
          {numericPoints.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="#2563EB"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {numericPoints.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.value as number);
            const isHigh = p.flag === "high";
            const isLow = p.flag === "low";
            const dotFill = isHigh ? "#DC2626" : isLow ? "#D97706" : "#2563EB";

            return (
              <g
                key={idx}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setActivePoint(p)}
                onClick={() => setActivePoint(p)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={activePoint === p ? 6 : 4.5}
                  fill={dotFill}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  className="shadow-sm"
                />
                {/* Date Label on X Axis */}
                <text
                  x={cx}
                  y={padding.top + innerHeight + 18}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-500 font-medium"
                >
                  {p.date}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Data Point Tooltip Card */}
        {activePoint && (
          <div className="mt-3 p-3 rounded-button bg-surface-subtle border border-border flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase font-semibold">
                  {activePoint.date}
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {activePoint.value} {activePoint.unit}
                </span>
              </div>

              {activePoint.flag && (
                <Badge
                  variant={
                    activePoint.flag === "normal"
                      ? "success"
                      : activePoint.flag === "high"
                      ? "destructive"
                      : "warning"
                  }
                  className="text-[10px] uppercase tracking-wider"
                >
                  {activePoint.flag}
                </Badge>
              )}
            </div>

            <Link
              href={`/app/records/${activePoint.documentId}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="truncate max-w-[180px]">{activePoint.documentTitle}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
