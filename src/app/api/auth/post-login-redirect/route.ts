import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { ensureUserProfile } from "@/infrastructure/auth/profile-resolution";
import { resolvePostAuthRedirect, sanitizeRedirect } from "@/infrastructure/auth/redirect-policy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requested = sanitizeRedirect(
    searchParams.get("redirect"),
    "/dashboard"
  );

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ redirect: "/auth/sign-in" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ redirect: "/auth/sign-in" });
  }

  const profile = await ensureUserProfile(user);
  const redirect = resolvePostAuthRedirect(profile?.role, requested);

  return NextResponse.json({ redirect });
}
