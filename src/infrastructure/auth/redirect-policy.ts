import {
  isStaffRole,
  shouldBypassCreatorOnboarding,
} from "@/infrastructure/auth/permissions";
import type { UserRole } from "@/shared/types/database";

export function sanitizeRedirect(
  redirect: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!redirect || typeof redirect !== "string") return fallback;
  const path = redirect.split("?")[0] ?? redirect;
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.startsWith("/auth")) return fallback;
  return redirect;
}

/**
 * Post-login / post-callback destination for staff and admins.
 */
export function resolvePostAuthRedirect(
  role: UserRole | string | null | undefined,
  requestedRedirect?: string | null
): string {
  const requested = sanitizeRedirect(requestedRedirect, "/dashboard");

  if (requested.startsWith("/admin")) {
    return isStaffRole(role) ? requested : "/dashboard";
  }

  if (isStaffRole(role) && (requested === "/dashboard" || requested === "/")) {
    return "/admin";
  }

  return requested;
}

export function resolveOnboardingRedirect(
  role: UserRole | string | null | undefined,
  onboardingCompleted: boolean,
  requestedRedirect?: string | null
): string {
  if (
    !onboardingCompleted &&
    !shouldBypassCreatorOnboarding(role)
  ) {
    return "/dashboard/onboarding";
  }
  return resolvePostAuthRedirect(role, requestedRedirect);
}
