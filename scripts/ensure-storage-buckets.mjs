/**
 * Creates avatars + listings buckets when SUPABASE_SERVICE_ROLE_KEY is set.
 * Usage: node scripts/ensure-storage-buckets.mjs
 *
 * Prefer running supabase/migrations/005_schema_and_storage_repair.sql in the
 * SQL Editor so RLS policies are applied.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  console.error(
    "Add the service role key from Supabase → Project Settings → API, then re-run."
  );
  console.error(
    "Alternatively, run supabase/migrations/005_schema_and_storage_repair.sql in the SQL Editor."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKETS = [
  {
    id: "avatars",
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  {
    id: "listings",
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
];

async function main() {
  const { data: existing, error: listError } =
    await supabase.storage.listBuckets();
  if (listError) {
    console.error("listBuckets failed:", listError.message);
    process.exit(1);
  }

  const existingIds = new Set((existing ?? []).map((b) => b.id));

  for (const bucket of BUCKETS) {
    if (existingIds.has(bucket.id)) {
      console.log(`✓ bucket "${bucket.id}" already exists`);
      continue;
    }

    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    });

    if (error) {
      console.error(`✗ create "${bucket.id}" failed:`, error.message);
      process.exit(1);
    }
    console.log(`✓ created bucket "${bucket.id}"`);
  }

  console.log(
    "\nNote: RLS policies are not created by this script. Run migration 005 in the SQL Editor for full storage access control."
  );
}

main();
