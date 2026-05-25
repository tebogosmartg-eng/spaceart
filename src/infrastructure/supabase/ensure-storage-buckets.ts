import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateAdminClient } from "./admin";
import { STORAGE_BUCKET_DEFINITIONS } from "./bucket-config";
import type { Database } from "./types";

export type EnsureBucketsResult = {
  ensured: boolean;
  created: string[];
  skippedReason?: string;
};

/**
 * Creates avatars + listings buckets when the service role key is available.
 * RLS policies still require SQL migrations (004/005).
 *
 * TODO: Storage provisioning is not required for onboarding or profile save —
 * those flows degrade gracefully when buckets are missing. Harden monitoring
 * before making uploads mandatory in product flows.
 */
export async function ensureStorageBuckets(): Promise<EnsureBucketsResult> {
  const admin = tryCreateAdminClient();
  if (!admin) {
    return {
      ensured: false,
      created: [],
      skippedReason: "SUPABASE_SERVICE_ROLE_KEY not set",
    };
  }

  return ensureStorageBucketsWithClient(admin);
}

export async function ensureStorageBucketsWithClient(
  admin: SupabaseClient<Database>
): Promise<EnsureBucketsResult> {
  const { data: existing, error: listError } = await admin.storage.listBuckets();

  if (listError) {
    console.error("[storage] listBuckets failed", { message: listError.message });
    return {
      ensured: false,
      created: [],
      skippedReason: listError.message,
    };
  }

  const existingIds = new Set((existing ?? []).map((b) => b.id));
  const created: string[] = [];

  for (const bucket of STORAGE_BUCKET_DEFINITIONS) {
    if (existingIds.has(bucket.id)) continue;

    const { error } = await admin.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    });

    if (error) {
      console.error("[storage] createBucket failed", {
        bucket: bucket.id,
        message: error.message,
      });
      return { ensured: false, created, skippedReason: error.message };
    }

    created.push(bucket.id);
    console.info("[storage] Created bucket", { bucket: bucket.id });
  }

  return { ensured: true, created };
}
