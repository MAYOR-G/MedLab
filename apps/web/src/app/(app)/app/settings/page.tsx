"use client";

import React, { useState, useEffect } from "react";
import { User, ShieldCheck, Home, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useMyProfile,
  useUpdateMyProfile,
  useWorkspace,
  useUpdateWorkspace,
} from "@/features/users/api";
import { DangerZone } from "@/features/settings/danger-zone";

export default function SettingsPage() {
  const { data: profile, isLoading: isProfileLoading } = useMyProfile();
  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace();

  const updateProfileMutation = useUpdateMyProfile();
  const updateWorkspaceMutation = useUpdateWorkspace();

  const [displayName, setDisplayName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [workspaceSuccess, setWorkspaceSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.displayName) {
      setDisplayName(profile.displayName);
    }
  }, [profile]);

  useEffect(() => {
    if (workspace?.name) {
      setWorkspaceName(workspace.name);
    }
  }, [workspace]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setErrorMsg(null);
    try {
      await updateProfileMutation.mutateAsync({ displayName: displayName.trim() });
      setProfileSuccess("Profile updated successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      setErrorMsg(msg);
    }
  };

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorkspaceSuccess(null);
    setErrorMsg(null);
    try {
      await updateWorkspaceMutation.mutateAsync({ name: workspaceName.trim() });
      setWorkspaceSuccess("Workspace renamed successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to rename workspace.";
      setErrorMsg(msg);
    }
  };

  return (
    <div>
      <Header
        title="Settings"
        subtitle="Manage your personal profile, family workspace configuration, and vault security."
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-card bg-semantic-error-bg p-3.5 border border-semantic-error-border text-xs text-semantic-error-text">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Personal Profile</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Your name as it appears in document audit logs and workspace views.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profileSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-card bg-semantic-success-bg p-3 border border-semantic-success-border text-xs text-semantic-success-text">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p>{profileSuccess}</p>
              </div>
            )}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Dr. Alex Jenkins or Sarah"
                  disabled={isProfileLoading}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                isLoading={updateProfileMutation.isPending}
                disabled={isProfileLoading}
              >
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Workspace Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Family Workspace</CardTitle>
              </div>
              <Badge variant="success" className="text-[11px]">
                {workspace?.status || "Active"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              The overarching vault name shared across your family members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workspaceSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-card bg-semantic-success-bg p-3 border border-semantic-success-border text-xs text-semantic-success-text">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p>{workspaceSuccess}</p>
              </div>
            )}
            <form onSubmit={handleSaveWorkspace} className="space-y-4">
              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="workspaceName" required>
                  Workspace Name
                </Label>
                <Input
                  id="workspaceName"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. The Jenkins Family Vault"
                  disabled={isWorkspaceLoading}
                  required
                />
              </div>
              <Button
                type="submit"
                size="sm"
                isLoading={updateWorkspaceMutation.isPending}
                disabled={isWorkspaceLoading}
              >
                Rename Workspace
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Vault Security & Compliance Overview */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-semantic-success-text" />
              <CardTitle className="text-base">Privacy & Vault Protection</CardTitle>
            </div>
            <CardDescription className="text-xs">
              MedLab security controls and compliance guarantees.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-text-secondary">
            <div className="flex items-start gap-3 p-3 rounded-card bg-surface-subtle border border-border">
              <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-primary">Encrypted Storage & Row-Level Isolation</p>
                <p className="mt-0.5 leading-relaxed">
                  Every medical document is stored in an isolated private cloud bucket. Database queries are enforced via PostgreSQL Row-Level Security (RLS) bound to your authenticated user ID.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-card bg-surface-subtle border border-border">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-primary">Immutable Audit Logging</p>
                <p className="mt-0.5 leading-relaxed">
                  All document uploads, downloads, AI summarization requests, and share-link views produce append-only audit trail events.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <DangerZone workspaceName={workspace?.name} />
      </div>
    </div>
  );
}
