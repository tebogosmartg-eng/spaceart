"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminNav, adminQuickActions } from "@/shared/config/admin-navigation";
import { Search } from "lucide-react";

type PaletteItem = {
  id: string;
  label: string;
  href: string;
  group: string;
  keywords?: string;
};

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingCounts?: {
    pendingCreatives: number;
    pendingListings: number;
  };
}

export function AdminCommandPalette({
  open,
  onOpenChange,
  pendingCounts,
}: AdminCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const items = useMemo<PaletteItem[]>(() => {
    const navItems = adminNav.map((item) => ({
      id: item.href,
      label: item.label,
      href: item.href,
      group: "Navigate",
      keywords: item.description,
    }));
    const actions = adminQuickActions
      .filter((a) => a.href !== "#command")
      .map((a) => ({
        id: a.href,
        label: a.label,
        href: a.href,
        group: "Quick actions",
      }));
    return [...navItems, ...actions];
  }, []);

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      item.keywords?.toLowerCase().includes(q) ||
      item.href.toLowerCase().includes(q)
    );
  });

  const run = useCallback(
    (href: string) => {
      onOpenChange(false);
      setQuery("");
      if (href.startsWith("/")) router.push(href);
    },
    [onOpenChange, router]
  );

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-white/8 px-4 py-3">
          <DialogTitle className="sr-only">Admin command palette</DialogTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search admin actions…"
              className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground">
            <kbd className="rounded border border-white/10 px-1">⌘</kbd>
            <kbd className="ml-0.5 rounded border border-white/10 px-1">K</kbd>
            <span className="mx-2">·</span>
            Esc to close
          </p>
        </DialogHeader>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matching commands
            </li>
          ) : (
            filtered.map((item) => {
              const badge =
                item.href.includes("creators") && pendingCounts
                  ? pendingCounts.pendingCreatives
                  : item.href.includes("listings") && pendingCounts
                    ? pendingCounts.pendingListings
                    : 0;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-brand hover:bg-white/5"
                    onClick={() => run(item.href)}
                  >
                    <span>
                      <span className="font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.group}
                      </span>
                    </span>
                    {badge > 0 && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent tabular-nums">
                        {badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div className="border-t border-white/8 px-4 py-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground" onClick={() => onOpenChange(false)}>
            Marketplace
          </Link>
          {" · "}
          <Link
            href="/dashboard"
            className="hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Creator Studio
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Global ⌘K / Ctrl+K for admin surfaces */
export function useAdminCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}
