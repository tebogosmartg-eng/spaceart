import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { ensureUserProfile, logAuthEvent } from "@/infrastructure/auth/profile-resolution";
import {
  resolveOnboardingRedirect,
  sanitizeRedirect,
} from "@/infrastructure/auth/redirect-policy";

function getOrigin(request: NextRequest | Request): string {
  // 1. Explicit site URL (should be set in Vercel to production domain)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl && !isLocalhostInProduction(siteUrl)) {
    return siteUrl.replace(/\/$/, "");
  }

  // 2. Vercel system URLs (auto-populated in deployments)
  const vercelUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  // 3. Request origin (skip localhost in production)
  const url = new URL(request.url);
  if (url.origin && url.origin !== "null" && !isLocalhostInProduction(url.origin)) {
    return url.origin;
  }

  // 4. Forwarded headers (proxy/load balancer)
  const host =
    (request.headers as Headers).get("x-forwarded-host") ??
    (request.headers as Headers).get("host");
  const proto =
    (request.headers as Headers).get("x-forwarded-proto") ?? "https";
  if (host && !isLocalhostInProduction(`${proto}://${host}`)) {
    return `${proto}://${host}`;
  }

  return url.origin;
}

function isLocalhostInProduction(url: string): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  return /localhost|127\.0\.0\.1/i.test(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getOrigin(request);
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
