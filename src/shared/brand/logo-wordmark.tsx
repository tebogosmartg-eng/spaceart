import { cn } from "@/shared/lib/utils";

export type LogoWordmarkVariant = "default" | "mono-light" | "mono-dark";

interface LogoWordmarkProps {
  className?: string;
  variant?: LogoWordmarkVariant;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

const textColors = {
  default: "text-foreground",
  "mono-light": "text-white",
  "mono-dark": "text-black",
} as const;

const accentColors = {
  default: "text-accent",
  "mono-light": "text-white",
  "mono-dark": "text-black",
} as const;

const sizes = {
  sm: "text-[0.9375rem] tracking-[0.08em]",
  md: "text-lg tracking-[0.1em] md:text-xl",
  lg: "text-2xl tracking-[0.12em] md:text-3xl",
} as const;

/** Chevron A — signature brand letterform */
function ChevronA({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block align-baseline leading-none", className)}
      aria-hidden
    >
      <svg
        viewBox="0 0 12 14"
        className="inline-block h-[0.78em] w-[0.5em]"
        fill="currentColor"
        aria-hidden
      >
        <path d="M6 0L12 14H0L6 0z" />
      </svg>
    </span>
  );
}

export function LogoWordmark({
  className,
  variant = "default",
  showTagline = false,
  size = "md",
}: LogoWordmarkProps) {
  return (
    <div className={cn("inline-flex flex-col", className)}>
      <span
        className={cn(
          "font-brand font-semibold uppercase",
          sizes[size],
          textColors[variant]
        )}
      >
        <span>SPACE</span>
        <ChevronA className={cn("mx-[0.06em]", accentColors[variant])} />
        <span>RT</span>
      </span>
      {showTagline && (
        <span
          className={cn(
            "text-tagline mt-1.5 text-center text-muted-foreground",
            variant === "mono-light" && "text-white/70",
            variant === "mono-dark" && "text-black/60"
          )}
        >
          Culture Meets Commerce
        </span>
      )}
    </div>
  );
}
