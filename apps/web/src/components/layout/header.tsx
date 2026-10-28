"use client";

import React from "react";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 transition-colors shadow-2xs">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left Side: Page Title & Subtitle */}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight truncate">
            {title || "MedLab Vault"}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right Side: Sleek Profile Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
