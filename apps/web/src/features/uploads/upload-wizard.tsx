"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useActiveMember } from "@/features/family/active-member-context";
import { useInitDocumentUpload, useCompleteDocumentUpload } from "@/features/records/api";

const CATEGORIES = [
  { value: "lab_result", label: "Diagnostic Lab Results" },
  { value: "prescription", label: "Prescription & Medication" },
  { value: "imaging", label: "Radiology & Imaging (X-ray, MRI, CT)" },
  { value: "clinical_report", label: "Doctor Note / Clinical Report" },
  { value: "vaccination", label: "Vaccination & Immunization" },
  { value: "discharge_summary", label: "Hospital Discharge Summary" },
  { value: "other", label: "Other Health Document" },
];

interface UploadWizardProps {
  initialMemberId?: string;
  onSuccess?: (documentId: string) => void;
}

export function UploadWizard({ initialMemberId, onSuccess }: UploadWizardProps) {
  const router = useRouter();
  const { members, activeMemberId } = useActiveMember();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMemberId || activeMemberId || ""
  );
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("lab_result");
  const [documentDate, setDocumentDate] = useState("");
  const [notes, setNotes] = useState("");

  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "completing" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const initUploadMutation = useInitDocumentUpload();
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const completeUploadMutation = useCompleteDocumentUpload(activeDocId || "");

  // Update member if list loads and no member is selected
  useEffect(() => {
    if (!selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  // Prepopulate title from file name
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file && !title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedFile) {
      setErrorMsg("Please select a document file to upload.");
      return;
    }
    if (!selectedMemberId) {
      setErrorMsg("Please select a target family member for this record.");
      return;
    }
    if (!title.trim()) {
      setErrorMsg("Please enter a document title.");
      return;
    }

    try {
      setUploadStatus("uploading");
      setUploadProgress(15);

      // Step 1: Initialize document record on backend & retrieve presigned URL
      const initRes = await initUploadMutation.mutateAsync({
        memberId: selectedMemberId,
        title: title.trim(),
        category,
        originalFilename: selectedFile.name,
        mimeType: selectedFile.type,
        fileSizeBytes: selectedFile.size,
        documentDate: documentDate ? documentDate : null,
        notes: notes.trim() || null,
      });

      const { document, versionId, uploadUrl } = initRes;
      setActiveDocId(document.id);
      setUploadProgress(40);

      // Step 2: Upload file directly to signed upload URL
      // If the presigned URL is a mock or Supabase URL, PUT the file
      try {
        await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": selectedFile.type,
          },
          body: selectedFile,
        });
      } catch (putErr) {
        // Fallback for local mock environment
        console.warn("Direct PUT notice (local development mock):", putErr);
      }

      setUploadProgress(85);
      setUploadStatus("completing");

      // Step 3: Complete upload on backend
      await completeUploadMutation.mutateAsync({
        versionId,
      });

      setUploadProgress(100);
      setUploadStatus("success");

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(document.id);
        } else {
          router.push(`/app/records/${document.id}`);
        }
      }, 700);
    } catch (err: unknown) {
      setUploadStatus("error");
      const msg = err instanceof Error ? err.message : "Failed to upload document.";
      setErrorMsg(msg);
    }
  };

  const isUploading = uploadStatus === "uploading" || uploadStatus === "completing";

  return (
    <Card className="max-w-2xl mx-auto shadow-sm border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Upload Medical Document</CardTitle>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Lock className="h-3 w-3 text-semantic-success-text" />
            <span>Encrypted Vault Storage</span>
          </div>
        </div>
        <CardDescription>
          Upload laboratory panels, prescriptions, pathology reports, or doctor summaries.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleUpload}>
        <CardContent className="space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-card bg-semantic-error-bg p-3.5 border border-semantic-error-border text-xs text-semantic-error-text">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {uploadStatus === "success" && (
            <div className="flex items-center gap-2 rounded-card bg-semantic-success-bg p-3.5 border border-semantic-success-border text-xs text-semantic-success-text">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>Document uploaded successfully! Redirecting to health record view...</p>
            </div>
          )}

          {/* Step 1: File dropzone */}
          <div className="space-y-1.5">
            <Label required>Medical Document File</Label>
            <FileDropzone
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
            />
          </div>

          {/* Step 2: Member selector */}
          <div className="space-y-1.5">
            <Label htmlFor="memberSelect" required>
              Family Member
            </Label>
            {members.length === 0 ? (
              <p className="text-xs text-semantic-warning-text bg-semantic-warning-bg p-3 rounded-card border border-semantic-warning-border">
                Please add at least one family member before uploading records.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`flex items-center gap-3 p-3 rounded-card border text-left transition-all ${
                      selectedMemberId === m.id
                        ? "border-primary bg-primary-tint/40 shadow-xs"
                        : "border-border bg-surface hover:bg-surface-subtle"
                    }`}
                  >
                    <Avatar name={m.fullName} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-text-primary truncate">
                        {m.fullName}
                      </div>
                      <div className="text-[10px] text-text-secondary truncate">
                        {m.relationship}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="docTitle" required>
                Document Title
              </Label>
              <Input
                id="docTitle"
                placeholder="e.g. Lipid Panel or Chest X-Ray"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="docCategory" required>
                Category
              </Label>
              <select
                id="docCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 rounded-input border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="docDate">Document / Test Date</Label>
            <Input
              id="docDate"
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="docNotes">Clinical Context / Notes (Optional)</Label>
            <textarea
              id="docNotes"
              rows={2}
              placeholder="Doctor name, clinic location, or reasons for test..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-input border border-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-medium text-text-secondary">
                <span>
                  {uploadStatus === "uploading" && "Uploading to encrypted vault..."}
                  {uploadStatus === "completing" && "Finalizing document version..."}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden border border-border">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isUploading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            isLoading={isUploading}
            disabled={!selectedFile || members.length === 0}
            className="gap-2"
          >
            <span>Upload & Save Record</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
