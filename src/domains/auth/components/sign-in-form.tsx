"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/client";
import { humanizeAuthError, isRateLimitError } from "@/shared/lib/auth-errors";
import { isGoogleAuthEnabled } from "@/shared/lib/auth-providers";
import { useCooldown } from "@/shared/hooks/use-cooldown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MotionReveal } from "@/shared/ui/motion-reveal";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const cooldown = useCooldown(60);
  const signInLockRef = useRef(false);
  const magicLinkLockRef = useRef(false);

  const handlePasswordSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (signInLockRef.current) return;
      signInLockRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(humanizeAuthError(signInError.message));
          if (isRateLimitError(signInError.message)) cooldown.start();
          return;
        }
        const res = await fetch(
          `/api/auth/post-login-redirect?redirect=${encodeURIComponent(redirect)}`
        );
        const data = (await res.json()) as { redirect?: string };
        router.push(data.redirect ?? redirect);
        router.refresh();
      } catch {
        setError("Something went wrong. Please check your connection and try again.");
      } finally {
        setLoading(false);
        signInLockRef.current = false;
      }
    },
    [email, password, redirect, router, cooldown]
  );

  const handleMagicLink = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (magicLinkLockRef.current || cooldown.isCoolingDown) return;
      magicLinkLockRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
          },
        });
        if (otpError) {
          setError(humanizeAuthError(otpError.message));
          if (isRateLimitError(otpError.message)) cooldown.start();
          return;
        }
        cooldown.start();
        setMagicLinkSent(true);
      } catch {
        setError("Something went wrong. Please check your connection and try again.");
      } finally {
        setLoading(false);
        magicLinkLockRef.current = false;
      }
    },
    [email, redirect, cooldown]
  );

  const handleGoogleSignIn = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (oauthError) {
      setError(humanizeAuthError(oauthError.message));
      setLoading(false);
    }
  }, [loading, redirect]);

  if (magicLinkSent) {
    return (
      <MotionReveal>
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
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <p className="text-muted-foreground">
            We&apos;ve sent a magic link to <strong className="text-foreground">{email}</strong>.
            Check your inbox and click the link to sign in.
          </p>
          <p className="text-xs text-muted-foreground/70">
            The link expires in a few minutes. Check your spam folder if you don&apos;t see it.
          </p>
          {cooldown.isCoolingDown ? (
            <p className="text-xs text-muted-foreground">
              You can request a new link in {cooldown.remaining}s
            </p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMagicLinkSent(false)}
              className="text-accent"
            >
              Send another link
            </Button>
          )}
        </div>
      </MotionReveal>
    );
  }

  return (
    <MotionReveal className="space-y-6">
      <Tabs defaultValue="magic">
        <TabsList className="grid w-full grid-cols-2 bg-card">
          <TabsTrigger value="magic">Magic Link</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="magic" className="mt-6">
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magic-email">Email</Label>
              <Input
                id="magic-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="bg-card"
                autoComplete="email"
                inputMode="email"
              />
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
                ? "Sending link\u2026"
                : cooldown.isCoolingDown
                  ? `Wait ${cooldown.remaining}s`
                  : "Send magic link"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="password" className="mt-6">
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
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
                className="bg-card"
                autoComplete="current-password"
              />
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
              {loading ? "Signing in\u2026" : "Sign in"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

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
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            Continue with Google
          </Button>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        New to SPACEART?{" "}
        <Link href="/auth/sign-up" className="text-accent hover:underline">
          Join as a creative
        </Link>
      </p>
    </MotionReveal>
  );
}
