import { createClient } from "@/infrastructure/database/server";
import { isSupabaseConfigured } from "@/infrastructure/database/env";
import type { Profile } from "@/shared/types/database";

export async function getProfileById(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return (data as Profile) ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return getProfileById(user.id);
}
