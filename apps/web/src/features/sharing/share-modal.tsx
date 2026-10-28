"use client";

import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  FileText,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  useCreateShareLink,
  type ShareLinkCreatedResponse,
} from "./api";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
}

export function ShareModal({
  open,
  onOpenChange,
  documentId,
  documentTitle,
}: ShareModalProps) {
  const [expiresInHours, setExpiresInHours] = useState<number>(24);
  const [includeOriginal, setIncludeOriginal] = useState<boolean>(true);
  const [includeSummary, setIncludeSummary] = useState<boolean>(true);
  const [createdShare, setCreatedShare] = useState<ShareLinkCreatedResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = useCreateShareLink(documentId);

  const handleGenerate = async () => {
    try {
      setErrorMsg(null);
      if (!includeOriginal && !includeSummary) {
        setErrorMsg("You must select at least one content option to share.");
        return;
      }

      const res = await createMutation.mutateAsync({
        expiresInHours,
        includeOriginal,
        includeSummary,
      });
      setCreatedShare(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create share link.";
      setErrorMsg(msg);
    }
  };

  const handleCopy = async () => {
    if (!createdShare?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(createdShare.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleClose = () => {
    setCreatedShare(null);
    setCopied(false);
    setErrorMsg(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Share Medical Record</DialogTitle>
              <DialogDescription className="text-xs">
                Create a time-limited, revocable link to share &quot;{documentTitle}&quot; with doctors or family.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-card bg-semantic-error-bg p-3 border border-semantic-error-border text-xs text-semantic-error-text flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!createdShare ? (
          <div className="space-y-4 pt-1">
            {/* Expiration Preset Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary block">
                Link Expiration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "24 Hours", value: 24 },
                  { label: "3 Days", value: 72 },
                  { label: "7 Days", value: 168 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExpiresInHours(opt.value)}
                    className={`py-2 px-3 text-xs font-medium rounded-button border text-center transition-colors ${
                      expiresInHours === opt.value
                        ? "bg-primary text-white border-primary"
                        : "bg-surface hover:bg-surface-subtle border-border text-text-primary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inclusions Checkboxes */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-text-primary block">
                Include in Shared Link
              </label>

              <label className="flex items-center gap-3 p-3 rounded-button border border-border bg-surface-subtle hover:bg-surface cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeOriginal}
                  onChange={(e) => setIncludeOriginal(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div className="text-xs">
                  <div className="font-semibold text-text-primary flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-text-tertiary" />
                    <span>Original Document (PDF / Image)</span>
                  </div>
                  <div className="text-text-secondary text-[11px] mt-0.5">
                    Recipient can view and download the certified file.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-button border border-border bg-surface-subtle hover:bg-surface cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div className="text-xs">
                  <div className="font-semibold text-text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>AI Medical Translation & Citations</span>
                  </div>
                  <div className="text-text-secondary text-[11px] mt-0.5">
                    Plain-English explanation of lab abbreviations and test ranges.
                  </div>
                </div>
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                isLoading={createMutation.isPending}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Create Share Link</span>
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Link Generated Result State */
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-card bg-semantic-success-bg border border-semantic-success-border text-xs text-semantic-success-text flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-semantic-success-text shrink-0" />
              <span>Share link generated! Anyone with this link can view the document until expiration.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Shareable Link
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={createdShare.shareUrl}
                  className="text-xs font-mono select-all h-10 bg-surface-subtle"
                />
                <Button
                  onClick={handleCopy}
                  variant={copied ? "primary" : "outline"}
                  className="gap-1.5 shrink-0 h-10 px-3"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-white" />
                      <span className="text-xs">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-xs">Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-card border border-border p-3 text-xs space-y-1.5 text-text-secondary">
              <div className="flex items-center justify-between">
                <span>Duration:</span>
                <span className="font-medium text-text-primary">
                  Expires {new Date(createdShare.expiresAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Security:</span>
                <span className="text-semantic-success-text font-medium">
                  Revocable anytime in Shared Links
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
