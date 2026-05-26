import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface DiscoveryCtaProps {
  href: string;
  label: string;
  description?: string;
  className?: string;
}

/**
 * Bottom continuation CTA — encourages users to continue browsing
 * after viewing a profile or detail page.
 */
export function DiscoveryCta({
  href,
  label,
  description,
  className,
}: DiscoveryCtaProps) {
  return (
    <section className={cn("mt-20 md:mt-28", className)}>
      <Link
        href={href}
        className="group flex items-center justify-between rounded-2xl border border-white/8 bg-card/60 px-6 py-5 transition-brand hover:border-accent/20 hover:bg-card md:px-8 md:py-6"
      >
        <div className="flex items-center gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent/15">
            <Compass className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold tracking-tight text-foreground md:text-base">
              {label}
            </p>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                {description}
              </p>
            )}
          </div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-accent" />
      </Link>
    </section>
  );
}
