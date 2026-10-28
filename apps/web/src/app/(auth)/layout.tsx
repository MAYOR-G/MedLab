import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800 p-4 sm:p-6 select-none relative">
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header: Brand */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 shrink-0">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-1.5 leading-none">
              <span>MedLab</span>
              <span className="text-[10px] font-bold text-primary bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Vault
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Encrypted Family Health</p>
          </div>
        </Link>

        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 text-[11px] font-semibold text-slate-600 shadow-2xs">
          <Lock className="h-3.5 w-3.5 text-emerald-600" />
          <span>Zero-Knowledge Encryption</span>
        </div>
      </header>

      {/* Center Stage: Auth / Onboarding Card (Fits within viewport) */}
      <main className="w-full max-w-md mx-auto my-auto z-10 flex flex-col justify-center">
        {children}
      </main>

      {/* Bottom Footer */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 z-10 shrink-0 border-t border-slate-100 pt-3">
        <p>© {new Date().getFullYear()} MedLab Health Vault. All health records are strictly private.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-slate-600 transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
