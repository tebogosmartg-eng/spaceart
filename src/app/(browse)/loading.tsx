import { Container } from "@/shared/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { CreativeGridSkeleton } from "@/shared/ui/creative-card-skeleton";
import { ListingMasonrySkeleton } from "@/shared/ui/listing-card-skeleton";

export default function BrowseLoading() {
  return (
    <Container aria-busy="true" aria-label="Loading content">
      <Skeleton className="h-12 w-72 max-w-full" />
      <Skeleton className="mt-4 h-5 w-96 max-w-full" />
      <Skeleton className="mt-10 h-28 w-full rounded-2xl" />
      <div className="mt-12">
        <CreativeGridSkeleton count={6} />
      </div>
      <div className="mt-16">
        <ListingMasonrySkeleton count={3} />
      </div>
    </Container>
  );
}
