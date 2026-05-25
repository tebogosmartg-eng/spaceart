import { Suspense } from "react";
import { LinkButton } from "@/shared/ui/link-button";
import { HomeHero } from "@/domains/marketplace/components/home-hero";
import {
  LandingPespSection,
  LandingSustainabilitySection,
  LandingImpactSection,
} from "@/domains/marketplace/components/landing-institutional";
import { MarketplaceFeed } from "@/domains/marketplace/components/marketplace-feed";
import { MarketplaceFeedSkeleton } from "@/shared/ui/marketplace-feed-skeleton";
import { getCategories } from "@/domains/categories/queries/get-categories";
import { getApprovedCreatives } from "@/domains/creatives/queries/get-creatives";
import { CategoryPill } from "@/shared/ui/category-pill";
import { Section } from "@/shared/ui/section";
import { MotionReveal } from "@/shared/ui/motion-reveal";
import { PremiumCard } from "@/shared/ui/brand";
import { landingContent } from "@/shared/config/landing";

export default async function HomePage() {
  const [categories, approvedCreatives] = await Promise.all([
    getCategories(),
    getApprovedCreatives(),
  ]);

  const creatorCount = approvedCreatives.length;

  return (
    <>
      <Section className="!py-0" containerClassName="!max-w-7xl">
        <HomeHero />
      </Section>

      <LandingPespSection />
      <LandingSustainabilitySection />

      <Suspense fallback={<MarketplaceFeedSkeleton />}>
        <MarketplaceFeed />
      </Suspense>

      <LandingImpactSection creatorCount={creatorCount} />

      <Section id="categories" className="!pt-0">
        <MotionReveal>
          <h2 className="text-cinematic text-3xl md:text-4xl">
            Explore by discipline
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Discover township and rural talent across art, craft, design, and
            creative services.
          </p>
        </MotionReveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryPill key={category.id} category={category} />
          ))}
        </div>
      </Section>

      <Section className="!py-16 md:!py-20">
        <PremiumCard glow padding="lg" className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-accent/12 blur-3xl"
            aria-hidden
          />
          <p className="text-eyebrow text-accent">{landingContent.cta.eyebrow}</p>
          <h2 className="text-cinematic relative mt-5 max-w-2xl text-3xl tracking-tight md:text-5xl">
            {landingContent.cta.title}
          </h2>
          <p className="relative mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:max-w-2xl md:text-lg md:leading-[1.65]">
            {landingContent.cta.description}
          </p>
          <div className="relative mt-10 flex flex-wrap gap-4">
            <LinkButton
              href={landingContent.cta.primaryCta.href}
              size="lg"
              variant="accent"
            >
              {landingContent.cta.primaryCta.label}
            </LinkButton>
            <LinkButton
              href={landingContent.cta.secondaryCta.href}
              size="lg"
              variant="outline"
            >
              {landingContent.cta.secondaryCta.label}
            </LinkButton>
          </div>
        </PremiumCard>
      </Section>
    </>
  );
}
