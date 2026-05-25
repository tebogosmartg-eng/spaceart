import { Suspense } from "react";
import { Search } from "lucide-react";
import { getCategories } from "@/domains/categories/queries/get-categories";
import { searchAll } from "@/domains/search/queries/search";
import { DiscoveryFilters } from "@/domains/search/components/discovery-filters";
import { CreativeCard } from "@/shared/ui/creative-card";
import { ListingCard } from "@/shared/ui/listing-card";
import { Container } from "@/shared/ui/container";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionHeading } from "@/shared/ui/section-heading";
import { EmptyState } from "@/shared/ui/empty-state";
export const metadata = {
  title: "Search",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    province?: string;
    sort?: string;
  }>;
}

function FiltersFallback() {
  return <div className="h-32 animate-pulse rounded-2xl bg-muted/50" />;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [categories, results] = await Promise.all([
    getCategories(),
    searchAll(params),
  ]);
  const total = results.creatives.length + results.listings.length;
  const hasFilters = Boolean(
    params.q || params.category || params.province || (params.sort && params.sort !== "newest")
  );

  return (
    <Container>
      <PageHeader
        title="Discover"
        description="Search curated creatives and published listings across SPACEART."
      />

      <Suspense fallback={<FiltersFallback />}>
        <DiscoveryFilters categories={categories} basePath="/search" />
      </Suspense>

      {total > 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          {results.creatives.length} creative
          {results.creatives.length === 1 ? "" : "s"} · {results.listings.length} listing
          {results.listings.length === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-12 space-y-20">
        <section>
          <SectionHeading title="Creatives" size="default" />
          {results.creatives.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.creatives.map((creative) => (
                <CreativeCard key={creative.id} creative={creative} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-8"
              title="No creatives found"
              description={
                hasFilters
                  ? "Try different keywords or clear filters."
                  : "Search by name, city, or creative discipline."
              }
              action={{ label: "Browse creatives", href: "/creatives" }}
            />
          )}
        </section>

        <section>
          <SectionHeading title="Listings" size="default" />
          {results.listings.length > 0 ? (
            <div className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3">
              {results.listings.map((listing) => (
                <div key={listing.id} className="mb-6 break-inside-avoid">
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-8"
              title="No listings found"
              description={
                hasFilters
                  ? "Adjust filters or explore all published listings."
                  : "Listings appear when creatives publish approved work."
              }
              action={{ label: "Browse listings", href: "/listings" }}
            />
          )}
        </section>

        {total === 0 && hasFilters && (
          <EmptyState
            icon={Search}
            title="No results for this search"
            description="Broaden your query or remove active filters."
            action={{ label: "Clear search", href: "/search" }}
          />
        )}
      </div>
    </Container>
  );
}
