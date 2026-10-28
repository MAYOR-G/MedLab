"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Activity,
  Share2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { label: "Overview", href: "/app", icon: LayoutDashboard },
  { label: "Records", href: "/app/records", icon: FileText },
  { label: "Trends", href: "/app/trends", icon: Activity },
  { label: "Shares", href: "/app/shares", icon: Share2 },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md pb-safe">
      <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
        {mobileItems.map((item) => {
          const isActive =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors select-none",
                isActive
                  ? "text-primary font-bold"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 mb-1 transition-transform",
                  isActive ? "text-primary scale-110" : "text-slate-400"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
