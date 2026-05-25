/** When true, empty Supabase results fall back to curated demo content */
export function useDemoFallback(): boolean {
  return process.env.NEXT_PUBLIC_USE_DEMO_CONTENT !== "false";
}
