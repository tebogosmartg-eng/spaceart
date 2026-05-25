import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getSupabaseUrl } from "./env";

function buildAdminClient(serviceKey: string): SupabaseClient<Database> {
  return createClient<Database>(getSupabaseUrl(), serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Returns null when SUPABASE_SERVICE_ROLE_KEY is unset (no throw). */
export function tryCreateAdminClient(): SupabaseClient<Database> | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) return null;
  return buildAdminClient(serviceKey);
}

/** Service-role client — server-only, never import in client components */
export function createAdminClient(): SupabaseClient<Database> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for admin operations");
  }
  return buildAdminClient(serviceKey);
}
