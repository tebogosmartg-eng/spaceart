import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface BrowseBreadcrumbProps {
  href: string;
  label: string;
  className?: string;
}

/**
 * Lightweight back-navigation breadcrumb for browse pages.
 * Preserves browser-back behavior — this is a standard link, not a router action.
 */
export function BrowseBreadcrumb({
  href,
  label,
  className,
}: BrowseBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-6 md:mb-8", className)}>
      <Link
        href={href}
        className="group inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium text-muted-foreground transition-brand hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="flex size-7 items-center justify-center rounded-md bg-muted/60 transition-colors group-hover:bg-accent/15 group-hover:text-accent">
          <ArrowLeft className="size-3.5" />
        </span>
        {label}
      </Link>
    </nav>
  );
}
