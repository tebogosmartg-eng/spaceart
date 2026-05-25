"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldOff } from "lucide-react";

export function AdminDeniedBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("admin") !== "denied") return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm"
    >
      <ShieldOff className="mt-0.5 size-4 shrink-0 text-amber-400" />
      <div>
        <p className="font-medium text-amber-100">Admin access denied</p>
        <p className="mt-1 text-muted-foreground">
          Your account does not have staff permissions.{" "}
          <Link href="/forbidden?from=admin" className="text-accent hover:underline">
            Learn more
          </Link>
        </p>
      </div>
    </div>
  );
}
