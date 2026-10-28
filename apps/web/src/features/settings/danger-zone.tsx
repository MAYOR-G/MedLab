"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, Loader2, ShieldAlert } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api/client";
import { createClient } from "@/lib/auth/supabase";

interface DangerZoneProps {
  workspaceName?: string;
}

export function DangerZone({ workspaceName = "My Family" }: DangerZoneProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isValidConfirmation =
    confirmInput.trim() === workspaceName || confirmInput.trim() === "DELETE";

  const handleDeleteWorkspace = async () => {
    if (!isValidConfirmation) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await apiClient("/api/v1/account/deletion-requests", {
        method: "POST",
        body: JSON.stringify({ confirmationText: confirmInput.trim() }),
      });

      // Sign out from Supabase
      const supabase = createClient();
      await supabase.auth.signOut();

      // Redirect to login with confirmation
      router.push("/login?message=workspace_deleted");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to process account deletion request.";
      setErrorMsg(msg);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-red-200 bg-white shadow-card overflow-hidden">
        <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-red-900">
              Danger Zone — Account & Workspace Deletion
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-red-700 mt-1">
            Irreversible actions that result in the termination of this medical records vault.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-xs text-clinical-slate">
          <p className="leading-relaxed">
            Requesting permanent deletion will immediately revoke all active share links, soft-delete your family workspace, and queue all medical records, lab extractions, and AI summaries for permanent background erasure.
          </p>
          <div className="rounded-lg bg-red-50/70 p-3.5 border border-red-200 text-red-900 space-y-1">
            <p className="font-semibold text-xs flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
              What happens when you delete:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-800">
              <li>All physician share links are instantly severed.</li>
              <li>Stored PDF documents and medical images are permanently removed from storage.</li>
              <li>All AI health assistant chats and longitudinal trends are destroyed.</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="bg-red-50/30 border-t border-red-100 flex justify-end p-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowConfirm(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Workspace & Account</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base text-clinical-navy">
                  Confirm Workspace Deletion
                </DialogTitle>
                <DialogDescription className="text-xs text-clinical-slate mt-0.5">
                  Type <span className="font-semibold text-red-600 select-all">{workspaceName}</span> or <span className="font-semibold text-red-600 select-all">DELETE</span> below to confirm.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-3 py-2">
            <Label className="text-xs text-clinical-navy font-medium">
              Confirmation Input
            </Label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={`Type "${workspaceName}" or "DELETE"`}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowConfirm(false);
                setConfirmInput("");
                setErrorMsg(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!isValidConfirmation || isDeleting}
              onClick={handleDeleteWorkspace}
              className="gap-1.5"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Confirm Permanent Deletion</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
