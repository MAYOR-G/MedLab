"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, AlertCircle, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveMember } from "@/features/family/active-member-context";
import { useDocument, useUpdateDocument } from "@/features/records/api";

const CATEGORIES = [
  { value: "lab_result", label: "Diagnostic Lab Results" },
  { value: "prescription", label: "Prescription & Medication" },
  { value: "imaging", label: "Radiology & Imaging (X-ray, MRI, CT)" },
  { value: "clinical_report", label: "Doctor Note / Clinical Report" },
  { value: "vaccination", label: "Vaccination & Immunization" },
  { value: "discharge_summary", label: "Hospital Discharge Summary" },
  { value: "other", label: "Other Health Document" },
];

export default function EditDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params?.recordId as string;

  const { data: document, isLoading } = useDocument(recordId);
  const { members } = useActiveMember();
  const updateMutation = useUpdateDocument(recordId);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("lab_result");
  const [documentDate, setDocumentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [memberId, setMemberId] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setCategory(document.category);
      setDocumentDate(document.documentDate || "");
      setNotes(document.notes || "");
      setMemberId(document.familyMemberId);
    }
  }, [document]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Document title is required.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        title: title.trim(),
        category,
        documentDate: documentDate ? documentDate : null,
        notes: notes.trim() || null,
        familyMemberId: memberId || null,
      });

      router.push(`/app/records/${recordId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update document metadata.";
      setErrorMsg(msg);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Edit Document" />
        <div className="p-6 max-w-2xl mx-auto">
          <div className="h-64 rounded-card border border-border bg-surface animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Edit Record Metadata"
        subtitle="Update title, category, document date, and clinical notes."
      />

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <Link
          href={`/app/records/${recordId}`}
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to document view</span>
        </Link>

        <Card className="border-border shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              <CardTitle>Edit Medical Document</CardTitle>
            </div>
            <CardDescription>
              Changes are immediately synchronized across your family vault.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="flex items-start gap-2 rounded-card bg-semantic-error-bg p-3.5 border border-semantic-error-border text-xs text-semantic-error-text">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="title" required>
                  Document Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category" required>
                    Category
                  </Label>
                  <select
                    id="category"
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

                <div className="space-y-1.5">
                  <Label htmlFor="memberSelect" required>
                    Family Member
                  </Label>
                  <select
                    id="memberSelect"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    className="w-full h-11 rounded-input border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.relationship})
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
                <Label htmlFor="notes">Clinical Notes</Label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-input border border-border bg-surface p-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/app/records/${recordId}`)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
