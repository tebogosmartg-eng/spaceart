"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/client";
import { initializeCreativeAccount } from "@/domains/auth/actions/auth-actions";
import { humanizeAuthError, isRateLimitError } from "@/shared/lib/auth-errors";
import { isGoogleAuthEnabled } from "@/shared/lib/auth-providers";
import { useCooldown } from "@/shared/hooks/use-cooldown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const cooldown = useCooldown(60);
  const submittingRef = useRef(false);

  const handleSignUp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submittingRef.current) return;
      submittingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/dashboard/onboarding")}`,
          },
        });

        if (signUpError) {
          setError(humanizeAuthError(signUpError.message));
          if (isRateLimitError(signUpError.message)) cooldown.start();
          return;
        }

        // Detect silent failures: SDK returns success but no email will be sent
        const identities = data.user?.identities ?? [];
        if (data.user && identities.length === 0) {
          setError(
            "An account with this email already exists. Try signing in instead."
          );
          return;
        }

        if (!data.user && !data.session) {
          setError(
            "We\u2019re temporarily unable to create your account. Please wait a moment and try again."
          );
          cooldown.start();
          return;
        }

        setSuccess(true);
        cooldown.start();
        try {
          await initializeCreativeAccount();
        } catch {
          // Profile promotion may run on first dashboard visit if env not ready
        }
        router.push("/dashboard/profile");
        router.refresh();
      } catch {
        setError(
          "Something went wrong during signup. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
        submittingRef.current = false;
      }
    },
    [email, password, fullName, router, cooldown]
  );

  const handleGoogleSignUp = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard/profile`,
      },
    });
    if (oauthError) {
      setError(humanizeAuthError(oauthError.message));
      setLoading(false);
    }
  }, [loading]);

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <svg
            className="h-6 w-6 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-muted-foreground">
          We&apos;ve sent a confirmation email to{" "}
          <strong className="text-foreground">{email}</strong>.
        </p>
        <p className="text-xs text-muted-foreground/70">
          Click the link in your email to verify your account and complete your creative profile.
          Check your spam folder if you don&apos;t see it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="bg-card"
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-card"
            autoComplete="email"
            inputMode="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="bg-card"
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">
            At least 8 characters
          </p>
        </div>
        {error && (
          <p className="text-sm text-amber-400" role="alert">
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="accent"
          className="w-full"
          disabled={loading || cooldown.isCoolingDown}
        >
          {loading
            ? "Creating account\u2026"
            : cooldown.isCoolingDown
              ? `Wait ${cooldown.remaining}s`
              : "Join SpaceArt"}
        </Button>
      </form>

      {isGoogleAuthEnabled() && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            Continue with Google
          </Button>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
