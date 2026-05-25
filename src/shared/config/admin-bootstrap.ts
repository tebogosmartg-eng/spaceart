/**
 * Bootstrap admin email — promoted to admin on profile insert (migration 009).
 * Override via SPACEART_BOOTSTRAP_ADMIN_EMAIL (server) or
 * NEXT_PUBLIC_SPACEART_BOOTSTRAP_ADMIN_EMAIL (client-safe read for UI hints only).
 */
const DEFAULT_BOOTSTRAP_ADMIN_EMAIL = "info.hasaawards@gmail.com";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getBootstrapAdminEmail(): string {
  const fromEnv =
    process.env.SPACEART_BOOTSTRAP_ADMIN_EMAIL ??
    process.env.NEXT_PUBLIC_SPACEART_BOOTSTRAP_ADMIN_EMAIL;
  return normalizeEmail(fromEnv?.trim() || DEFAULT_BOOTSTRAP_ADMIN_EMAIL);
}

/** @deprecated Use getBootstrapAdminEmail() — kept for imports that expect a constant. */
export const SPACEART_BOOTSTRAP_ADMIN_EMAIL = getBootstrapAdminEmail();

export function isBootstrapAdminEmail(
  email: string | null | undefined
): boolean {
  if (!email) return false;
  return normalizeEmail(email) === getBootstrapAdminEmail();
}
