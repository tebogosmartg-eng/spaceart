/**
 * Client-side check for whether Google OAuth is configured.
 * In production, if Google is not set up in Supabase, we hide the button
 * rather than showing users a broken flow.
 *
 * The env var NEXT_PUBLIC_GOOGLE_AUTH_ENABLED can be set to "true" to show
 * the Google button. If unset or "false", it's hidden.
 */
export function isGoogleAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
}
