import { unstable_cache } from "next/cache";
import {
  createClient,
  createPublicClient,
} from "@/infrastructure/database/server";
import { isSupabaseConfigured } from "@/infrastructure/database/env";
import type { Category } from "@/shared/types/database";

const FALLBACK_CATEGORIES: Category[] = [
  { id: "1", slug: "music", name: "Music", description: "African sounds and live performance", icon: "music", sort_order: 1, created_at: "" },
  { id: "2", slug: "fashion", name: "Fashion", description: "Contemporary African fashion", icon: "shirt", sort_order: 2, created_at: "" },
  { id: "3", slug: "photography", name: "Photography", description: "Visual storytelling", icon: "camera", sort_order: 3, created_at: "" },
  { id: "4", slug: "performance", name: "Performance", description: "Theatre, dance, live art", icon: "mic", sort_order: 4, created_at: "" },
  { id: "5", slug: "crafts", name: "Crafts", description: "Handmade cultural craft", icon: "palette", sort_order: 5, created_at: "" },
  { id: "6", slug: "design", name: "Design", description: "Graphic and spatial design", icon: "pen-tool", sort_order: 6, created_at: "" },
];

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    if (!isSupabaseConfigured()) return FALLBACK_CATEGORIES;

    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");

    if (error || !data?.length) return FALLBACK_CATEGORIES;
    return data as Category[];
  },
  ["categories"],
  { revalidate: 300, tags: ["categories"] }
);

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) {
    return FALLBACK_CATEGORIES.find((c) => c.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  return (data as Category) ?? null;
}
