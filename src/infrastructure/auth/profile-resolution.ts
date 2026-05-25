import type { User } from "@supabase/supabase-js";
import { createClient } from "@/infrastructure/supabase/server";
import { tryCreateAdminClient } from "@/infrastructure/supabase/admin";
import {
  getBootstrapAdminEmail,
  isBootstrapAdminEmail,
} from "@/shared/config/admin-bootstrap";
import type { Profile, UserRole } from "@/shared/types/database";
import { isDevVerbose } from "@/shared/lib/dev-log";

const LOG_PREFIX = "[auth/profile]";

export function logAuthEvent(
  level: "info" | "warn" | "error",
  message: string,
  context?: Record<string, unknown>
) {
  const payload = context ? { message, ...context } : { message };
  if (level === "error") console.error(LOG_PREFIX, payload);
  else if (level === "warn") console.warn(LOG_PREFIX, payload);
  else if (isDevVerbose()) console.info(LOG_PREFIX, payload);
}

function resolveRoleForEmail(email: string | null | undefined): UserRole {
  return isBootstrapAdminEmail(email) ? "admin" : "user";
}

function shouldSkipOnboarding(role: UserRole): boolean {
  return role === "admin" || role === "moderator";
}

/**
 * Ensures every authenticated user has a profiles row.
 * Uses service role when available so bootstrap admin promotion is reliable.
 */
export async function ensureUserProfile(user: User): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    logAuthEvent("error", "Profile lookup failed", {
      userId: user.id,
      email: user.email,
      code: selectError.code,
      details: selectError.message,
    });
    return null;
  }

  if (existing) {
    if (
      isBootstrapAdminEmail(user.email) &&
      existing.role !== "admin"
    ) {
      return repairBootstrapAdminRole(user, existing as Profile);
    }
    return existing as Profile;
  }

  logAuthEvent("warn", "Missing profile row — creating", {
    userId: user.id,
    email: user.email,
  });

  const role = resolveRoleForEmail(user.email);
  const insertPayload = {
    id: user.id,
    email: user.email ?? "",
    full_name:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      null,
    role,
    onboarding_completed: shouldSkipOnboarding(role),
  };

  const adminDb = tryCreateAdminClient();
  const writer = adminDb ?? supabase;

  const { data: inserted, error: insertError } = await writer
    .from("profiles")
    .insert(insertPayload)
    .select("*")
    .single();

  if (insertError) {
    logAuthEvent("error", "Profile insert failed", {
      userId: user.id,
      email: user.email,
      role,
      usedServiceRole: Boolean(adminDb),
      details: insertError.message,
    });
    return null;
  }

  logAuthEvent("info", "Profile row created", {
    userId: user.id,
    email: user.email,
    role: inserted.role,
    onboarding_completed: inserted.onboarding_completed,
  });

  return inserted as Profile;
}

async function repairBootstrapAdminRole(
  user: User,
  profile: Profile
): Promise<Profile | null> {
  logAuthEvent("warn", "Bootstrap admin missing admin role — repairing", {
    userId: user.id,
    email: user.email,
    currentRole: profile.role,
  });

  const adminDb = tryCreateAdminClient() ?? (await createClient());
  const { data, error } = await adminDb
    .from("profiles")
    .update({
      role: "admin",
      onboarding_completed: true,
      email: user.email ?? profile.email,
    })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    logAuthEvent("error", "Bootstrap admin role repair failed", {
      userId: user.id,
      details: error.message,
    });
    return profile;
  }

  logAuthEvent("info", "Bootstrap admin role repaired", {
    userId: user.id,
    email: getBootstrapAdminEmail(),
  });

  return data as Profile;
}
