import { cache } from "react";
import { createClient } from "@/infrastructure/database/server";
import { isSupabaseConfigured } from "@/infrastructure/database/env";
import {
  isAdminRole,
  isStaffRole,
} from "@/infrastructure/auth/permissions";
import type { UserRole } from "@/shared/types/database";

export type HeaderSession = {
  user: { id: string; email?: string } | null;
  isStaff: boolean;
  isAdmin: boolean;
  role: UserRole | null;
};

async function resolveHeaderSession(): Promise<HeaderSession> {
  if (!isSupabaseConfigured()) {
    return { user: null, isStaff: false, isAdmin: false, role: null };
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      return { user: null, isStaff: false, isAdmin: false, role: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (profile?.role as UserRole | undefined) ?? null;

    return {
      user: { id: user.id, email: user.email },
      isStaff: isStaffRole(role),
      isAdmin: isAdminRole(role),
      role,
    };
  } catch {
    return { user: null, isStaff: false, isAdmin: false, role: null };
  }
}

/** One auth round-trip per request for all header slots. */
export const getHeaderSession = cache(resolveHeaderSession);
