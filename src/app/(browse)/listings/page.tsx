import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { getPublishedListings } from "@/domains/listings/queries/get-listings";
import { getCategories } from "@/domains/categories/queries/get-categories";
import { DiscoveryFilters } from "@/domains/search/components/discovery-filters";
import { ListingCard } from "@/shared/ui/listing-card";
import { Container } from "@/shared/ui/container";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState } from "@/shared/ui/empty-state";

export const metadata = {
  title: "Listings",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
  }>;
}

export default async function ListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [listings, categories] = await Promise.all([
    getPublishedListings({
      q: params.q,
      categorySlug: params.category,
      sort: params.sort === "featured" ? "featured" : "newest",
      limit: 24,
    }),
    getCategories(),
  ]);

  return (
    <Container>
      <PageHeader
        title="Browse Listings"
        description="Premium creative services and offerings from approved African creatives."
      />

      <Suspense fallback={<div className="h-28 animate-pulse rounded-2xl bg-muted/50" />}>
        <DiscoveryFilters
          categories={categories}
          basePath="/listings"
          showProvince={false}
        />
      </Suspense>

      {listings.length > 0 ? (
        <>
          <p className="mb-8 text-sm text-muted-foreground">
            {listings.length} listing{listings.length === 1 ? "" : "s"}
          </p>
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            {listings.map((listing, i) => (
              <div key={listing.id} className="mb-6 break-inside-avoid">
                <ListingCard listing={listing} priority={i < 3} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          className="mt-8"
          icon={Sparkles}
          title="No listings found"
          description="Adjust filters or check back as creatives publish new work."
          action={{ label: "Explore creatives", href: "/creatives" }}
        />
      )}
    </Container>
  );
}
