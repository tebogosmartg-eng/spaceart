"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/database/server";
import { submitListingForReview } from "@/infrastructure/services/listing-service";
import { slugify } from "@/shared/lib/utils";
import { listingSchema } from "../schemas/listing-schema";
import { STORAGE_BUCKETS } from "@/infrastructure/supabase/storage";

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

  const mediaUrls = formData.getAll("media_urls") as string[];
  const storagePaths = formData.getAll("storage_paths") as string[];
  const mediaIds = formData.getAll("media_ids") as string[];
  const mediaRecordIds = formData.getAll("media_record_ids") as string[];

  const { data: allExisting } = await supabase
    .from("listing_media")
    .select("id, url")
    .eq("listing_id", listingId);

  const existingById = new Map<string, { id: string; url: string }>();
  const existingByUrl = new Map<string, { id: string; url: string }>();
  allExisting?.forEach((m) => {
    existingById.set(m.id, m);
    existingByUrl.set(m.url, m);
  });

  for (let i = 0; i < mediaUrls.length; i++) {
    const url = mediaUrls[i];
    if (!url) continue;

    const explicitRecordId = mediaRecordIds[i] ?? "";
    const matchedExisting =
      (explicitRecordId ? existingById.get(explicitRecordId) : undefined) ??
      existingByUrl.get(url);

    if (matchedExisting) {
      const { error: reorderError } = await supabase
        .from("listing_media")
        .update({ sort_order: i })
        .eq("id", matchedExisting.id)
        .eq("listing_id", listingId);
      if (reorderError) throw new Error(reorderError.message);
      continue;
    }

    const { error: insertError } = await supabase.from("listing_media").insert({
      listing_id: listingId,
      url,
      storage_path: storagePaths[i] ?? null,
      cloudinary_public_id: mediaIds[i] ?? null,
      sort_order: i,
    });

    if (insertError) throw new Error(insertError.message);
  }

  if (mediaUrls.length > 0) {
    const keepIds = new Set(
      mediaRecordIds.filter(Boolean).filter((id) => existingById.has(id))
    );
    const keepUrls = new Set(mediaUrls.filter(Boolean));
    const staleIds =
      allExisting
        ?.filter((m) => !keepIds.has(m.id) && !keepUrls.has(m.url))
        .map((m) => m.id) ?? [];

    if (staleIds.length > 0) {
      const { error: cleanupError } = await supabase
        .from("listing_media")
        .delete()
        .eq("listing_id", listingId)
        .in("id", staleIds);

      if (cleanupError) throw new Error(cleanupError.message);
    }
  } else {
    const { error: clearError } = await supabase
      .from("listing_media")
      .delete()
      .eq("listing_id", listingId);

    if (clearError) throw new Error(clearError.message);
  }

  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath("/dashboard/listings");
}

export async function deleteListingMedia(mediaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: media } = await supabase
    .from("listing_media")
    .select("id, listing_id, storage_path, url")
    .eq("id", mediaId)
    .single();

  if (!media) throw new Error("Media not found");

  const { data: listing } = await supabase
    .from("listings")
    .select("id, creatives!inner(profile_id)")
    .eq("id", media.listing_id)
    .single();

  if (!listing) throw new Error("Listing not found");

  const creative = listing.creatives as { profile_id: string };
  if (creative.profile_id !== user.id) throw new Error("Unauthorized");

  if (media.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKETS.listings)
      .remove([media.storage_path]);

    if (storageError) {
      console.warn("[media] Storage cleanup failed (non-fatal)", {
        mediaId,
        path: media.storage_path,
        message: storageError.message,
      });
    }
  }

  const { error } = await supabase
    .from("listing_media")
    .delete()
    .eq("id", mediaId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/listings/${media.listing_id}/edit`);
  revalidatePath("/dashboard/listings");
  return { success: true };
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
