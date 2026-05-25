import Link from "next/link";
import { getFeaturedCreatives } from "@/domains/creatives/queries/get-creatives";
import { getTrendingListings } from "@/domains/listings/queries/get-listings";
import { getApprovedCreatives } from "@/domains/creatives/queries/get-creatives";
import { CreativeCard } from "@/shared/ui/creative-card";
import { ListingCard } from "@/shared/ui/listing-card";
import { Section } from "@/shared/ui/section";
import { SectionHeading } from "@/shared/ui/section-heading";
import { EmptyState } from "@/shared/ui/empty-state";
import { MotionReveal, StaggerChildren, StaggerItem } from "@/shared/ui/motion-reveal";
import { Users, Sparkles } from "lucide-react";

/** Editorial marketplace sections for the public home feed */
export async function MarketplaceFeed() {
  const [featured, trending, recentCreatives] = await Promise.all([
    getFeaturedCreatives(),
    getTrendingListings(),
    getApprovedCreatives({ limit: 6 }),
  ]);

  const discoverCreatives =
    featured.length > 0 ? featured : recentCreatives;

  return (
    <>
      <Section id="featured">
        <MotionReveal>
          <SectionHeading
            eyebrow="Live ecosystem"
            title="Featured creatives"
            description="Implementation in motion — curated voices demonstrating platform scale and cultural excellence."
            href="/creatives"
            linkLabel="View all creatives"
          />
        </MotionReveal>
        {discoverCreatives.length > 0 ? (
          <StaggerChildren className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {discoverCreatives.slice(0, 6).map((creative, i) => (
              <StaggerItem key={creative.id}>
                <CreativeCard
                  creative={creative}
                  variant="featured"
                  priority={i < 2}
                />
              </StaggerItem>
            ))}
          </StaggerChildren>
        ) : (
          <EmptyState
            className="mt-12"
            icon={Users}
            title="Creatives coming soon"
            description="Be among the first curated voices on SPACEART."
            action={{ label: "Join as a creative", href: "/auth/sign-up" }}
            secondaryAction={{ label: "Explore marketplace", href: "/listings" }}
          />
        )}
      </Section>

      <Section id="trending" className="!pt-0">
        <MotionReveal>
          <SectionHeading
            title="Trending listings"
            description="Active marketplace demand — creative services and offerings generating economic activity now."
            href="/listings"
            linkLabel="Browse all listings"
          />
        </MotionReveal>
        {trending.length > 0 ? (
          <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
            {trending.slice(0, 9).map((listing, i) => (
              <div key={listing.id} className="mb-6 break-inside-avoid">
                <ListingCard listing={listing} priority={i < 2} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-12"
            icon={Sparkles}
            title="No trending listings yet"
            description="New work is added as creatives publish and get approved."
            action={{ label: "Browse listings", href: "/listings" }}
          />
        )}
      </Section>

      <Section className="!py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Creatives", href: "/creatives", count: discoverCreatives.length },
            { label: "Listings", href: "/listings", count: trending.length },
            { label: "Search", href: "/search", count: null },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="surface-card group p-6 transition-colors hover:border-accent/30"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Discover
              </p>
              <p className="mt-2 font-heading text-xl font-semibold group-hover:text-accent">
                {item.label}
              </p>
              {item.count !== null && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.count}+ live
                </p>
              )}
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
