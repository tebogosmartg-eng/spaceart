import { ModerationChip } from "@/shared/ui/brand/moderation-chip";
import { cn } from "@/shared/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

/** @deprecated Use ModerationChip — re-exported for compatibility */
export function StatusBadge({ status, className, size = "sm" }: StatusBadgeProps) {
  return (
    <ModerationChip status={status} className={cn(className)} size={size} />
  );
}
