import Link from "next/link";
import Image from "next/image";
import { cn } from "@/shared/lib/utils";
import { LogoMark, type LogoMarkVariant } from "./logo-mark";
import { LogoWordmark, type LogoWordmarkVariant } from "./logo-wordmark";

/** Cleaned production assets — transparent background, RGBA. */
const BRAND_LOGO_DARK = "/Brands/spaceart-logo-dark.png";
const BRAND_LOGO_LIGHT = "/Brands/spaceart-logo.png";

/** Intrinsic ratio of the cleaned asset (410 × 303). */
const LOGO_ASPECT = 410 / 303;

export type LogoVariant = "full" | "mark" | "wordmark";
export type LogoColor = LogoMarkVariant;

interface LogoProps {
  variant?: LogoVariant;
  color?: LogoColor;
  href?: string;
  className?: string;
  markSize?: number;
  wordmarkSize?: "sm" | "md" | "lg";
  showTagline?: boolean;
  /** Compact mark + wordmark for navbars */
  compact?: boolean;
}

const brandImageHeight = {
  sm: 40,
  md: 56,
  lg: 72,
} as const;

export function Logo({
  variant = "full",
  color = "default",
  href,
  className,
  markSize = 28,
  wordmarkSize = "md",
  showTagline = false,
  compact = false,
}: LogoProps) {
  const useBrandImage = color === "default" && variant !== "wordmark";

  let content: React.ReactNode;

  if (useBrandImage) {
    const h = compact
      ? Math.max(markSize + 12, 42)
      : brandImageHeight[wordmarkSize] ?? 56;
    const w = Math.round(h * LOGO_ASPECT);

    content = (
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center",
          className
        )}
      >
        <Image
          src={BRAND_LOGO_DARK}
          alt="SPACEART — Culture Meets Commerce"
          width={w}
          height={h}
          className="object-contain drop-shadow-[0_0_1px_rgba(255,255,255,0.08)]"
          priority
          quality={90}
          sizes={`${w}px`}
        />
      </span>
    );
  } else {
    content = (
      <span
        className={cn(
          "inline-flex items-center",
          compact ? "gap-3" : "gap-3.5",
          variant === "wordmark" && "flex-col items-start gap-0",
          className
        )}
      >
        {(variant === "full" || variant === "mark") && (
          <LogoMark size={markSize} variant={color} />
        )}
        {(variant === "full" || variant === "wordmark") && (
          <LogoWordmark
            variant={color as LogoWordmarkVariant}
            size={wordmarkSize}
            showTagline={showTagline && variant === "wordmark"}
          />
        )}
      </span>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex rounded-sm transition-brand hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="SPACEART home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
