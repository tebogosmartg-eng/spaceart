/**
 * Avatar URL resolution with graceful degradation when storage upload is unavailable.
 *
 * TODO: Remove placeholder fallback once Supabase Storage upload infrastructure is
 * production-ready (buckets provisioned, RLS, CDN). See `src/app/api/upload/route.ts`
 * and `src/infrastructure/supabase/ensure-storage-buckets.ts`.
 */

const PLACEHOLDER_HOST = "ui-avatars.com";

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Deterministic placeholder when no uploaded avatar is available. */
export function buildAvatarPlaceholderUrl(displayName: string): string {
  const label = displayName.trim().split(/\s+/).slice(0, 2).join(" ") || "Creative";
  const name = encodeURIComponent(label);
  return `https://${PLACEHOLDER_HOST}/api/?name=${name}&size=256&background=1a1a2e&color=e94560&bold=true`;
}

/**
 * Prefer a validated uploaded URL; otherwise use a placeholder so profiles and
 * creatives always have a displayable avatar without blocking onboarding.
 */
export function isAvatarPlaceholderUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    return new URL(url.trim()).hostname === PLACEHOLDER_HOST;
  } catch {
    return false;
  }
}

export function resolveAvatarUrl(
  displayName: string,
  uploadedUrl?: string | null
): string {
  const trimmed = uploadedUrl?.trim();
  if (
    trimmed &&
    isValidHttpUrl(trimmed) &&
    !isAvatarPlaceholderUrl(trimmed)
  ) {
    return trimmed;
  }
  return buildAvatarPlaceholderUrl(displayName);
}
