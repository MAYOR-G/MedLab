import React from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { ShieldCheck, HeartPulse } from "lucide-react";

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-clinical-50/50 flex flex-col font-sans">
        {/* Public Header */}
        <header className="border-b border-clinical-border bg-white sticky top-0 z-30 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinical-600 text-white shadow-xs">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-clinical-navy">
                  MedLab
                </span>
                <span className="ml-2 text-xs font-medium text-clinical-slate hidden sm:inline">
                  Secure Family Medical Vault
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-clinical-border bg-clinical-50 px-3 py-1 text-xs font-medium text-clinical-700">
              <ShieldCheck className="h-4 w-4 text-clinical-600" />
              <span>Time-Limited Share</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-clinical-border bg-white py-6 text-center text-xs text-clinical-slate">
          <div className="max-w-5xl mx-auto px-4 space-y-1">
            <p className="font-medium text-clinical-navy">
              MedLab Secure Medical Records Sharing System
            </p>
            <p>
              Shared materials are time-limited and access is monitored. Do not redistribute without patient consent.
            </p>
          </div>
        </footer>
      </div>
    </QueryProvider>
  );
}
