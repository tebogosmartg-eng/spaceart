"use client";

import Link from "next/link";
import { Menu, Command } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/shared/brand";
import {
  adminNav,
  isAdminNavActive,
} from "@/shared/config/admin-navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AdminRoleBadge } from "./admin-role-badge";
import type { UserRole } from "@/shared/types/database";

interface AdminSidebarProps {
  currentPath: string;
  role: UserRole | string;
  pendingCounts?: {
    pendingCreatives: number;
    pendingListings: number;
  };
  onOpenCommandPalette?: () => void;
}

export function AdminSidebar({
  currentPath,
  role,
  pendingCounts,
  onOpenCommandPalette,
}: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="mb-6 hidden lg:block">
        <Logo href="/admin" variant="full" compact markSize={22} wordmarkSize="sm" />
      </div>
      <AdminRoleBadge role={role} showAdminMode={role === "admin"} className="mb-6" />
      <p className="text-eyebrow mb-3 text-muted-foreground">Operations</p>
      <nav className="flex flex-col gap-0.5" aria-label="Admin">
        {adminNav.map((item) => {
          const active = isAdminNavActive(item.href, currentPath);
          const badge =
            item.badgeKey === "pendingCreatives"
              ? pendingCounts?.pendingCreatives
              : item.badgeKey === "pendingListings"
                ? pendingCounts?.pendingListings
                : undefined;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-brand",
                active
                  ? "bg-accent/10 font-medium text-accent ring-1 ring-accent/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {badge != null && badge > 0 && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium tabular-nums text-accent">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 space-y-2 border-t border-white/8 pt-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onOpenCommandPalette}
        >
          <Command className="size-4" />
          Command palette
          <kbd className="ml-auto hidden rounded border border-white/10 px-1 text-[10px] sm:inline">
            ⌘K
          </kbd>
        </Button>
        <Link
          href="/dashboard"
          className="block rounded-xl px-3 py-2 text-sm text-muted-foreground transition-brand hover:bg-white/5 hover:text-foreground"
          onClick={() => setMobileOpen(false)}
        >
          ← Creator Studio
        </Link>
        <Link
          href="/"
          className="block rounded-xl px-3 py-2 text-sm text-muted-foreground transition-brand hover:bg-white/5 hover:text-foreground"
          onClick={() => setMobileOpen(false)}
        >
          Marketplace view
        </Link>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/8 bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo href="/admin" variant="mark" markSize={24} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open admin menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[min(100%,18rem)] overflow-y-auto border-r border-white/8 bg-card/95 p-5 shadow-2xl backdrop-blur-2xl lg:hidden">
            {navContent}
          </aside>
        </>
      )}

      <aside className="hidden w-60 shrink-0 border-r border-white/8 bg-card/30 lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:flex-col lg:overflow-y-auto lg:p-5">
        {navContent}
      </aside>
    </>
  );
}
