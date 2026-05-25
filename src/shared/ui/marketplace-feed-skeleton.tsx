import { Skeleton } from "@/components/ui/skeleton";
import { Section } from "@/shared/ui/section";
import { CreativeGridSkeleton } from "@/shared/ui/creative-card-skeleton";
import { ListingMasonrySkeleton } from "@/shared/ui/listing-card-skeleton";

export function MarketplaceFeedSkeleton() {
  return (
    <>
      <Section id="featured">
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="mt-2 h-5 w-96 max-w-full" />
        <div className="mt-12">
          <CreativeGridSkeleton count={6} />
        </div>
      </Section>
      <Section id="trending" className="!pt-0">
        <Skeleton className="h-10 w-56 max-w-full" />
        <Skeleton className="mt-2 h-5 w-80 max-w-full" />
        <div className="mt-12">
          <ListingMasonrySkeleton count={6} />
        </div>
      </Section>
      <Section className="!py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </Section>
    </>
  );
}
