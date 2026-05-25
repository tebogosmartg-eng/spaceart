import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/database/server";
import { getCreativeByProfileId } from "@/domains/creatives/queries/get-creatives";
import { getCategories } from "@/domains/categories/queries/get-categories";
import { ListingForm } from "@/domains/listings/components/listing-form";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = {
  title: "New Listing",
};

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const creative = await getCreativeByProfileId(user.id);
  if (!creative) redirect("/dashboard/profile");

  const categories = await getCategories();

  return (
    <div>
      <PageHeader title="New Listing" description="Create a new offering for review." />
      <ListingForm categories={categories} />
    </div>
  );
}
