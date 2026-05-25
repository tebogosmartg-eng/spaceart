import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { ensureUserProfile, logAuthEvent } from "@/infrastructure/auth/profile-resolution";
import {
  resolveOnboardingRedirect,
  sanitizeRedirect,
} from "@/infrastructure/auth/redirect-policy";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = sanitizeRedirect(searchParams.get("redirect"), "/dashboard");

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/auth/sign-in`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const profile = await ensureUserProfile(user);

        logAuthEvent("info", "Auth callback session", {
          userId: user.id,
          email: user.email,
          role: profile?.role,
          onboarding_completed: profile?.onboarding_completed,
          redirect,
        });

        const destination = resolveOnboardingRedirect(
          profile?.role,
          profile?.onboarding_completed ?? false,
          redirect
        );

        return NextResponse.redirect(`${origin}${destination}`);
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }

    logAuthEvent("error", "Auth callback exchange failed", {
      details: error.message,
    });
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth`);
}
