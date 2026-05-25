import { Skeleton } from "@/components/ui/skeleton";

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

export function ListingMasonrySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mb-6 break-inside-avoid">
          <ListingCardSkeleton />
        </div>
      ))}
    </div>
  );
}
