"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  adminViewModes,
  type AdminViewMode,
} from "@/shared/config/admin-navigation";

function resolveActiveView(pathname: string): AdminViewMode {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/dashboard")) return "creator";
  return "marketplace";
}

interface AdminModeSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function AdminModeSwitcher({
  className,
  compact = false,
}: AdminModeSwitcherProps) {
  const pathname = usePathname();
  const active = resolveActiveView(pathname);

  return (
    <div
      className={cn(
        "inline-flex rounded-xl border border-white/10 bg-card/50 p-1 backdrop-blur-md",
        compact && "w-full flex-col sm:flex-row sm:w-auto",
        className
      )}
      role="tablist"
      aria-label="Workspace view"
    >
      {adminViewModes.map((mode) => (
        <Link
          key={mode.id}
          href={mode.href}
          role="tab"
          aria-selected={active === mode.id}
          title={mode.description}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-brand sm:text-sm",
            active === mode.id
              ? "bg-accent/15 text-accent shadow-sm ring-1 ring-accent/20"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            compact && "text-center"
          )}
        >
          {mode.label}
        </Link>
      ))}
    </div>
  );
}
