import { notFound } from "next/navigation";
import { getCreativeBySlug } from "@/domains/creatives/queries/get-creatives";
import { getListingsByCreativeId } from "@/domains/listings/queries/get-listings";
import { CreativeProfileHero } from "@/domains/creatives/components/creative-profile-hero";
import { Container } from "@/shared/ui/container";
import { ListingCard } from "@/shared/ui/listing-card";
import { EmptyState } from "@/shared/ui/empty-state";
import { SectionHeading } from "@/shared/ui/section-heading";
import { StickyWhatsAppBar } from "@/shared/ui/sticky-whatsapp-bar";
import { MotionReveal, StaggerChildren, StaggerItem } from "@/shared/ui/motion-reveal";
import { siteConfig } from "@/shared/config/site";
import { LayoutGrid } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const creative = await getCreativeBySlug(slug);
  if (!creative) return { title: "Creative Not Found" };

  const title = creative.display_name;
  const description =
    creative.bio ?? `${title} — creator on ${siteConfig.name}`;
  const imageUrl = creative.avatar_url?.startsWith("http")
    ? creative.avatar_url
    : creative.cover_image_url?.startsWith("http")
      ? creative.cover_image_url
      : undefined;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: `/creatives/${slug}`,
      type: "profile",
      ...(imageUrl && { images: [{ url: imageUrl, alt: title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function CreativeProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const creative = await getCreativeBySlug(slug);
  if (!creative) notFound();

  const listings = await getListingsByCreativeId(creative.id);

  return (
    <Container className="pb-24 md:pb-12">
      <MotionReveal>
        <CreativeProfileHero creative={creative} listingCount={listings.length} />
      </MotionReveal>

      <section className="mt-16 md:mt-20">
        <SectionHeading
          title="Work & listings"
          description="Services and offerings from this creative."
        />
        {listings.length > 0 ? (
          <StaggerChildren className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing, i) => (
              <StaggerItem key={listing.id}>
                <ListingCard listing={listing} priority={i < 3} />
              </StaggerItem>
            ))}
          </StaggerChildren>
        ) : (
          <EmptyState
            className="mt-10"
            icon={LayoutGrid}
            title="No public listings yet"
            description="This creative hasn't published listings on the marketplace. Check back soon or reach out directly."
            action={
              creative.whatsapp_number
                ? undefined
                : { label: "Explore creatives", href: "/creatives" }
            }
          />
        )}
      </section>

      {creative.whatsapp_number && (
        <>
          <StickyWhatsAppBar
            phone={creative.whatsapp_number}
            creativeName={creative.display_name}
            slug={slug}
            contentType="portfolio"
          />
          <div className="h-20 md:hidden" aria-hidden />
        </>
      )}
    </Container>
  );
}
