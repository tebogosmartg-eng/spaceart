import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingBySlug } from "@/domains/listings/queries/get-listings";
import { Container } from "@/shared/ui/container";
import { BrowseBreadcrumb } from "@/shared/ui/browse-breadcrumb";
import { DiscoveryCta } from "@/shared/ui/discovery-cta";
import { WhatsAppButton } from "@/shared/ui/whatsapp-button";
import { StickyWhatsAppBar } from "@/shared/ui/sticky-whatsapp-bar";
import { ShareActions } from "@/shared/ui/share-actions";
import { formatPrice } from "@/shared/lib/utils";
interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Listing Not Found" };

  const title = listing.title;
  const description =
    listing.description ?? `${title} — available on SPACEART`;
  const imageUrl = [...(listing.listing_media ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | SPACEART`,
      description,
      url: `/listings/${slug}`,
      type: "website",
      ...(imageUrl && { images: [{ url: imageUrl, alt: title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | SPACEART`,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const creative = listing.creatives;
  const media = [...(listing.listing_media ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <Container>
      <BrowseBreadcrumb href="/listings" label="Back to listings" />

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {media && media.length > 0 ? (
            media.map((item, i) => (
              <div
                key={item.id}
                className={`relative overflow-hidden rounded-xl border border-white/8 ${
                  i === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"
                }`}
              >
                <Image
                  src={item.url}
                  alt={`${listing.title} ${i + 1}`}
                  fill
                  priority={i === 0}
                  className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                  sizes={
                    i === 0
                      ? "(max-width: 1024px) 100vw, 50vw"
                      : "(max-width: 768px) 50vw, 25vw"
                  }
                />
              </div>
            ))
          ) : (
            <div className="col-span-2 aspect-[4/3] rounded-xl bg-card" />
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
            <p className="mt-2 text-muted-foreground">
              by{" "}
              <Link
                href={`/creatives/${creative.slug}`}
                className="text-foreground underline-offset-4 transition-brand hover:text-accent hover:underline"
              >
                {creative.display_name}
              </Link>
            </p>
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

          <div className="mt-6 border-t border-white/8 pt-6">
            <ShareActions
              contentType="listing"
              slug={slug}
              title={listing.title}
            />
          </div>
        </div>
      </div>

      <DiscoveryCta
        href="/listings"
        label="Browse more listings"
        description="Explore services and offerings from curated African creatives."
      />

      {creative?.whatsapp_number && (
        <StickyWhatsAppBar
          phone={creative.whatsapp_number}
          creativeName={creative.display_name}
          listingTitle={listing.title}
          slug={slug}
          contentType="listing"
        />
      )}
      <div className="h-20 md:hidden" aria-hidden />
    </Container>
  );
}
