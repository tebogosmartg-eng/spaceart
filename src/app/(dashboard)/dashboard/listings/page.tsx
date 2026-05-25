import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/database/server";
import { getOwnerListings } from "@/domains/listings/queries/get-listings";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusBadge } from "@/shared/ui/status-badge";
import { LinkButton } from "@/shared/ui/link-button";

export const metadata = {
  title: "My Listings",
};

export default async function DashboardListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const listings = await getOwnerListings(user.id);

  return (
    <div>
      <PageHeader title="My Listings">
        <LinkButton
          href="/dashboard/listings/new"
          variant="accent"
        >
          New listing
        </LinkButton>
      </PageHeader>

      {listings.length === 0 ? (
        <p className="text-muted-foreground">Create your first listing.</p>
      ) : (
        <ul className="space-y-4">
          {listings.map((listing) => (
            <li
              key={listing.id}
              className="flex items-center justify-between rounded-xl border border-white/8 p-4"
            >
              <Link
                href={`/dashboard/listings/${listing.id}/edit`}
                className="font-medium hover:text-accent"
              >
                {listing.title}
              </Link>
              <StatusBadge status={listing.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
