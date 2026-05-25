"use client";

import { useTransition } from "react";
import { signOutAction } from "@/domains/auth/actions/auth-actions";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  variant?: "ghost" | "outline";
  className?: string;
}

export function SignOutButton({
  variant = "ghost",
  className,
}: SignOutButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={className}
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
    >
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
