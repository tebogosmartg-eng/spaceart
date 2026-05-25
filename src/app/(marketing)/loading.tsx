import { Skeleton } from "@/components/ui/skeleton";
import { Section } from "@/shared/ui/section";
import { MarketplaceFeedSkeleton } from "@/shared/ui/marketplace-feed-skeleton";

export default function MarketingLoading() {
  return (
    <div aria-busy="true" aria-label="Loading content">
      <Section className="!py-0" containerClassName="!max-w-7xl">
        <div className="flex min-h-[70vh] flex-col justify-center py-16">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-6 h-16 w-full max-w-3xl md:h-20" />
          <Skeleton className="mt-4 h-16 w-3/4 max-w-2xl md:h-20" />
          <Skeleton className="mt-8 h-5 w-full max-w-xl" />
          <Skeleton className="mt-3 h-5 w-4/5 max-w-lg" />
          <div className="mt-10 flex flex-wrap gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
          <div className="mt-12 flex gap-4">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
        </div>
      </Section>
      <MarketplaceFeedSkeleton />
    </div>
  );
}
