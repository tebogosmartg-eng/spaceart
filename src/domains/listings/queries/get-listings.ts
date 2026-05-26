import { unstable_cache } from "next/cache";
import {
  createClient,
  createPublicClient,
} from "@/infrastructure/database/server";
import { isSupabaseConfigured } from "@/infrastructure/database/env";
import {
  getDemoListingBySlug,
  getDemoListingsByCreativeId,
  getDemoPublishedListings,
  getDemoTrendingListings,
} from "@/shared/data/demo-content";
import { useDemoFallback } from "@/shared/lib/demo";
import { rankListings, backfillListings } from "@/shared/lib/ranking";
import type { ListingWithRelations } from "@/shared/types/database";

export const getTrendingListings = unstable_cache(
  async (): Promise<ListingWithRelations[]> => {
    if (!isSupabaseConfigured()) {
      return useDemoFallback() ? getDemoTrendingListings() : [];
    }

    const supabase = createPublicClient();

    // Fetch trending listings with headroom for ranking
    const { data: trending } = await supabase
      .from("listings")
      .select(
        `*, categories(*), creatives!inner(*), listing_media(url, sort_order)`
      )
      .eq("status", "published")
      .eq("is_trending", true)
      .eq("creatives.status", "approved")
      .order("published_at", { ascending: false })
      .limit(16);

    let pool = (trending as ListingWithRelations[]) ?? [];

    // If fewer than 6 trending, also pull recent published listings
    if (pool.length < 6) {
      const { data: recent } = await supabase
        .from("listings")
        .select(
          `*, categories(*), creatives!inner(*), listing_media(url, sort_order)`
        )
        .eq("status", "published")
        .eq("creatives.status", "approved")
        .order("published_at", { ascending: false })
        .limit(16);

      const existingIds = new Set(pool.map((l) => l.id));
      const extras = ((recent as ListingWithRelations[]) ?? []).filter(
        (l) => !existingIds.has(l.id)
      );
      pool = [...pool, ...extras];
    }

    // Rank by authenticity — real listings with real media surface first
    const ranked = rankListings(pool);

    if (ranked.length === 0 && useDemoFallback()) {
      return getDemoTrendingListings();
    }

    // Backfill demo only if real content is very sparse
    if (ranked.length < 3 && useDemoFallback()) {
      return backfillListings(ranked, getDemoTrendingListings(), 9);
    }

    return ranked.slice(0, 9);
  },
  ["trending-listings-v2"],
  { revalidate: 60, tags: ["listings"] }
);

export async function getPublishedListings(options?: {
  limit?: number;
  categorySlug?: string;
  q?: string;
  sort?: "newest" | "featured";
}): Promise<ListingWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return useDemoFallback() ? getDemoPublishedListings(options) : [];
  }

  const supabase = await createClient();
  // Fetch extra to give ranking headroom
  const fetchLimit = options?.limit ? options.limit * 2 : undefined;

  let query = supabase
    .from("listings")
    .select(
      `*, categories(*), creatives!inner(*), listing_media(url, sort_order)`
    )
    .eq("status", "published")
    .eq("creatives.status", "approved");

  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (options?.q) {
    query = query.textSearch("search_vector", options.q, {
      type: "websearch",
      config: "english",
    });
  }

  if (options?.sort === "featured") {
    query = query.eq("is_trending", true);
  }

  query = query.order("published_at", { ascending: false });
  if (fetchLimit) query = query.limit(fetchLimit);

  const { data } = await query;
  let results = (data as ListingWithRelations[]) ?? [];

  if (results.length === 0 && useDemoFallback()) {
    return getDemoPublishedListings(options);
  }

  // Rank by authenticity — real listings surface first
  results = rankListings(results);
  if (options?.limit) results = results.slice(0, options.limit);

  return results;
}

export async function getListingBySlug(
  slug: string
): Promise<ListingWithRelations | null> {
  if (!isSupabaseConfigured()) {
    return useDemoFallback() ? getDemoListingBySlug(slug) : null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(
      `*, categories(*), creatives!inner(*), listing_media(*)`
    )
    .eq("slug", slug)
    .eq("status", "published")
    .eq("creatives.status", "approved")
    .order("sort_order", { referencedTable: "listing_media", ascending: true })
    .single();

  if (data) return data as ListingWithRelations;
  return useDemoFallback() ? getDemoListingBySlug(slug) : null;
}

export async function getListingsByCreativeId(
  creativeId: string,
  includeDrafts = false
): Promise<ListingWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return useDemoFallback() && !includeDrafts
      ? getDemoListingsByCreativeId(creativeId)
      : [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select(`*, categories(*), listing_media(url, sort_order)`)
    .eq("creative_id", creativeId)
    .order("created_at", { ascending: false });

  if (!includeDrafts) {
    query = query.eq("status", "published");
  }

  const { data } = await query;
  const results = (data as ListingWithRelations[]) ?? [];
  if (results.length === 0 && useDemoFallback() && !includeDrafts) {
    return getDemoListingsByCreativeId(creativeId);
  }
  return results;
}

export async function getPendingListings(): Promise<ListingWithRelations[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(`*, categories(*), creatives(*)`)
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  return (data as ListingWithRelations[]) ?? [];
}

export async function getOwnerListings(
  profileId: string
): Promise<ListingWithRelations[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: creative } = await supabase
    .from("creatives")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!creative) return [];

  const { data } = await supabase
    .from("listings")
    .select(`*, categories(*), listing_media(url, sort_order)`)
    .eq("creative_id", creative.id)
    .order("created_at", { ascending: false });

  return (data as ListingWithRelations[]) ?? [];
}
