"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format, differenceInYears } from "date-fns";
import { Calendar, FileText, MoreHorizontal, Edit, Trash2, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDeleteFamilyMember, type FamilyMemberData } from "@/features/family/api";

interface FamilyMemberCardProps {
  member: FamilyMemberData;
  onEdit: (member: FamilyMemberData) => void;
}

export function FamilyMemberCard({ member, onEdit }: FamilyMemberCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteMutation = useDeleteFamilyMember();

  const birthDate = member.dateOfBirth ? new Date(member.dateOfBirth) : null;
  const age = birthDate ? differenceInYears(new Date(), birthDate) : null;

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(member.id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Card className="hover:border-primary/40 hover:shadow-sm transition-all duration-150 flex flex-col justify-between">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={member.fullName} size="lg" />
              <div>
                <h3 className="font-semibold text-text-primary text-base leading-tight">
                  {member.fullName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="primary" className="text-[11px] font-medium py-0 px-2">
                    {member.relationship}
                  </Badge>
                  {age !== null && (
                    <span className="text-xs text-text-secondary">
                      {age} {age === 1 ? "year old" : "years old"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-text-secondary hover:text-text-primary"
                onClick={() => onEdit(member)}
                title="Edit member"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-text-secondary hover:text-semantic-error-text"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete member"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-2 pb-4 flex-1">
          {birthDate && (
            <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
              <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
              <span>Born {format(birthDate, "MMMM d, yyyy")}</span>
            </div>
          )}

          {member.notes ? (
            <p className="text-xs text-text-secondary line-clamp-2 bg-surface-subtle p-2.5 rounded-card border border-border/60">
              {member.notes}
            </p>
          ) : (
            <p className="text-xs text-text-tertiary italic">No health notes recorded</p>
          )}
        </CardContent>

        <CardFooter className="p-5 pt-0 border-t border-border/60 mt-2 flex items-center justify-between text-xs text-text-secondary">
          <Link
            href={`/app/family/${member.id}`}
            className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-xs mt-3"
          >
            <span>View Medical Profile</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <span className="text-[11px] text-text-tertiary mt-3">
            Added {format(new Date(member.createdAt), "MMM yyyy")}
          </span>
        </CardFooter>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Family Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong className="text-text-primary">{member.fullName}</strong>? Their
              records will remain archived in the vault but won&apos;t appear under this active
              profile. All active share links for their records will be immediately revoked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
