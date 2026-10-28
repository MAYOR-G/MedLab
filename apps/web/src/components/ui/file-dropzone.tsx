"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
  className?: string;
}

const DEFAULT_ACCEPTED = ["application/pdf", "image/png", "image/jpeg"];
const DEFAULT_MAX_SIZE = 26214440; // 25 MB

export function FileDropzone({
  onFileSelect,
  selectedFile,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED,
  className,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateAndSelect = (file: File) => {
    setErrorMsg(null);

    // Validate type
    if (!acceptedTypes.includes(file.type)) {
      setErrorMsg("Unsupported file format. Please upload a PDF, PNG, or JPEG file.");
      return;
    }

    // Validate size
    if (file.size > maxSizeBytes) {
      setErrorMsg(`File is too large (${formatFileSize(file.size)}). Maximum allowed size is 25 MB.`);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onFileSelect(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleInputChange}
        className="hidden"
      />

      {selectedFile ? (
        <div className="flex items-center justify-between p-4 rounded-card border border-border bg-surface shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-button bg-primary-tint text-primary flex items-center justify-center shrink-0">
              {selectedFile.type.includes("pdf") ? (
                <FileText className="h-5 w-5" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-text-secondary">
                {formatFileSize(selectedFile.size)} • {selectedFile.type.split("/")[1].toUpperCase()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-button text-text-secondary hover:text-semantic-error-text hover:bg-semantic-error-bg transition-colors"
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center p-8 rounded-card border-2 border-dashed transition-all cursor-pointer text-center select-none",
            isDragging
              ? "border-primary bg-primary-tint/30 scale-[1.005]"
              : "border-border hover:border-primary/50 hover:bg-surface-subtle/50 bg-surface"
          )}
        >
          <div className="h-12 w-12 rounded-full bg-blue-50 text-primary flex items-center justify-center mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-text-primary">
            Click to upload or drag & drop medical document
          </p>
          <p className="text-xs text-text-secondary mt-1 max-w-sm">
            PDF, PNG, or JPEG (up to 25 MB). Files are stored in an encrypted vault.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-card bg-semantic-error-bg p-3 border border-semantic-error-border text-xs text-semantic-error-text">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
