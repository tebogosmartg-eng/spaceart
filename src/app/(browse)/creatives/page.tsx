import { Suspense } from "react";
import { Users } from "lucide-react";
import { getApprovedCreatives } from "@/domains/creatives/queries/get-creatives";
import { DiscoveryFilters } from "@/domains/search/components/discovery-filters";
import { CreativeCard } from "@/shared/ui/creative-card";
import { Container } from "@/shared/ui/container";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState } from "@/shared/ui/empty-state";

export const metadata = {
  title: "Explore Creatives",
};

interface PageProps {
  searchParams: Promise<{ q?: string; province?: string }>;
}

export default async function CreativesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const creatives = await getApprovedCreatives({
    q: params.q,
    province: params.province,
    limit: 24,
  });

  return (
    <Container>
      <PageHeader
        title="Explore Creatives"
        description="Discover curated African creatives across music, fashion, photography, and more."
      />

      <Suspense fallback={<div className="h-28 animate-pulse rounded-2xl bg-muted/50" />}>
        <DiscoveryFilters
          basePath="/creatives"
          showCategory={false}
          showSort={false}
        />
      </Suspense>

      {creatives.length > 0 ? (
        <>
          <p className="mb-8 text-sm text-muted-foreground">
            {creatives.length} creative{creatives.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {creatives.map((creative, i) => (
              <CreativeCard key={creative.id} creative={creative} priority={i < 4} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          className="mt-8"
          icon={Users}
          title="No creatives match"
          description="Try another search or province, or join as a creative."
          action={{ label: "Join SpaceArt", href: "/auth/sign-up" }}
          secondaryAction={{ label: "View listings", href: "/listings" }}
        />
      )}
    </Container>
  );
}
