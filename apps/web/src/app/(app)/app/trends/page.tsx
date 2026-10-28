"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  TrendingUp,
  FilePlus,
  Users,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveMember } from "@/features/family/active-member-context";
import { useFamilyMembers } from "@/features/family/api";
import {
  useMemberAnalytes,
  useMemberTrends,
  useMemberMeasurements,
} from "@/features/trends/api";
import { TrendChart } from "@/features/trends/trend-chart";
import { MeasurementTable } from "@/features/trends/measurement-table";
import { AnalyteSelector } from "@/features/trends/analyte-selector";

export default function TrendsPage() {
  const { data: members = [], isLoading: isMembersLoading } = useFamilyMembers();
  const { activeMemberId, setActiveMemberId, selectedMember } = useActiveMember();

  // If activeMemberId is null, default to first available member
  const currentMemberId = activeMemberId || (members.length > 0 ? members[0].id : null);
  const currentMember = members.find((m) => m.id === currentMemberId) || selectedMember;

  const { data: analytes = [], isLoading: isAnalytesLoading } = useMemberAnalytes(currentMemberId);
  const [selectedAnalyteKey, setSelectedAnalyteKey] = useState<string | null>(null);

  // Default to first analyte once loaded
  useEffect(() => {
    if (analytes.length > 0 && !selectedAnalyteKey) {
      setSelectedAnalyteKey(analytes[0].normalizedTestKey);
    } else if (analytes.length > 0 && !analytes.some((a) => a.normalizedTestKey === selectedAnalyteKey)) {
      setSelectedAnalyteKey(analytes[0].normalizedTestKey);
    }
  }, [analytes, selectedAnalyteKey]);

  const { data: trendSeries, isLoading: isTrendLoading } = useMemberTrends(
    currentMemberId,
    selectedAnalyteKey
  );

  const { data: measurements = [], isLoading: isMeasurementsLoading } = useMemberMeasurements(
    currentMemberId,
    selectedAnalyteKey
  );

  return (
    <div>
      <Header
        title="Health Trends & Biomarkers"
        subtitle="Longitudinal comparisons of lab values and vitals across time"
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Member Selector Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-card border border-border bg-surface shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-text-primary">
                Viewing Trends For:
              </div>
              <div className="text-sm font-bold text-text-primary">
                {currentMember ? currentMember.fullName : "Select Family Member"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="member-select" className="text-xs text-text-secondary whitespace-nowrap">
              Member Profile:
            </label>
            <select
              id="member-select"
              value={currentMemberId || ""}
              onChange={(e) => {
                setActiveMemberId(e.target.value);
                setSelectedAnalyteKey(null);
              }}
              className="h-9 w-full sm:w-56 rounded-input border border-border bg-surface px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.relationship})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isAnalytesLoading ? (
          <div className="flex items-center justify-center py-20 text-text-secondary text-xs gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading medical biomarkers and historical trends...</span>
          </div>
        ) : analytes.length === 0 ? (
          /* Empty State if no measurements recorded yet */
          <Card className="p-12 text-center max-w-lg mx-auto shadow-xs">
            <Activity className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
            <h3 className="text-base font-semibold text-text-primary">No Lab Trends Recorded</h3>
            <p className="text-xs text-text-secondary mt-1">
              {currentMember ? currentMember.fullName : "This member"} does not have any processed lab results or structured measurements yet.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/app/records/upload">
                <Button size="sm" className="gap-2 text-xs">
                  <FilePlus className="h-4 w-4" />
                  <span>Upload Lab Report</span>
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          /* Active Trends Dashboard */
          <div className="space-y-6">
            {/* Analyte Tab Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block">
                Tracked Biomarkers ({analytes.length})
              </span>
              <AnalyteSelector
                analytes={analytes}
                selectedKey={selectedAnalyteKey}
                onSelectKey={(key) => setSelectedAnalyteKey(key)}
              />
            </div>

            {/* Main Trend Visualization Card */}
            {selectedAnalyteKey && trendSeries && (
              <Card className="shadow-xs border-border">
                <CardHeader className="pb-2 border-b border-border/80">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold text-text-primary">
                          {trendSeries.displayName}
                        </CardTitle>
                        {trendSeries.latestFlag && (
                          <Badge
                            variant={
                              trendSeries.latestFlag === "normal"
                                ? "success"
                                : trendSeries.latestFlag === "high"
                                ? "destructive"
                                : "warning"
                            }
                            className="text-[10px] uppercase font-semibold"
                          >
                            Latest: {trendSeries.latestFlag}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        Standard unit: <strong>{trendSeries.unit || "N/A"}</strong> •{" "}
                        {trendSeries.points.length} recorded observations
                      </CardDescription>
                    </div>

                    {trendSeries.latestValue !== null && trendSeries.latestValue !== undefined && (
                      <div className="text-right sm:text-right">
                        <span className="text-[10px] text-text-tertiary uppercase font-semibold block">
                          Most Recent
                        </span>
                        <span className="text-xl font-bold text-text-primary">
                          {trendSeries.latestValue} {trendSeries.unit}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {isTrendLoading ? (
                    <div className="h-64 flex items-center justify-center text-xs text-text-secondary">
                      <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                      <span>Computing longitudinal curve...</span>
                    </div>
                  ) : (
                    <TrendChart series={trendSeries} />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Historical Observations Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  Historical Observation Log
                </h3>
                <span className="text-xs text-text-secondary">
                  Showing {measurements.length} records
                </span>
              </div>

              <MeasurementTable measurements={measurements} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
