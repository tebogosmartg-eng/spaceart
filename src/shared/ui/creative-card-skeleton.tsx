import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

export function CreativeCardSkeleton({
  variant = "default",
  className,
}: {
  variant?: "default" | "featured";
  className?: string;
}) {
  return (
    <Skeleton
      className={cn(
        "w-full rounded-2xl",
        variant === "featured" ? "aspect-[4/5]" : "aspect-[3/4]",
        className
      )}
    />
  );
}

export function CreativeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CreativeCardSkeleton key={i} />
      ))}
    </div>
  );
}
