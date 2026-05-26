import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isStaffRole,
  shouldBypassCreatorOnboarding,
} from "@/infrastructure/auth/permissions";
import { ensureUserProfile, logAuthEvent } from "@/infrastructure/auth/profile-resolution";
import type { Database } from "./types";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const AUTH_PREFIXES = ["/auth/sign-in", "/auth/sign-up"];
const ONBOARDING_PATH = "/dashboard/onboarding";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  function redirectWithSessionCookies(url: URL): NextResponse {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });
    return response;
  }

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("redirect", pathname);
    return redirectWithSessionCookies(url);
  }

  let profile: { role: string; onboarding_completed: boolean } | null = null;

  const needsProfile =
    user &&
    (isAuthRoute ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/dashboard"));

  if (needsProfile) {
    const ensured = await ensureUserProfile(user);
    if (ensured) {
      profile = {
        role: ensured.role,
        onboarding_completed: ensured.onboarding_completed,
      };
    } else {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        logAuthEvent("error", "Middleware profile lookup failed", {
          userId: user.id,
          pathname,
          details: error.message,
        });
      }
      profile = data;
    }
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    const redirectTarget = request.nextUrl.searchParams.get("redirect");
    if (
      redirectTarget?.startsWith("/admin") &&
      isStaffRole(profile?.role)
    ) {
      url.pathname = redirectTarget;
    } else if (isStaffRole(profile?.role)) {
      url.pathname = "/admin";
    } else {
      url.pathname = "/dashboard";
    }
    url.search = "";
    return redirectWithSessionCookies(url);
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      url.searchParams.set("redirect", pathname);
      return redirectWithSessionCookies(url);
    }

    logAuthEvent("info", "Middleware admin gate", {
      userId: user.id,
      email: user.email,
      role: profile?.role ?? "none",
      hasProfile: Boolean(profile),
    });

    if (!isStaffRole(profile?.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/forbidden";
      url.searchParams.set("from", "admin");
      return redirectWithSessionCookies(url);
    }
  }

  if (
    user &&
    pathname.startsWith("/dashboard") &&
    !pathname.startsWith(ONBOARDING_PATH) &&
    pathname !== "/auth/callback"
  ) {
    if (
      profile &&
      !profile.onboarding_completed &&
      !shouldBypassCreatorOnboarding(profile.role)
    ) {
      const url = request.nextUrl.clone();
      url.pathname = ONBOARDING_PATH;
      return redirectWithSessionCookies(url);
    }
  }

  return supabaseResponse;
}
