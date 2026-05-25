import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/domains/categories/queries/get-categories";
import { getCreativesByCategory } from "@/domains/creatives/queries/get-creatives";
import { getPublishedListings } from "@/domains/listings/queries/get-listings";
import { CreativeCard } from "@/shared/ui/creative-card";
import { ListingCard } from "@/shared/ui/listing-card";
import { Container } from "@/shared/ui/container";
import { PageHeader } from "@/shared/ui/page-header";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };
  return { title: category.name, description: category.description ?? undefined };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [listings, creatives] = await Promise.all([
    getPublishedListings({ categorySlug: slug, limit: 24 }),
    getCreativesByCategory(slug, 12),
  ]);

  return (
    <Container>
      <PageHeader
        title={category.name}
        description={category.description ?? undefined}
      />

      {creatives.length > 0 && (
        <section className="mb-16">
          <h2 className="font-heading text-2xl font-bold">Creatives</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {creatives.map((creative) => (
              <CreativeCard key={creative.id} creative={creative} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-heading text-2xl font-bold">Listings</h2>
      {listings.length > 0 ? (
        <div className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {listings.map((listing) => (
            <div key={listing.id} className="mb-6 break-inside-avoid">
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-muted-foreground">
          No listings in this category yet.
        </p>
      )}
      </section>
    </Container>
  );
}
