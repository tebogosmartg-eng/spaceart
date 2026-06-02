const LOCAL_FALLBACK_URL = "http://localhost:3000";
const BLOCKED_CANONICAL_HOSTS = new Set(["spaceart.vercel.app"]);

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withProtocol =
    /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return "";
  }
}

function isBlockedHost(url: string): boolean {
  try {
    return BLOCKED_CANONICAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

function readConfiguredSiteUrl(): string | undefined {
  const normalized = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (normalized && isBlockedHost(normalized)) return undefined;
  return normalized || undefined;
}

function readVercelUrl(preferProduction: boolean): string | undefined {
  const productionCandidate = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
      process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      ""
  );

  const runtimeCandidate = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL ?? ""
  );

  if (preferProduction) {
    const candidate = productionCandidate || runtimeCandidate || undefined;
    if (candidate && isBlockedHost(candidate)) return undefined;
    return candidate;
  }

  const candidate = runtimeCandidate || productionCandidate || undefined;
  if (candidate && isBlockedHost(candidate)) return undefined;
  return candidate;
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export function getCanonicalSiteUrl(): string {
  const configured = readConfiguredSiteUrl();
  const vercelPrefersProduction = isVercelProduction() || isProductionRuntime();
  const vercelUrl = readVercelUrl(vercelPrefersProduction);

  if (isVercelProduction()) {
    // Production should always use the explicit canonical domain when present.
    if (configured && !isLocalhostUrl(configured)) return configured;
    if (vercelUrl && !isLocalhostUrl(vercelUrl)) return vercelUrl;
  } else {
    // Preview/dev should prefer the active deployment host when available.
    if (vercelUrl) return vercelUrl;
    if (configured) return configured;
  }

  if (configured && !(isProductionRuntime() && isLocalhostUrl(configured))) {
    return configured;
  }

  if (vercelUrl && !(isProductionRuntime() && isLocalhostUrl(vercelUrl))) {
    return vercelUrl;
  }

  if (isProductionRuntime()) {
    console.error(
      "[spaceart] CRITICAL: No canonical production URL resolved. " +
        "Set NEXT_PUBLIC_SITE_URL to your canonical domain."
    );
  }

  return LOCAL_FALLBACK_URL;
}

export function getCanonicalSiteUrlObject(): URL {
  return new URL(getCanonicalSiteUrl());
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, getCanonicalSiteUrl()).toString();
}

export function buildCanonicalPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return toAbsoluteUrl(normalizedPath);
}

export function resolveRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (host) {
    const candidate = normalizeBaseUrl(
      `${proto && proto.length > 0 ? proto : "https"}://${host}`
    );
    if (candidate) return candidate;
  }

  if (url.origin && url.origin !== "null") return url.origin;
  return getCanonicalSiteUrl();
}
