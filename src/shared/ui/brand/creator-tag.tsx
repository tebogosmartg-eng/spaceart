import { BadgeCheck, Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type CreatorTagVariant = "verified" | "featured" | "trending" | "new";

interface CreatorTagProps {
  variant: CreatorTagVariant;
  className?: string;
}

const config: Record<
  CreatorTagVariant,
  { label: string; icon?: React.ComponentType<{ className?: string }>; className: string }
> = {
  verified: {
    label: "Verified",
    icon: BadgeCheck,
    className: "border-accent/25 bg-accent/12 text-accent",
  },
  featured: {
    label: "Featured",
    icon: Sparkles,
    className: "border-accent/30 bg-accent/15 text-accent",
  },
  trending: {
    label: "Trending",
    icon: Sparkles,
    className: "border-accent/40 bg-accent text-white",
  },
  new: {
    label: "New",
    className: "border-white/12 bg-white/5 text-foreground",
  },
};

export function CreatorTag({ variant, className }: CreatorTagProps) {
  const { label, icon: Icon, className: styles } = config[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide backdrop-blur-sm",
        styles,
        className
      )}
    >
      {Icon && <Icon className="size-3 shrink-0" aria-hidden />}
      {label}
    </span>
  );
}
