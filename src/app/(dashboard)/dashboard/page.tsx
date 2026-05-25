import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import { createClient } from "@/infrastructure/database/server";
import { getCreativeByProfileId } from "@/domains/creatives/queries/get-creatives";
import { getOwnerListings } from "@/domains/listings/queries/get-listings";
import { DashboardListingRow } from "@/domains/dashboard/components/dashboard-listing-row";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusBadge } from "@/shared/ui/status-badge";
import { LinkButton } from "@/shared/ui/link-button";
import { EmptyState } from "@/shared/ui/empty-state";
import { BadgeCheck } from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const creative = await getCreativeByProfileId(user.id);
  const listings = creative ? await getOwnerListings(user.id) : [];
  const publishedCount = listings.filter((l) => l.status === "published").length;
  const pendingCount = listings.filter(
    (l) => l.status === "pending_review" || l.status === "draft"
  ).length;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Overview"
        description="Your creative presence and listings on SPACEART."
      />

      {!creative ? (
        <EmptyState
          title="Set up your creative profile"
          description="Complete your profile to submit for curation and publish listings."
          action={{ label: "Create profile", href: "/dashboard/profile" }}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Profile status
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={creative.status} />
                {creative.verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-accent">
                    <BadgeCheck className="size-3.5" />
                    Verified
                  </span>
                )}
              </div>
            </div>
            <div className="surface-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Published listings
              </p>
              <p className="mt-3 font-heading text-3xl font-bold tabular-nums">
                {publishedCount}
              </p>
            </div>
            <div className="surface-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                In progress
              </p>
              <p className="mt-3 font-heading text-3xl font-bold tabular-nums">
                {pendingCount}
              </p>
            </div>
          </div>

          <section className="surface-card p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  {creative.display_name}
                </h2>
                {creative.status === "pending" && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your profile is awaiting admin approval.
                  </p>
                )}
                {creative.status === "rejected" && creative.rejection_note && (
                  <p className="mt-2 text-sm text-red-400">{creative.rejection_note}</p>
                )}
                {creative.status === "approved" && (
                  <Link
                    href={`/creatives/${creative.slug}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    View public profile
                    <ExternalLink className="size-3.5" />
                  </Link>
                )}
              </div>
              <LinkButton href="/dashboard/profile" variant="outline" size="sm">
                Edit profile
              </LinkButton>
            </div>
          </section>

          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Listings
              </h2>
              <LinkButton
                href="/dashboard/listings/new"
                size="sm"
                variant="accent"
              >
                <Plus className="mr-1 size-4" />
                New listing
              </LinkButton>
            </div>

            {listings.length === 0 ? (
              <EmptyState
                title="No listings yet"
                description="Create your first listing to showcase services on the marketplace."
                action={{ label: "Create listing", href: "/dashboard/listings/new" }}
              />
            ) : (
              <ul className="space-y-2">
                {listings.map((listing) => (
                  <li key={listing.id}>
                    <DashboardListingRow listing={listing} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
