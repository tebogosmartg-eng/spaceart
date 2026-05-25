import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { LinkButton } from "@/shared/ui/link-button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-card/40 px-8 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground">
          <Icon className="size-6" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="font-heading text-xl font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {action && (
            <LinkButton href={action.href} variant="accent">
              {action.label}
            </LinkButton>
          )}
          {secondaryAction && (
            <LinkButton href={secondaryAction.href} variant="outline">
              {secondaryAction.label}
            </LinkButton>
          )}
        </div>
      )}
    </div>
  );
}

/** Inline empty hint with optional link */
export function EmptyHint({
  children,
  href,
  linkLabel,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}{" "}
      {href && linkLabel && (
        <Link href={href} className="text-accent hover:underline">
          {linkLabel}
        </Link>
      )}
    </p>
  );
}
