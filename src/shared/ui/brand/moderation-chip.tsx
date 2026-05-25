import { cn } from "@/shared/lib/utils";

export type ModerationStatus =
  | "pending"
  | "pending_review"
  | "approved"
  | "published"
  | "rejected"
  | "draft"
  | "archived";

const chipStyles: Record<ModerationStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  pending_review: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rejected: "border-red-500/35 bg-red-500/10 text-red-300",
  draft: "border-white/10 bg-white/5 text-muted-foreground",
  archived: "border-white/10 bg-white/5 text-muted-foreground",
};

const chipLabels: Record<ModerationStatus, string> = {
  pending: "Pending",
  pending_review: "In review",
  approved: "Approved",
  published: "Live",
  rejected: "Rejected",
  draft: "Draft",
  archived: "Archived",
};

interface ModerationChipProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export function ModerationChip({
  status,
  className,
  size = "sm",
}: ModerationChipProps) {
  const key = status as ModerationStatus;
  const styles = chipStyles[key] ?? chipStyles.draft;
  const label = chipLabels[key] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium capitalize",
        size === "sm" && "px-2.5 py-0.5 text-[11px]",
        size === "md" && "px-3 py-1 text-xs",
        styles,
        className
      )}
    >
      <span
        className={cn(
          "mr-1.5 inline-block size-1.5 rounded-full",
          status === "published" || status === "approved"
            ? "bg-emerald-400"
            : status === "rejected"
              ? "bg-red-400"
              : status === "pending" || status === "pending_review"
                ? "bg-amber-400"
                : "bg-muted-foreground/50"
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
