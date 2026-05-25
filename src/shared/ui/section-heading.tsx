import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: string;
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  size?: "default" | "lg";
}

export function SectionHeading({
  title,
  description,
  eyebrow,
  href,
  linkLabel = "View all",
  className,
  size = "default",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        {eyebrow && (
          <p
            className={cn(
              "text-eyebrow text-accent",
              size === "lg" ? "mb-4" : "mb-3"
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={cn(
            "text-cinematic text-balance tracking-tight",
            size === "lg"
              ? "max-w-4xl text-3xl md:text-[2.75rem] md:leading-[1.12]"
              : "text-2xl md:text-3xl"
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "max-w-2xl leading-relaxed text-muted-foreground",
              size === "lg"
                ? "mt-5 text-base md:max-w-3xl md:text-lg md:leading-[1.65]"
                : "mt-3 text-sm md:text-base md:leading-relaxed"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-brand hover:text-accent"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
