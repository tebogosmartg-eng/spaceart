"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "./admin-sidebar";
import { AdminModeSwitcher } from "./admin-mode-switcher";
import {
  AdminCommandPalette,
  useAdminCommandPalette,
} from "./admin-command-palette";
import { ModerationToastProvider } from "./moderation-toast";
import type { UserRole } from "@/shared/types/database";

interface AdminShellClientProps {
  children: React.ReactNode;
  currentPath: string;
  role: UserRole | string;
  roleLabel: string;
  pendingCounts?: {
    pendingCreatives: number;
    pendingListings: number;
  };
}

export function AdminShellClient({
  children,
  currentPath,
  role,
  roleLabel,
  pendingCounts,
}: AdminShellClientProps) {
  const router = useRouter();
  const { open, setOpen } = useAdminCommandPalette();

  useEffect(() => {
    const shortcuts: Record<string, string> = {
      o: "/admin",
      c: "/admin/creators?status=pending",
      l: "/admin/listings?status=pending_review",
      r: "/admin/reviews",
      a: "/admin/analytics",
    };
    let pending = false;

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key.toLowerCase() === "g") {
        pending = true;
        return;
      }
      if (pending && shortcuts[e.key.toLowerCase()]) {
        e.preventDefault();
        router.push(shortcuts[e.key.toLowerCase()]);
        pending = false;
        return;
      }
      pending = false;
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <ModerationToastProvider>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar
          currentPath={currentPath}
          role={role}
          pendingCounts={pendingCounts}
          onOpenCommandPalette={() => setOpen(true)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/8 bg-background/70 backdrop-blur-2xl">
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <div>
                <p className="text-eyebrow text-muted-foreground">SPACEART</p>
                <p className="font-heading text-sm font-semibold tracking-tight">
                  {roleLabel} Console
                </p>
              </div>
              <AdminModeSwitcher />
            </div>
          </header>
          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
      <AdminCommandPalette
        open={open}
        onOpenChange={setOpen}
        pendingCounts={pendingCounts}
      />
    </ModerationToastProvider>
  );
}
