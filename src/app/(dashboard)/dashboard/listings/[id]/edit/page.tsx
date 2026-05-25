import { notFound, redirect } from "next/navigation";
import { createClient } from "@/infrastructure/database/server";
import { getCategories } from "@/domains/categories/queries/get-categories";
import { ListingForm } from "@/domains/listings/components/listing-form";
import { PageHeader } from "@/shared/ui/page-header";
import type { ListingWithRelations } from "@/shared/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit Listing",
};

export default async function EditListingPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: listing } = await supabase
    .from("listings")
    .select(`*, categories(*), listing_media(*), creatives!inner(profile_id)`)
    .eq("id", id)
    .single();

  if (!listing) notFound();

  const creative = listing.creatives as { profile_id: string };
  if (creative.profile_id !== user.id) notFound();

  const categories = await getCategories();

  return (
    <div>
      <PageHeader title="Edit Listing" />
      <ListingForm
        categories={categories}
        listing={listing as ListingWithRelations}
      />
    </div>
  );
}
