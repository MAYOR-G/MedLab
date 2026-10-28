"use client";

import React from "react";
import Link from "next/link";
import {
  Share2,
  ShieldCheck,
  Clock,
  Lock,
  Plus,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ShareLinksTable } from "@/features/sharing/share-links-table";

export default function SharesPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Secure Share Links"
        subtitle="Monitor and manage time-limited access links shared with physicians and specialists."
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Active & Past Shared Links
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Revoke provider access instantly or review link expiration windows.
            </p>
          </div>
          <Link href="/app/records">
            <Button size="sm" className="font-semibold gap-1.5 shadow-xs">
              <Share2 className="h-4 w-4" />
              <span>Share a Record</span>
            </Button>
          </Link>
        </div>

        {/* Cryptographic Architecture Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Cryptographic Token Protection & Instant Revocation
                </h3>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Share tokens are generated using 32 bytes of cryptographic entropy and stored exclusively as SHA-256 hashes. When a link expires or you click <span className="font-semibold text-red-600">Revoke</span>, external access is invalidated immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 md:pt-0 shrink-0">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>24h – 7d Window</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                <span>Isolated Token Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Share Links Table */}
        <section className="space-y-3">
          <ShareLinksTable />
        </section>
      </main>
    </div>
  );
}
