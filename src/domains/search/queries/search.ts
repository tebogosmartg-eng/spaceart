import { getApprovedCreatives } from "@/domains/creatives/queries/get-creatives";
import { getPublishedListings } from "@/domains/listings/queries/get-listings";
import {
  getDemoApprovedCreatives,
  getDemoPublishedListings,
} from "@/shared/data/demo-content";
import { useDemoFallback } from "@/shared/lib/demo";
import type { Creative, ListingWithRelations } from "@/shared/types/database";

export interface SearchResults {
  creatives: Creative[];
  listings: ListingWithRelations[];
}

export async function searchAll(params: {
  q?: string;
  category?: string;
  province?: string;
  sort?: string;
}): Promise<SearchResults> {
  const q = params.q?.trim();
  const province = params.province?.trim();

  const [creatives, listings] = await Promise.all([
    getApprovedCreatives({ q, province, limit: 12 }),
    getPublishedListings({
      q,
      categorySlug: params.category,
      sort: params.sort === "featured" ? "featured" : "newest",
      limit: 12,
    }),
  ]);

  if (
    useDemoFallback() &&
    creatives.length === 0 &&
    listings.length === 0 &&
    !q
  ) {
    return {
      creatives: getDemoApprovedCreatives(12),
      listings: getDemoPublishedListings({ limit: 12 }),
    };
  }

  return { creatives, listings };
}
