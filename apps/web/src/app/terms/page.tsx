import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, AlertTriangle, FileText, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 mb-3">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Non-Diagnostic Clinical Disclaimer & Terms</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-clinical-navy">
            Terms of Service
          </h1>
          <p className="text-sm text-clinical-slate mt-2">
            Last Updated: May 2026 • Version 1.0
          </p>
        </div>

        {/* Mandatory Medical Disclaimer Banner */}
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <Stethoscope className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 text-sm">
                CRITICAL MEDICAL DISCLAIMER — FOR INFORMATIONAL PURPOSES ONLY
              </h3>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                MedLab is an informational document management and translation platform. <strong>MedLab does not provide medical diagnoses, treatment advice, or formal medical care.</strong> All AI-generated plain-English explanations and longitudinal trend observations are intended solely for personal comprehension and should never substitute for professional clinical evaluation by a licensed healthcare provider. If you believe you are experiencing a medical emergency, immediately contact your local emergency services.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-clinical-border bg-white p-8 shadow-card space-y-6 text-sm text-clinical-slate leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-clinical-navy flex items-center gap-2">
              <FileText className="h-5 w-5 text-clinical-600" />
              1. Acceptance of Terms
            </h2>
            <p>
              By creating a MedLab vault, uploading health records, or accessing shared medical links, you agree to these Terms of Service. If you do not agree with any provision, please discontinue using the service immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-clinical-navy flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-clinical-600" />
              2. Account & Vault Responsibilities
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your authentication credentials and multi-factor authentication devices. You represent that you have legal authorization to upload and manage the medical records of any family member or dependent included in your workspace.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-clinical-navy flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-clinical-600" />
              3. Limitation of Liability
            </h2>
            <p>
              In no event shall MedLab, its developers, or its medical information contributors be liable for health decisions, treatments, delays, or clinical outcomes resulting from the use of or reliance on plain-English summaries, AI assistant responses, or measurement trend charts.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-clinical-border bg-white py-6 text-center text-xs text-clinical-slate">
        <p>© 2026 MedLab Healthcare Systems. MedLab is not a diagnostic device.</p>
      </footer>
    </div>
  );
}
