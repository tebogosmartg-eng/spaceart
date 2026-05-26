import { isDevVerbose } from "@/shared/lib/dev-log";

const ROOT_ENV_HINT =
  "Add variables to `.env.local` at the project root (next to package.json and next.config.ts). " +
  "Next.js does not load `.env.local` from `supabase/` or other subfolders. See `.env.example`.";

const WRONG_LOCATION_HINT =
  "If you already created `supabase/.env.local`, move those values to the root `.env.local` and restart the dev server.";

let devStatusLogged = false;

function readPublicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"): string | undefined {
  // Static property access — required so Next.js inlines NEXT_PUBLIC_* in client bundles.
  const raw =
    name === "NEXT_PUBLIC_SUPABASE_URL"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (raw == null || raw === "") return undefined;
  const value = raw.trim();
  if (value === "") return undefined;
  assertNoWrappingQuotes(value, name);
  return value;
}

function assertNoWrappingQuotes(value: string, name: string): void {
  const quoted =
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"));
  if (quoted) {
    throw new Error(
      `${name} has wrapping quotes in .env.local. Use ${name}=value with no quotes. ${ROOT_ENV_HINT}`
    );
  }
}

function missingEnvError(name: string): Error {
  return new Error(`Missing ${name}. ${ROOT_ENV_HINT} ${WRONG_LOCATION_HINT}`);
}

function validateSupabaseUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("URL must use http or https");
    }
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${url}". ${ROOT_ENV_HINT}`
    );
  }
}

function maskUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://${hostname}/…`;
  } catch {
    return "(invalid url)";
  }
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}…${key.slice(-4)} (${key.length} chars)`;
}

/** Safe dev-only log — never prints full secrets. Requires SPACEART_DEBUG=1. */
export function logSupabaseEnvStatus(): void {
  if (
    process.env.NODE_ENV !== "development" ||
    !isDevVerbose() ||
    devStatusLogged
  )
    return;
  devStatusLogged = true;

  const url = readPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !key) {
    console.warn(
      "[spaceart] Supabase env not loaded.",
      { hasUrl: Boolean(url), hasAnonKey: Boolean(key) },
      ROOT_ENV_HINT
    );
    return;
  }

  console.info("[spaceart] Supabase env loaded", {
    url: maskUrl(url),
    anonKey: maskKey(key),
  });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    readPublicEnv("NEXT_PUBLIC_SUPABASE_URL") &&
      readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

export function getSupabaseUrl(): string {
  logSupabaseEnvStatus();
  const url = readPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!url) throw missingEnvError("NEXT_PUBLIC_SUPABASE_URL");
  validateSupabaseUrl(url);
  return url;
}

export function getSupabaseAnonKey(): string {
  logSupabaseEnvStatus();
  const key = readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!key) throw missingEnvError("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return key;
}

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  const value = raw?.trim();

  // In production, never return a localhost URL
  const isProduction = process.env.NODE_ENV === "production";
  const isLocalhost = (url: string) => /localhost|127\.0\.0\.1/i.test(url);

  if (value && value.length > 0 && !(isProduction && isLocalhost(value))) {
    return value;
  }

  const vercelUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  if (isProduction) {
    console.error(
      "[spaceart] CRITICAL: No production URL configured. " +
        "Set NEXT_PUBLIC_SITE_URL in Vercel environment variables to https://spaceart-two.vercel.app"
    );
  }

  return "http://localhost:3000";
}
