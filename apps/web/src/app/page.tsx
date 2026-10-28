import Link from "next/link";
import { ShieldCheck, FileText, Sparkles, Share2, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-button bg-primary flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary">
              MedLab
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/app">
              <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary hover:bg-primary-tint">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Explore Demo Vault</span>
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Create Vault
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center">
        <Badge variant="primary" className="mb-6 px-3 py-1 text-xs gap-1.5 shadow-2xs">
          <Lock className="h-3 w-3 text-primary" />
          <span>Private, Family-Centered Medical Vault</span>
        </Badge>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-text-primary max-w-3xl leading-[1.15]">
          Your family&apos;s medical records, finally understood and organized.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed">
          Store lab tests, pathology reports, and health records in an encrypted private vault. Translate complex clinical terminology into clear plain English, track biomarkers over time, and share records with expiring links.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link href="/app">
            <Button size="lg" className="gap-2 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
              <span>Explore Demo Vault Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign In to Existing Vault
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <div className="h-10 w-10 rounded-button bg-blue-50 text-primary flex items-center justify-center mb-4">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              Centralized Family Records
            </h3>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              Organize medical documents per family member or dependent. Keep track of doctor visits, lab reports, and vaccinations in one place.
            </p>
          </div>

          <div className="rounded-card border border-ai-border bg-ai-bg/40 p-6 shadow-xs">
            <div className="h-10 w-10 rounded-button bg-blue-100 text-ai-label flex items-center justify-center mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              AI Plain-English Explanations
            </h3>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              Powered by medical-tuned AI models that demystify confusing clinical acronyms, summarize key findings, and highlight questions for your doctor.
            </p>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-xs">
            <div className="h-10 w-10 rounded-button bg-blue-50 text-primary flex items-center justify-center mb-4">
              <Share2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              Secure Expiring Share Links
            </h3>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              Share specific lab results with specialists or second-opinion clinicians using time-limited, password-optional, revokable links.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>MedLab v1.0 — Calm Clinical Medical Platform</span>
          </div>
          <div>© 2026 MedLab. End-to-end private & HIPAA-aligned architecture.</div>
        </div>
      </footer>
    </div>
  );
}
