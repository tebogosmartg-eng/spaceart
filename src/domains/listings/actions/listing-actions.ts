"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/database/server";
import { submitListingForReview } from "@/infrastructure/services/listing-service";
import { slugify } from "@/shared/lib/utils";
import { listingSchema } from "../schemas/listing-schema";

export async function createListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: creative } = await supabase
    .from("creatives")
    .select("id, status")
    .eq("profile_id", user.id)
    .single();

  if (!creative) throw new Error("Create your creative profile first.");

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category_id: formData.get("category_id"),
    price_label: formData.get("price_label") || undefined,
    price_from_cents: formData.get("price_from_cents")
      ? Number(formData.get("price_from_cents"))
      : undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid data");
  }

  const slug = `${slugify(parsed.data.title)}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("listings")
    .insert({
      creative_id: creative.id,
      slug,
      ...parsed.data,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const mediaUrls = formData.getAll("media_urls") as string[];
  const mediaIds = formData.getAll("media_ids") as string[];

  const storagePaths = formData.getAll("storage_paths") as string[];

  for (let i = 0; i < mediaUrls.length; i++) {
    if (mediaUrls[i]) {
      await supabase.from("listing_media").insert({
        listing_id: data.id,
        url: mediaUrls[i],
        storage_path: storagePaths[i] ?? null,
        cloudinary_public_id: mediaIds[i] ?? null,
        sort_order: i,
      });
    }
  }

  revalidatePath("/dashboard/listings");
  return { id: data.id };
}

export async function updateListing(listingId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category_id: formData.get("category_id"),
    price_label: formData.get("price_label") || undefined,
    price_from_cents: formData.get("price_from_cents")
      ? Number(formData.get("price_from_cents"))
      : undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid data");
  }

  const { error } = await supabase
    .from("listings")
    .update(parsed.data)
    .eq("id", listingId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath("/dashboard/listings");
}

export async function submitListingAction(listingId: string) {
  await submitListingForReview(listingId);
}

export async function archiveListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("listings")
    .update({ status: "archived" })
    .eq("id", listingId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/listings");
}
