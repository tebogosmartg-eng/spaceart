/**
 * Verifies avatars + listings buckets exist (service role required).
 * Usage: node scripts/verify-storage-infra.mjs
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REQUIRED = ["avatars", "listings"];

if (!url) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

if (!serviceKey) {
  console.warn(
    "[verify-storage] SUPABASE_SERVICE_ROLE_KEY not set — cannot list buckets via API."
  );
  console.warn(
    "Buckets are still provisioned via SQL: run 005_schema_and_storage_repair.sql in Supabase SQL Editor."
  );
  process.exit(0);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: buckets, error } = await supabase.storage.listBuckets();

if (error) {
  console.error("[verify-storage] listBuckets failed:", error.message);
  process.exit(1);
}

const ids = new Set((buckets ?? []).map((b) => b.id));
const missing = REQUIRED.filter((id) => !ids.has(id));

if (missing.length > 0) {
  console.error("[verify-storage] Missing buckets:", missing.join(", "));
  process.exit(1);
}

for (const id of REQUIRED) {
  const meta = buckets.find((b) => b.id === id);
  console.info("[verify-storage] ok", {
    id,
    public: meta?.public,
    fileSizeLimit: meta?.file_size_limit,
  });
}

console.info("[verify-storage] All required buckets present");
