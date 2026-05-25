import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/supabase/server";

export async function submitListingForReview(listingId: string) {
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("creative_id, creatives(status)")
    .eq("id", listingId)
    .single();

  const creative = Array.isArray(listing?.creatives)
    ? listing.creatives[0]
    : listing?.creatives;
  const creativeStatus = (creative as { status?: string } | null)?.status;
  if (creativeStatus !== "approved") {
    throw new Error("Your creative profile must be approved before submitting listings.");
  }

  const { error } = await supabase
    .from("listings")
    .update({ status: "pending_review", rejection_note: null })
    .eq("id", listingId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/listings");
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
}

export async function approveListing(listingId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_approve_listing", {
    p_listing_id: listingId,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
}

export async function rejectListing(listingId: string, note?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reject_listing", {
    p_listing_id: listingId,
    p_reason: note ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
}
