import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateAdminClient } from "./admin";
import { STORAGE_BUCKET_DEFINITIONS } from "./bucket-config";
import { STORAGE_BUCKETS, type StorageBucket } from "./storage";
import type { Database } from "./types";

export type BucketValidationResult = {
  ok: boolean;
  present: StorageBucket[];
  missing: StorageBucket[];
  checkedVia: "admin" | "skipped";
  error?: string;
};

const REQUIRED = Object.values(STORAGE_BUCKETS) as StorageBucket[];

/**
 * Confirms avatars + listings buckets exist before upload.
 * Uses service-role listBuckets when available; otherwise skips (SQL migrations are authoritative).
 */
export async function validateStorageBuckets(
  _userClient?: SupabaseClient<Database>
): Promise<BucketValidationResult> {
  const admin = tryCreateAdminClient();
  if (!admin) {
    const result: BucketValidationResult = {
      ok: true,
      present: [],
      missing: [],
      checkedVia: "skipped",
      error: "SUPABASE_SERVICE_ROLE_KEY not set; relying on SQL-provisioned buckets",
    };
    console.info("[storage] Bucket validation skipped", result);
    return result;
  }

  const { data: buckets, error } = await admin.storage.listBuckets();

  if (error) {
    const result: BucketValidationResult = {
      ok: false,
      present: [],
      missing: [...REQUIRED],
      checkedVia: "admin",
      error: error.message,
    };
    console.error("[storage] Bucket validation failed", result);
    return result;
  }

  const ids = new Set((buckets ?? []).map((b) => b.id));
  const present = REQUIRED.filter((id) => ids.has(id));
  const missing = REQUIRED.filter((id) => !ids.has(id));

  const result: BucketValidationResult = {
    ok: missing.length === 0,
    present,
    missing,
    checkedVia: "admin",
  };

  if (result.ok) {
    console.info("[storage] Bucket validation ok", {
      buckets: present,
      definitions: STORAGE_BUCKET_DEFINITIONS.map((b) => b.id),
    });
  } else {
    console.error("[storage] Bucket validation failed", {
      ...result,
      hint: "Run supabase/migrations/005_schema_and_storage_repair.sql or npm run storage:setup",
    });
  }

  return result;
}
