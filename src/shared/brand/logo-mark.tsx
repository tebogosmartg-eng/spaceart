import { cn } from "@/shared/lib/utils";

export type LogoMarkVariant = "default" | "mono-light" | "mono-dark";

interface LogoMarkProps {
  className?: string;
  size?: number;
  variant?: LogoMarkVariant;
}

const fills = {
  default: { top: "#000000", bottom: "var(--brand-orange)", gap: "var(--background)" },
  "mono-light": { top: "#ffffff", bottom: "#ffffff", gap: "transparent" },
  "mono-dark": { top: "#000000", bottom: "#000000", gap: "transparent" },
} as const;

/** Geometric interlocking S — angular hooks, premium orange base */
export function LogoMark({
  className,
  size = 32,
  variant = "default",
}: LogoMarkProps) {
  const { top, bottom, gap } = fills[variant];

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        d="M10 8h22l6 10H20l-6 10h18l6 10H10l-6-10h16l6-10H10V8z"
        fill={top}
      />
      <path
        d="M38 40H16l-6-10h18l6-10H22l-6-10h18l6 10H32l6 10H38v10z"
        fill={bottom}
      />
      {variant === "default" && (
        <path
          d="M26 22l-5 8h10l-5-8z"
          fill={gap}
        />
      )}
    </svg>
  );
}
