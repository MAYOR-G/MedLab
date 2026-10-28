"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateFamilyMember,
  useUpdateFamilyMember,
  type FamilyMemberData,
} from "@/features/family/api";
import { APIClientError } from "@/lib/api/errors";

const NEW_MEMBER_RELATIONSHIPS = [
  "Child",
  "Spouse",
  "Partner",
  "Parent",
  "Sibling",
  "Grandparent",
  "Dependent",
  "Other",
];

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberToEdit?: FamilyMemberData | null;
}

export function MemberFormDialog({
  open,
  onOpenChange,
  memberToEdit,
}: MemberFormDialogProps) {
  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState("Child");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = useCreateFamilyMember();
  const updateMutation = useUpdateFamilyMember(memberToEdit?.id || "");

  const isEditing = !!memberToEdit;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const availableRelationships =
    isEditing && memberToEdit?.relationship?.toLowerCase() === "self"
      ? ["Self", ...NEW_MEMBER_RELATIONSHIPS]
      : NEW_MEMBER_RELATIONSHIPS;

  useEffect(() => {
    if (memberToEdit) {
      setFullName(memberToEdit.fullName);
      setRelationship(memberToEdit.relationship);
      setDateOfBirth(memberToEdit.dateOfBirth || "");
      setNotes(memberToEdit.notes || "");
    } else {
      setFullName("");
      setRelationship("Child");
      setDateOfBirth("");
      setNotes("");
    }
    setErrorMsg(null);
  }, [memberToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }

    try {
      if (isEditing && memberToEdit) {
        await updateMutation.mutateAsync({
          fullName: fullName.trim(),
          relationship,
          dateOfBirth: dateOfBirth ? dateOfBirth : null,
          notes: notes.trim() || null,
        });
      } else {
        await createMutation.mutateAsync({
          fullName: fullName.trim(),
          relationship,
          dateOfBirth: dateOfBirth ? dateOfBirth : null,
          notes: notes.trim() || null,
        });
      }
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof APIClientError && err.status === 401) {
        setErrorMsg("Your session has expired. Please sign in again.");
        return;
      }
      const msg = err instanceof Error ? err.message : "Failed to save family member.";
      setErrorMsg(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Family Member" : "Add Family Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update details for this family member's medical profile."
              : "Add a member to organize and store their medical records separately."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-card bg-semantic-error-bg p-3 border border-semantic-error-border text-xs text-semantic-error-text">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="memberName" required>
              Full Legal Name
            </Label>
            <Input
              id="memberName"
              placeholder="e.g. Leo Jenkins"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="relationship" required>
                Relationship
              </Label>
              <select
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full h-11 rounded-input border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {availableRelationships.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Clinical / Health Notes (Optional)</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Allergies, chronic conditions, blood type, or pediatrician info..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-input border border-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isEditing ? "Save Changes" : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
