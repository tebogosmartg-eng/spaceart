import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for auth/actions slot while session resolves (non-blocking header). */
export function SiteHeaderAuthSkeleton() {
  return (
    <div className="flex items-center gap-2 md:gap-3" aria-hidden>
      <Skeleton className="hidden h-9 w-20 sm:block" />
      <Skeleton className="h-9 w-28" />
      <Skeleton className="size-9 md:hidden" />
    </div>
  );
}
