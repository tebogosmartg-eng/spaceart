"use client";

import { useEffect } from "react";
import { Container } from "@/shared/ui/container";
import { LinkButton } from "@/shared/ui/link-button";

export default function BrowseError({
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
    <Container className="py-24 text-center">
      <h1 className="font-heading text-3xl font-bold">Could not load content</h1>
      <p className="mt-4 text-muted-foreground">{error.message}</p>
      <div className="mt-8 flex justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2 text-sm text-white"
        >
          Retry
        </button>
        <LinkButton href="/" variant="outline">
          Home
        </LinkButton>
      </div>
    </Container>
  );
}
