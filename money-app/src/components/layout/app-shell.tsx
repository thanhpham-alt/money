"use client";

import { TopNav } from "@/components/layout/sidebar";
import { Toaster } from "sonner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="app-canvas flex h-dvh max-h-dvh flex-col overflow-hidden">
        <TopNav />
        <main className="relative min-h-0 min-w-0 flex-1">
          <div className="absolute inset-0 flex flex-col overflow-auto">{children}</div>
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </>
  );
}
