import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/infrastructure/supabase/server";
import {
  ensureUserProfile,
  logAuthEvent,
} from "@/infrastructure/auth/profile-resolution";
import type { Profile, UserRole } from "@/shared/types/database";

export type AuthContext = {
  userId: string;
  email: string;
  profile: Profile;
};

export type AuthFailureReason =
  | "unauthenticated"
  | "no_profile"
  | "forbidden"
  | "profile_lookup_error";

export class AuthResolutionError extends Error {
  readonly reason: AuthFailureReason;

  constructor(reason: AuthFailureReason, message: string) {
    super(message);
    this.name = "AuthResolutionError";
    this.reason = reason;
  }
}

export function isAdminRole(role: UserRole | string | null | undefined): boolean {
  return role === "admin";
}

export function isStaffRole(role: UserRole | string | null | undefined): boolean {
  return role === "admin" || role === "moderator";
}

export function canApproveContent(role: UserRole | string | null | undefined): boolean {
  return isAdminRole(role);
}

export function canVerifyCreative(role: UserRole | string | null | undefined): boolean {
  return isAdminRole(role);
}

/** Staff and admins skip creator onboarding gates. */
export function shouldBypassCreatorOnboarding(
  role: UserRole | string | null | undefined
): boolean {
  return isStaffRole(role);
}

async function resolveAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    logAuthEvent("error", "getUser failed", { details: authError.message });
    return null;
  }

  if (!user) return null;

  return buildAuthContext(user);
}

/** Deduped per request — layout + page share one auth round-trip. */
export const getAuthContext = cache(resolveAuthContext);

export async function buildAuthContext(user: User): Promise<AuthContext | null> {
  const profile = await ensureUserProfile(user);

  if (!profile) {
    logAuthEvent("error", "Unable to resolve profile for session", {
      userId: user.id,
      email: user.email,
    });
    return null;
  }

  logAuthEvent("info", "Session resolved", {
    userId: user.id,
    email: user.email,
    role: profile.role,
    onboarding_completed: profile.onboarding_completed,
  });

  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile,
  };
}

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new AuthResolutionError(
      "unauthenticated",
      "Unauthorized: sign in required"
    );
  }
  return ctx;
}

export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!canApproveContent(ctx.profile.role)) {
    logAuthEvent("warn", "Admin authorization denied", {
      userId: ctx.userId,
      role: ctx.profile.role,
    });
    throw new AuthResolutionError(
      "forbidden",
      "Forbidden: admin access required"
    );
  }
  return ctx;
}

export async function requireStaff(): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!isStaffRole(ctx.profile.role)) {
    logAuthEvent("warn", "Staff authorization denied", {
      userId: ctx.userId,
      role: ctx.profile.role,
    });
    throw new AuthResolutionError(
      "forbidden",
      "Forbidden: staff access required"
    );
  }
  return ctx;
}

/** Non-throwing staff check for server pages that must not 500. */
export async function tryGetStaffContext(): Promise<AuthContext | null> {
  try {
    const ctx = await getAuthContext();
    if (!ctx || !isStaffRole(ctx.profile.role)) {
      if (ctx) {
        logAuthEvent("warn", "tryGetStaffContext: not staff", {
          userId: ctx.userId,
          role: ctx.profile.role,
        });
      }
      return null;
    }
    return ctx;
  } catch (e) {
    logAuthEvent("error", "tryGetStaffContext failed", {
      details: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}
