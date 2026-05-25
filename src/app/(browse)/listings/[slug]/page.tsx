import Image from "next/image";
import { notFound } from "next/navigation";
import { getListingBySlug } from "@/domains/listings/queries/get-listings";
import { Container } from "@/shared/ui/container";
import { WhatsAppButton } from "@/shared/ui/whatsapp-button";
import { StickyWhatsAppBar } from "@/shared/ui/sticky-whatsapp-bar";
import { formatPrice } from "@/shared/lib/utils";
interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Listing Not Found" };
  return {
    title: listing.title,
    description: listing.description ?? undefined,
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const creative = listing.creatives;
  const media = listing.listing_media?.sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <Container>
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="space-y-4">
          {media && media.length > 0 ? (
            media.map((item, i) => (
              <div
                key={item.id}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/8"
              >
                <Image
                  src={item.url}
                  alt={`${listing.title} ${i + 1}`}
                  fill
                  priority={i === 0}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ))
          ) : (
            <div className="aspect-[4/3] rounded-xl bg-card" />
          )}
        </div>

        <div>
          {listing.categories && (
            <p className="text-sm font-medium text-accent">
              {listing.categories.name}
            </p>
          )}
          <h1 className="mt-2 font-heading text-4xl font-bold">{listing.title}</h1>
          {creative && (
            <p className="mt-2 text-muted-foreground">{creative.display_name}</p>
          )}
          <p className="mt-4 text-xl font-medium">
            {formatPrice(listing.price_from_cents, listing.price_label)}
          </p>
          {listing.description && (
            <p className="mt-8 leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
          )}
          {creative?.whatsapp_number && (
            <div className="mt-10">
              <WhatsAppButton
                phone={creative.whatsapp_number}
                creativeName={creative.display_name}
                listingTitle={listing.title}
              />
            </div>
          )}
        </div>
      </div>

      {creative?.whatsapp_number && (
        <StickyWhatsAppBar
          phone={creative.whatsapp_number}
          creativeName={creative.display_name}
          listingTitle={listing.title}
        />
      )}
      <div className="h-20 md:hidden" aria-hidden />
    </Container>
  );
}
