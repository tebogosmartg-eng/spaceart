import { Suspense } from "react";
import { SignInForm } from "@/domains/auth/components/sign-in-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <div>
      <h1 className="text-cinematic text-3xl">Welcome back</h1>
      <p className="mt-3 text-muted-foreground">
        Sign in to manage your creative profile and listings.
      </p>
      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
