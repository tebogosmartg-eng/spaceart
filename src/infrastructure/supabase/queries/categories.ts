import { createClient } from "../server";
import type { Category } from "../types";

export async function fetchCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}
