import { createClient } from "../server";
import type { ListingWithRelations } from "../types";

export async function fetchPublishedListings(options?: {
  limit?: number;
  categorySlug?: string;
}): Promise<ListingWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select(
      `*, categories(*), creatives!inner(*), listing_media(id, url, sort_order, storage_path)`
    )
    .eq("status", "published")
    .eq("creatives.status", "approved")
    .order("published_at", { ascending: false });

  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ListingWithRelations[]) ?? [];
}

export async function fetchOwnerListings(
  profileId: string
): Promise<ListingWithRelations[]> {
  const supabase = await createClient();
  const { data: creative } = await supabase
    .from("creatives")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!creative) return [];

  const { data, error } = await supabase
    .from("listings")
    .select(`*, categories(*), listing_media(id, url, sort_order, storage_path)`)
    .eq("creative_id", creative.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ListingWithRelations[]) ?? [];
}

export async function insertListing(
  payload: {
    creative_id: string;
    category_id: string;
    slug: string;
    title: string;
    description?: string | null;
    price_label?: string | null;
    price_from_cents?: number | null;
  },
  media: { url: string; storage_path: string }[]
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({ ...payload, status: "draft" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (media.length > 0) {
    const { error: mediaError } = await supabase.from("listing_media").insert(
      media.map((m, i) => ({
        listing_id: data.id,
        url: m.url,
        storage_path: m.storage_path,
        sort_order: i,
      }))
    );
    if (mediaError) throw new Error(mediaError.message);
  }

  return data;
}
