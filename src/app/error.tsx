"use client";

import { useEffect } from "react";
import { LinkButton } from "@/shared/ui/link-button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="font-heading text-4xl font-bold">Something went wrong</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        We hit an unexpected error. Please try again.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
        <LinkButton href="/" variant="outline">
          Go home
        </LinkButton>
      </div>
    </div>
  );
}
