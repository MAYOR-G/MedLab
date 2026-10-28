"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Activity,
  Share2,
  Settings,
  Trash2,
  LogOut,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { useSidebar } from "@/components/layout/sidebar-context";
import { useMyProfile, useWorkspace } from "@/features/users/api";
import { createClient } from "@/lib/auth/supabase";

const navItems = [
  { label: "Overview", href: "/app", icon: LayoutDashboard },
  { label: "Medical Records", href: "/app/records", icon: FileText },
  { label: "Biomarker Trends", href: "/app/trends", icon: Activity },
  { label: "Shared Links", href: "/app/shares", icon: Share2 },
  { label: "Trash Vault", href: "/app/trash", icon: Trash2 },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { data: profile } = useMyProfile();
  const { data: workspace } = useWorkspace();

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // offline / demo fallback
    }
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-surface h-screen sticky top-0 select-none z-30 transition-[width] duration-200 ease-in-out shadow-xs",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Brand Header with Single Rock-Solid Toggle Button */}
      <div
        className={cn(
          "h-16 border-b border-border flex items-center px-4 transition-all",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link
          href="/app"
          className={cn(
            "flex items-center gap-2.5 group transition-transform active:scale-95 min-w-0",
            isCollapsed && "justify-center"
          )}
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-700 to-primary flex items-center justify-center text-white shadow-xs shrink-0 ring-1 ring-blue-600/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-base tracking-tight leading-none flex items-center gap-1.5">
                <span>MedLab</span>
                <span className="text-[10px] font-semibold text-primary bg-primary-tint px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Vault
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium truncate max-w-[120px]">
                {workspace?.name || "Family Records"}
              </div>
            </div>
          )}
        </Link>

        {/* Sidebar Toggle Button (Only 1 Single Instance) */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            title="Collapse Sidebar"
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* When collapsed: show expand button directly under header */}
      {isCollapsed && (
        <div className="pt-2 px-3 pb-1 flex justify-center">
          <button
            type="button"
            onClick={toggleSidebar}
            title="Expand Sidebar"
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative",
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60",
                isCollapsed && "justify-center px-0 py-3"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900"
                )}
              />

              {!isCollapsed && (
                <span className="truncate flex-1 tracking-tight">{item.label}</span>
              )}

              {/* Floating Tooltip when collapsed */}
              {isCollapsed && (
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md z-50">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Account */}
      <div className="p-3 border-t border-border bg-slate-50/50">
        <div
          className={cn(
            "flex items-center gap-2.5 p-2 rounded-xl bg-white border border-border/80 shadow-2xs",
            isCollapsed && "justify-center p-1.5"
          )}
        >
          <Avatar
            name={profile?.displayName || "Vault Owner"}
            size="sm"
            className="ring-2 ring-white shadow-2xs shrink-0"
          />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate leading-tight">
                {profile?.displayName || "Vault Owner"}
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                Vault Owner
              </div>
            </div>
          )}
          {!isCollapsed && (
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
