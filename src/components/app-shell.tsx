"use client";

import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="garage-page-bg flex-1 container py-6 pb-24 md:pb-8">{children}</main>
      <div className="hidden md:block">
        <SiteFooter />
      </div>
      <BottomNav />
    </div>
  );
}
