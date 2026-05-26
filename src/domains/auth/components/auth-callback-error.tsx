"use client";

import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  auth: "We couldn\u2019t complete sign-in. Please try again.",
  expired:
    "Your sign-in link has expired. Request a new one below.",
  rate_limit:
    "Too many attempts. Please wait a minute before trying again.",
};

export function AuthCallbackError() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");

  if (!errorCode || !ERROR_MESSAGES[errorCode]) return null;

  return (
    <div
      className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3"
      role="alert"
    >
      <p className="text-sm text-amber-400">
        {ERROR_MESSAGES[errorCode]}
      </p>
    </div>
  );
}
