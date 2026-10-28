"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { ActiveMemberProvider } from "@/features/family/active-member-context";
import { FloatingAssistant } from "@/features/assistant/floating-assistant";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ActiveMemberProvider>
        <div className="min-h-screen bg-background flex flex-col lg:flex-row text-text-primary antialiased">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
          <MobileNav />
          {/* Floating Clinical AI Assistant Launcher */}
          <FloatingAssistant />
        </div>
      </ActiveMemberProvider>
    </SidebarProvider>
  );
}
