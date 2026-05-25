"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/shared/ui/link-button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/error]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="font-heading text-2xl font-semibold">Admin area error</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "Something went wrong loading the admin console."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <LinkButton href="/dashboard" variant="outline">
          Dashboard
        </LinkButton>
      </div>
    </div>
  );
}
