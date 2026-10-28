import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Database, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-clinical-50/40 flex flex-col font-sans">
      <header className="border-b border-clinical-border bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-clinical-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-clinical-navy">
              MedLab
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-clinical-slate">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clinical-50 border border-clinical-200 text-xs font-semibold text-clinical-700 mb-3">
            <Lock className="h-3.5 w-3.5" />
            <span>Privacy Architecture & Compliance Guarantee</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-clinical-navy">
            MedLab Privacy Policy
          </h1>
          <p className="text-sm text-clinical-slate mt-2">
            Last Updated: May 2026 • Version 1.0 (Strict Zero-Training Medical Privacy)
          </p>
        </div>

        <div className="rounded-2xl border border-clinical-border bg-white p-8 shadow-card space-y-6 text-sm text-clinical-slate leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-clinical-navy flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-clinical-600" />
              1. Zero Training on Your Personal Health Information (PHI)
            </h2>
            <p>
              Your medical reports, physician notes, and lab measurements are strictly your private property. MedLab does <strong>not</strong> sell, rent, license, or use your medical documents or personal data to train public artificial intelligence models. AI prompts sent for plain-English summarization are sanitized and processed under zero-data-retention agreements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-clinical-navy flex items-center gap-2">
              <Database className="h-5 w-5 text-clinical-600" />
              2. Isolated Row-Level Security & Encrypted Storage
            </h2>
            <p>
              All files are stored in private, access-restricted cloud storage partitions. Database queries are governed by PostgreSQL Row-Level Security (RLS) policies cryptographically tied to your authenticated identity. No user can access or view another user&apos;s workspace data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-clinical-navy flex items-center gap-2">
              <Lock className="h-5 w-5 text-clinical-600" />
              3. Secure Cryptographic Share Links
            </h2>
            <p>
              When you generate a link to share a medical record with a doctor, MedLab computes a SHA-256 hash of the 256-bit token. The raw bearer token is never written to disk or database tables. When you revoke a link or when the expiration window elapses, recipient access is permanently and instantaneously severed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-clinical-navy flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-clinical-600" />
              4. Recoverable Trash & Right to Complete Erasure
            </h2>
            <p>
              Deleted records are preserved in your private Recoverable Trash for exactly 30 days, allowing accidental deletions to be restored. At any time, you may request permanent immediate erasure or execute the Danger Zone account deletion workflow in Settings, which purges all stored files, database records, and derived data permanently.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-clinical-border bg-white py-6 text-center text-xs text-clinical-slate">
        <p>© 2026 MedLab Healthcare Systems. All medical data is protected under zero-training privacy guarantees.</p>
      </footer>
    </div>
  );
}
