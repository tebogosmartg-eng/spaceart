import * as React from "react";
import { cn } from "@/shared/lib/utils";

interface PremiumCardProps extends React.ComponentProps<"div"> {
  glow?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function PremiumCard({
  className,
  glow = false,
  padding = "md",
  children,
  ...props
}: PremiumCardProps) {
  return (
    <div
      data-slot="premium-card"
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-card/95 to-card/70 backdrop-blur-md transition-brand",
        "hover:border-white/12 hover:shadow-md hover:shadow-black/25",
        glow && "glow-accent-hover",
        padding === "sm" && "p-4",
        padding === "md" && "p-6 md:p-8",
        padding === "lg" && "p-8 md:p-10",
        className
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      >
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-accent/8 blur-3xl" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
