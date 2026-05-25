import { unstable_cache } from "next/cache";
import {
  createClient,
  createPublicClient,
} from "@/infrastructure/database/server";
import { isSupabaseConfigured } from "@/infrastructure/database/env";
import {
  getDemoApprovedCreatives,
  getDemoCreativeBySlug,
  getDemoFeaturedCreatives,
  getDemoPublishedListings,
} from "@/shared/data/demo-content";
import { useDemoFallback } from "@/shared/lib/demo";
import type { Creative } from "@/shared/types/database";

export const getFeaturedCreatives = unstable_cache(
  async (): Promise<Creative[]> => {
    if (!isSupabaseConfigured()) {
      return useDemoFallback() ? getDemoFeaturedCreatives() : [];
    }

    const supabase = createPublicClient();
    const { data } = await supabase
      .from("creatives")
      .select("*")
      .eq("status", "approved")
      .eq("is_featured", true)
      .order("approved_at", { ascending: false })
      .limit(6);

    const results = (data as Creative[]) ?? [];
    if (results.length === 0 && useDemoFallback()) return getDemoFeaturedCreatives();
    return results;
  },
  ["featured-creatives"],
  { revalidate: 60, tags: ["creatives"] }
);

export async function getApprovedCreatives(options?: {
  limit?: number;
  categorySlug?: string;
  province?: string;
  q?: string;
}): Promise<Creative[]> {
  if (!isSupabaseConfigured()) {
    return useDemoFallback() ? getDemoApprovedCreatives(options?.limit) : [];
  }

  const hasFilters = Boolean(options?.q || options?.province);

  const fetchCreatives = async () => {
    const supabase = hasFilters ? await createClient() : createPublicClient();
    let query = supabase
      .from("creatives")
      .select("*")
      .eq("status", "approved")
      .order("approved_at", { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.province) {
      query = query.ilike("province", `%${options.province}%`);
    }
    if (options?.q) {
      query = query.textSearch("search_vector", options.q, {
        type: "websearch",
        config: "english",
      });
    }

    const { data } = await query;
    let results = (data as Creative[]) ?? [];
    if (results.length === 0 && useDemoFallback()) {
      results = getDemoApprovedCreatives();
    }
    if (options?.province) {
      results = results.filter(
        (c) =>
          c.province?.toLowerCase().includes(options.province!.toLowerCase())
      );
    }
    if (options?.limit) results = results.slice(0, options.limit);
    return results;
  };

  if (!hasFilters) {
    const cached = unstable_cache(
      fetchCreatives,
      [`approved-creatives-${options?.limit ?? "all"}`],
      { revalidate: 60, tags: ["creatives"] }
    );
    return cached();
  }

  return fetchCreatives();
}

export async function getCreativesByCategory(
  categorySlug: string,
  limit = 12
): Promise<Creative[]> {
  if (!isSupabaseConfigured()) {
    const ids = new Set(
      getDemoPublishedListings({ categorySlug }).map((l) => l.creative_id)
    );
    return getDemoApprovedCreatives().filter((c) => ids.has(c.id)).slice(0, limit);
  }

  const supabase = await createClient();
  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (!cat) return useDemoFallback() ? [] : [];

  const { data: listings } = await supabase
    .from("listings")
    .select("creative_id, creatives!inner(*)")
    .eq("status", "published")
    .eq("category_id", cat.id)
    .eq("creatives.status", "approved")
    .limit(50);

  const seen = new Set<string>();
  const creatives: Creative[] = [];
  for (const row of listings ?? []) {
    const c = row.creatives as unknown as Creative;
    if (c && !seen.has(c.id)) {
      seen.add(c.id);
      creatives.push(c);
      if (creatives.length >= limit) break;
    }
  }

  if (creatives.length === 0 && useDemoFallback()) {
    const ids = new Set(
      getDemoPublishedListings({ categorySlug }).map((l) => l.creative_id)
    );
    return getDemoApprovedCreatives().filter((c) => ids.has(c.id)).slice(0, limit);
  }

  return creatives;
}

export async function getCreativeBySlug(slug: string): Promise<Creative | null> {
  if (!isSupabaseConfigured()) {
    return useDemoFallback() ? getDemoCreativeBySlug(slug) : null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("creatives")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (data) return data as Creative;
  return useDemoFallback() ? getDemoCreativeBySlug(slug) : null;
}

export async function getCreativeByProfileId(
  profileId: string
): Promise<Creative | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("creatives")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  return (data as Creative) ?? null;
}

export async function getPendingCreatives(): Promise<Creative[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("creatives")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (data as Creative[]) ?? [];
}
