/** Opt-in verbose development logging (set SPACEART_DEBUG=1 in .env.local). */
export function isDevVerbose(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.SPACEART_DEBUG === "1"
  );
}

/** TanStack Query Devtools UI (set NEXT_PUBLIC_SPACEART_DEVTOOLS=1). */
export function isQueryDevtoolsEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_SPACEART_DEVTOOLS === "1"
  );
}

export function devInfo(...args: unknown[]): void {
  if (isDevVerbose()) console.info(...args);
}

export function devWarn(...args: unknown[]): void {
  if (process.env.NODE_ENV === "development") console.warn(...args);
}
