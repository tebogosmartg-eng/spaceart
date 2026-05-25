"use client";

import dynamic from "next/dynamic";

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then((mod) => ({
      default: mod.ReactQueryDevtools,
    })),
  { ssr: false }
);

/** Opt-in devtools panel — no floating button unless explicitly enabled. */
export function QueryDevtools() {
  return <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />;
}
