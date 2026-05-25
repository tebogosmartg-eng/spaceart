"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/infrastructure/supabase/client";
import type { ListingWithRelations } from "@/infrastructure/supabase/types";
import { queryKeys } from "./query-keys";

async function fetchOwnerListingsClient(
  profileId: string
): Promise<ListingWithRelations[]> {
  const supabase = createClient();

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

export function useOwnerListings(profileId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.listings.owner(profileId),
    queryFn: () =>
      profileId ? fetchOwnerListingsClient(profileId) : [],
    enabled: Boolean(profileId),
  });
}

export function usePublishedListings(categorySlug?: string) {
  return useQuery({
    queryKey: queryKeys.listings.published({ category: categorySlug }),
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("listings")
        .select(
          `*, categories(*), creatives!inner(*), listing_media(id, url, sort_order)`
        )
        .eq("status", "published")
        .eq("creatives.status", "approved")
        .order("published_at", { ascending: false })
        .limit(24);

      if (categorySlug) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .single();
        if (cat) query = query.eq("category_id", cat.id);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data as ListingWithRelations[]) ?? [];
    },
  });
}
