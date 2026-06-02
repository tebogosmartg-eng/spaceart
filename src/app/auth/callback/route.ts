import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { ensureUserProfile, logAuthEvent } from "@/infrastructure/auth/profile-resolution";
import {
  resolveOnboardingRedirect,
  sanitizeRedirect,
} from "@/infrastructure/auth/redirect-policy";
import { resolveRequestOrigin } from "@/shared/config/canonical-url";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = resolveRequestOrigin(request);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const redirect = sanitizeRedirect(searchParams.get("redirect"), "/dashboard");

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/auth/sign-in`);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return await resolvePostAuthDestination(supabase, origin, redirect);
    }

    logAuthEvent("error", "Auth callback PKCE exchange failed", {
      details: error.message,
    });

    const errorType = classifyCallbackError(error.message);
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=${errorType}`
    );
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "magiclink" | "email" | "signup" | "recovery",
    });

    if (!error) {
      return await resolvePostAuthDestination(supabase, origin, redirect);
    }

    logAuthEvent("error", "Auth callback token_hash verification failed", {
      details: error.message,
      type,
    });

    const errorType = classifyCallbackError(error.message);
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=${errorType}`
    );
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth`);
}

function classifyCallbackError(message: string): string {
  if (/expired|invalid.*token/i.test(message)) return "expired";
  if (/rate.?limit/i.test(message)) return "rate_limit";
  return "auth";
}

async function resolvePostAuthDestination(
  supabase: Awaited<ReturnType<typeof createClient>>,
  origin: string,
  redirect: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await ensureUserProfile(user);

    logAuthEvent("info", "Auth callback session established", {
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
