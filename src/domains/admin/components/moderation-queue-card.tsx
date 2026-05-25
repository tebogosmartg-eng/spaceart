"use client";

import Image from "next/image";
import { cn } from "@/shared/lib/utils";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ModerationQueueCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  status: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  note?: string | null;
  className?: string;
}

export function ModerationQueueCard({
  title,
  subtitle,
  imageUrl,
  status,
  meta,
  actions,
  note,
  className,
}: ModerationQueueCardProps) {
  const hasImage = imageUrl?.startsWith("http");

  return (
    <article
      className={cn(
        "surface-card flex flex-col gap-4 p-4 transition-colors hover:border-white/12 sm:flex-row sm:items-center sm:gap-6 sm:p-5",
        className
      )}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
        {hasImage ? (
          <Image
            src={imageUrl!}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
            unoptimized={imageUrl!.includes("cloudinary")}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-accent/15 to-muted text-lg font-semibold text-muted-foreground">
            {title.charAt(0)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-lg font-semibold tracking-tight">{title}</h3>
          <StatusBadge status={status} />
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
        {meta}
        {note && <p className="mt-2 text-sm text-red-400/90">{note}</p>}
      </div>

      {actions && (
        <div className="flex flex-wrap gap-2 sm:shrink-0">{actions}</div>
      )}
    </article>
  );
}

export function ModerationQueueCardSkeleton() {
  return (
    <div className="surface-card flex gap-4 p-5">
      <Skeleton className="size-24 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}
