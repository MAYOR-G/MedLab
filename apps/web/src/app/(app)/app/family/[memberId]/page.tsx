"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format, differenceInYears } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Plus,
  Edit,
  Activity,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { MemberFormDialog } from "@/features/family/member-form-dialog";
import { useFamilyMember } from "@/features/family/api";
import { useMemberAnalytes } from "@/features/trends/api";

export default function FamilyMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.memberId as string;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: member, isLoading, error } = useFamilyMember(memberId);
  const { data: analytes = [] } = useMemberAnalytes(memberId);

  if (isLoading) {
    return (
      <div>
        <Header title="Medical Profile" />
        <div className="p-6 max-w-5xl mx-auto">
          <div className="h-64 rounded-card border border-border bg-surface animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div>
        <Header title="Member Not Found" />
        <div className="p-6 max-w-lg mx-auto text-center py-16">
          <AlertCircle className="mx-auto h-12 w-12 text-semantic-error-text mb-3" />
          <h2 className="text-base font-semibold text-text-primary">Family Member Not Found</h2>
          <p className="text-xs text-text-secondary mt-1">
            This member profile may have been deleted or does not belong to your workspace.
          </p>
          <Link href="/app/family" className="inline-block mt-4">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Family Roster</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const birthDate = member.dateOfBirth ? new Date(member.dateOfBirth) : null;
  const age = birthDate ? differenceInYears(new Date(), birthDate) : null;

  return (
    <div>
      <Header
        title={member.fullName}
        subtitle={`Medical profile & health history for ${member.fullName}`}
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <Link
          href="/app/family"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to all members</span>
        </Link>

        {/* Hero Profile Banner */}
        <Card className="p-6 border-border shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={member.fullName} size="xl" />
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-bold text-text-primary">
                    {member.fullName}
                  </h2>
                  <Badge variant="primary" className="text-xs">
                    {member.relationship}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-text-secondary">
                  {birthDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
                      <span>
                        Born {format(birthDate, "MMM d, yyyy")} {age !== null && `(${age} yrs)`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-text-tertiary" />
                    <span>Member since {format(new Date(member.createdAt), "MMMM yyyy")}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="gap-1.5"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Details</span>
            </Button>
          </div>

          {member.notes && (
            <div className="mt-5 pt-4 border-t border-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary block mb-1">
                Clinical & Health Notes
              </span>
              <p className="text-xs text-text-primary leading-relaxed bg-surface-subtle p-3 rounded-card border border-border">
                {member.notes}
              </p>
            </div>
          )}
        </Card>

        {/* Member Records & Health Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Medical Documents</CardTitle>
                <CardDescription className="text-xs">
                  All lab reports, diagnostics, and doctor summaries for {member.fullName}.
                </CardDescription>
              </div>
              <Link href={`/app/records?action=upload&memberId=${member.id}`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span>Upload Record</span>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 px-4 rounded-card border border-dashed border-border bg-surface-subtle/50">
                <FileText className="mx-auto h-8 w-8 text-text-tertiary mb-2" />
                <h4 className="text-sm font-semibold text-text-primary">
                  No records stored for {member.fullName}
                </h4>
                <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                  Upload PDF lab results or clinical visit notes. MedLab will extract medical biomarkers and generate plain-English explanations.
                </p>
                <Link
                  href={`/app/records?action=upload&memberId=${member.id}`}
                  className="inline-block mt-4"
                >
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span>Upload First Record</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Biomarker Highlights */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Key Biomarkers</CardTitle>
                </div>
                {analytes.length > 0 && (
                  <Link
                    href="/app/trends"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    View All &rarr;
                  </Link>
                )}
              </div>
              <CardDescription className="text-xs">
                Tracked laboratory trends across blood panels and vitals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytes.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-tertiary italic bg-surface-subtle/50 rounded-card border border-border p-4">
                  Biomarkers will appear here automatically when documents are parsed and verified.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {analytes.slice(0, 5).map((a) => (
                    <div
                      key={a.normalizedTestKey}
                      className="flex items-center justify-between p-2.5 rounded-button bg-surface-subtle border border-border text-xs"
                    >
                      <div>
                        <div className="font-semibold text-text-primary">{a.displayName}</div>
                        <div className="text-[10px] text-text-secondary">
                          {a.count} observations • Latest: {a.latestMeasuredOn}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-text-primary">
                          {a.latestValue} {a.latestUnit}
                        </div>
                        {a.latestFlag && (
                          <Badge
                            variant={
                              a.latestFlag === "normal"
                                ? "success"
                                : a.latestFlag === "high"
                                ? "destructive"
                                : "warning"
                            }
                            className="text-[9px] uppercase px-1.5 py-0"
                          >
                            {a.latestFlag}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  <Link href="/app/trends" className="block pt-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Open Longitudinal Trends Chart
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MemberFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        memberToEdit={member}
      />
    </div>
  );
}
